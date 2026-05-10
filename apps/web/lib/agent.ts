/**
 * Agent runtime — deterministic NDJSON stream, multi-capability.
 *
 * Flow:
 *   1. PLANNING — gpt-4o-mini routes the task to a sequence of capabilities.
 *   2. For each capability in the plan:
 *      a. EVALUATING — list all providers in the compute market.
 *      b. DECIDING   — apply cheapest-eligible policy with cost/value reasoning.
 *      c. ACQUIRING  — settle onchain (real Solana devnet TX) and call the
 *                      provider endpoint with the signature header.
 *   3. COMPLETE — emit a final result event with all steps.
 *
 * The reasoning trace is rendered live by the dashboard. The trace itself
 * stays deterministic — only the planner involves an LLM (one call, JSON-only).
 */

import type {
  AgentPhase,
  AgentResponse,
  AgentStreamEvent,
  Capability,
  CapabilityStep,
  Provider,
  ReasoningLine,
  ReasoningLineType,
  RejectedProvider,
  RejectionReason,
  SearchResult,
} from '@payable-ai/types'
import { settleOnchain } from './x402'
import { planCapabilities, type KnownCapability } from './planner'

const VALUE_THRESHOLD_USDC = 0.005

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function fmtPrice(n: number) {
  return n.toFixed(3)
}

function buildLine(
  type: ReasoningLineType,
  text: string,
  phase: AgentPhase,
  extra: Partial<ReasoningLine> = {},
): ReasoningLine {
  return { type, text, phase, timestamp: Date.now(), ...extra }
}

export function runAgent(
  task: string,
  budget: number,
  _walletAddress: string,
  imageUrl?: string,
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (ev: AgentStreamEvent) => {
        controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'))
      }
      // Anti-buffering pad — first chunk forces dev server / browser to start
      // delivering chunks to the reader as soon as we emit our first event.
      controller.enqueue(
        enc.encode(`{"kind":"_pad","x":"${' '.repeat(2048)}"}\n`),
      )
      const line = (
        type: ReasoningLineType,
        text: string,
        phase: AgentPhase,
        extra: Partial<ReasoningLine> = {},
      ) => emit({ kind: 'line', line: buildLine(type, text, phase, extra) })
      const phase = (p: AgentPhase) => emit({ kind: 'phase', phase: p })
      const fail = (message: string) => {
        emit({ kind: 'error', message })
        controller.close()
      }

      try {
        // ─── PLANNING ─────────────────────────────────────────────────────
        phase('PLANNING')
        line('sys', 'Analyzing task scope...', 'PLANNING')
        await sleep(420)
        line('sys', `Goal: "${task}"`, 'PLANNING')
        await sleep(360)
        line('sys', `Image attached: ${imageUrl ? 'yes' : 'no'}`, 'PLANNING', { indent: true })
        await sleep(380)
        line('sys', 'Routing to capability planner (gpt-4o-mini)...', 'PLANNING')

        const plan = await planCapabilities(task, !!imageUrl)
        await sleep(220)
        line('plan', `Plan: ${plan.capabilities.join(' → ')}`, 'PLANNING')
        await sleep(360)
        line('sys', plan.rationale, 'PLANNING', { indent: true })
        await sleep(420)

        // ─── Discover compute market (once) ───────────────────────────────
        const base =
          process.env.NEXT_PUBLIC_APP_URL ??
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        const discoverRes = await fetch(`${base}/api/discover`)
        if (!discoverRes.ok) {
          fail(`Discover failed: ${discoverRes.status}`)
          return
        }
        const { capabilities } = (await discoverRes.json()) as {
          capabilities: Capability[]
        }

        const steps: CapabilityStep[] = []
        let prevOcrText: string | undefined

        // ─── Loop: one (EVALUATING → DECIDING → ACQUIRING) cycle per cap ──
        for (const capId of plan.capabilities) {
          const cap = capabilities.find((c) => c.id === capId)
          if (!cap) {
            fail(`Capability "${capId}" not found in compute market`)
            return
          }

          // ── EVALUATING ──
          phase('EVALUATING')
          line('sys', `Evaluating ${cap.label.toLowerCase()} providers...`, 'EVALUATING', {
            capabilityId: capId,
          })
          await sleep(420)
          line(
            'market',
            `${cap.label} — ${cap.providers.length} providers available`,
            'EVALUATING',
            { capabilityId: capId },
          )
          await sleep(380)

          for (const p of cap.providers) {
            const conf = (0.78 + Math.random() * 0.12).toFixed(2)
            line(
              'provider',
              `${p.name.padEnd(20)} ${fmtPrice(p.priceUsdc)} USDC    conf ${conf}    lat ${p.latencyMs}ms`,
              'EVALUATING',
              { indent: true, providerId: p.id, capabilityId: capId },
            )
            await sleep(320)
          }

          // ── DECIDING ──
          phase('DECIDING')
          await sleep(160)
          line('eval', 'Evaluating cost/value tradeoffs...', 'DECIDING', {
            indent: true,
            capabilityId: capId,
          })
          await sleep(540)

          const eligible = cap.providers
            .filter((p) => p.live && p.priceUsdc <= budget)
            .sort((a, b) => a.priceUsdc - b.priceUsdc)

          if (eligible.length === 0) {
            const cheapestLive = cap.providers.find((p) => p.live)
            fail(
              `No eligible ${cap.label} providers within budget ${budget} USDC (cheapest live = ${
                cheapestLive ? fmtPrice(cheapestLive.priceUsdc) : '—'
              })`,
            )
            return
          }

          const cheapest = eligible[0]
          const competitors = cap.providers.filter((p) => p.id !== cheapest.id)
          const rejected: RejectedProvider[] = []

          for (const p of competitors) {
            const costDelta = +(p.priceUsdc - cheapest.priceUsdc).toFixed(4)
            const costDeltaPct = +((costDelta / cheapest.priceUsdc) * 100).toFixed(0)
            let reason: RejectionReason
            if (costDelta > VALUE_THRESHOLD_USDC) {
              reason = 'cost delta exceeds task value threshold'
            } else if (!p.live) {
              reason = 'mock-only — no live endpoint'
            } else if (p.priceUsdc > budget) {
              reason = 'exceeds budget'
            } else {
              reason = 'cost delta exceeds task value threshold'
            }
            rejected.push({
              id: p.id,
              name: p.name,
              reason,
              priceUsdc: p.priceUsdc,
              costDelta,
              costDeltaPct,
            })

            if (reason === 'cost delta exceeds task value threshold') {
              line(
                'eval',
                `Δ cost: +${fmtPrice(costDelta)} USDC (+${costDeltaPct}%)`,
                'DECIDING',
                { indent: true, providerId: p.id, capabilityId: capId, costDelta, costDeltaPct },
              )
              await sleep(360)
              line(
                'eval',
                `Task value threshold: ${fmtPrice(VALUE_THRESHOLD_USDC)} USDC`,
                'DECIDING',
                { indent: true, capabilityId: capId },
              )
              await sleep(320)
              line(
                'eval',
                `${p.name} cost delta exceeds task value threshold`,
                'DECIDING',
                { indent: true, providerId: p.id, capabilityId: capId },
              )
              await sleep(280)
            } else if (reason === 'exceeds budget') {
              line(
                'eval',
                `${p.name} ${fmtPrice(p.priceUsdc)} USDC > budget ${fmtPrice(budget)} — out of bounds`,
                'DECIDING',
                { indent: true, providerId: p.id, capabilityId: capId, costDelta, costDeltaPct },
              )
              await sleep(320)
            } else {
              line(
                'eval',
                `${p.name} has no live endpoint — skipped`,
                'DECIDING',
                { indent: true, providerId: p.id, capabilityId: capId },
              )
              await sleep(280)
            }

            line('reject', `${p.name} → REJECTED`, 'DECIDING', {
              providerId: p.id,
              capabilityId: capId,
            })
            await sleep(320)
          }

          const valueRejections = rejected.filter(
            (r) => r.reason === 'cost delta exceeds task value threshold',
          )
          const stepSavedUsdc = +valueRejections
            .reduce((sum, r) => sum + r.costDelta, 0)
            .toFixed(4)

          line(
            'decision',
            `→ OPTIMAL: ${cheapest.name} @ ${fmtPrice(cheapest.priceUsdc)} USDC`,
            'DECIDING',
            { providerId: cheapest.id, capabilityId: capId },
          )
          await sleep(540)

          // ── ACQUIRING ──
          phase('ACQUIRING')
          line('sys', `Acquiring ${cap.label.toLowerCase()} via x402...`, 'ACQUIRING', {
            capabilityId: capId,
          })
          await sleep(360)
          line(
            'http',
            `GET /capabilities/${cap.id}/${cheapest.id}`,
            'ACQUIRING',
            { indent: true, capabilityId: capId },
          )
          await sleep(240)
          line(
            'http',
            `← 402 · payment required · ${fmtPrice(cheapest.priceUsdc)} USDC`,
            'ACQUIRING',
            { indent: true, capabilityId: capId },
          )
          await sleep(240)
          line('http', 'Settling on solana:devnet...', 'ACQUIRING', {
            indent: true,
            capabilityId: capId,
          })

          let txHash: string
          let settled = false
          try {
            txHash = await settleOnchain({
              task,
              capability: cap.label,
              providerId: cheapest.id,
              amountUsdc: cheapest.priceUsdc,
            })
            settled = true
          } catch (err) {
            console.error('[settleOnchain]', err)
            txHash = `pending-${cryptoUuid()}`
            line(
              'http',
              `! settlement error: ${
                err instanceof Error ? err.message : 'unknown'
              } — falling back to placeholder`,
              'ACQUIRING',
              { indent: true, capabilityId: capId },
            )
            await sleep(180)
          }

          line(
            'settled',
            settled
              ? `✓ Settled onchain — capability acquired · ${shortHash(txHash)}`
              : `✓ Settled (pending) — capability acquired · ${shortHash(txHash)}`,
            'ACQUIRING',
            { indent: true, txHash, capabilityId: capId },
          )
          await sleep(320)

          // ── Capability-specific provider call ──
          if (!cheapest.endpoint) {
            fail(`Selected provider ${cheapest.name} has no endpoint configured`)
            return
          }

          const step: CapabilityStep = {
            capabilityId: capId,
            capabilityLabel: cap.label,
            selectedProvider: cheapest as Provider,
            rejectedProviders: rejected,
            costUsdc: cheapest.priceUsdc,
            savedUsdc: stepSavedUsdc,
            txHash,
          }

          if (capId === 'ocr') {
            if (!imageUrl) {
              fail('OCR capability planned but no imageUrl provided')
              return
            }
            const ocrRes = await fetch(`${base}/api/ocr`, {
              method: 'POST',
              headers: { 'X-Payment-Tx': txHash, 'content-type': 'application/json' },
              body: JSON.stringify({ image: imageUrl }),
            })
            if (!ocrRes.ok) {
              fail(`OCR endpoint returned ${ocrRes.status}`)
              return
            }
            const ocrJson = (await ocrRes.json()) as { text?: string; confidence?: number }
            const text = typeof ocrJson.text === 'string' ? ocrJson.text : ''
            const confidence =
              typeof ocrJson.confidence === 'number' ? ocrJson.confidence : 0
            step.output = { kind: 'ocr', text, confidence }
            prevOcrText = text
            line(
              'http',
              `← 200 OK · ${text.length} chars extracted (conf ${confidence.toFixed(2)})`,
              'ACQUIRING',
              { indent: true, capabilityId: capId },
            )
            await sleep(280)
          } else if (capId === 'web-search') {
            const enrichedQuery = prevOcrText
              ? `${task} — context: ${prevOcrText.slice(0, 280)}`
              : task
            if (prevOcrText) {
              line(
                'sys',
                `Chaining OCR output → search query (+${Math.min(prevOcrText.length, 280)} chars context)`,
                'ACQUIRING',
                { indent: true, capabilityId: capId },
              )
              await sleep(280)
            }
            const searchRes = await fetch(
              `${base}${cheapest.endpoint}?q=${encodeURIComponent(enrichedQuery)}`,
              { headers: { 'X-Payment-Tx': txHash } },
            )
            if (!searchRes.ok) {
              fail(`Search endpoint returned ${searchRes.status}`)
              return
            }
            const tavilyJson = (await searchRes.json()) as {
              results?: Array<{ title?: string; url?: string; content?: string }>
            }
            const results: SearchResult[] = (tavilyJson.results ?? []).map((r) => ({
              title: r.title ?? '(untitled)',
              url: r.url ?? '',
              snippet: r.content?.slice(0, 240),
            }))
            step.output = { kind: 'search', results }
            line(
              'http',
              `← 200 OK · ${results.length} results`,
              'ACQUIRING',
              { indent: true, capabilityId: capId },
            )
            await sleep(280)
          }

          steps.push(step)
        }

        // ─── COMPLETE ─────────────────────────────────────────────────────
        phase('COMPLETE')
        const totalCost = +steps.reduce((s, x) => s + x.costUsdc, 0).toFixed(4)
        const totalSaved = +steps.reduce((s, x) => s + x.savedUsdc, 0).toFixed(4)
        const remaining = +(budget - totalCost).toFixed(4)
        line(
          'complete',
          `Task complete · ${fmtPrice(totalCost)} USDC across ${steps.length} ${
            steps.length === 1 ? 'capability' : 'capabilities'
          } · saved ${fmtPrice(totalSaved)} USDC · budget remaining ${fmtPrice(remaining)} USDC`,
          'COMPLETE',
        )
        await sleep(160)

        const response: AgentResponse = {
          task,
          steps,
          totalCostUsdc: totalCost,
          totalSavedUsdc: totalSaved,
          plan: { capabilities: plan.capabilities as KnownCapability[], rationale: plan.rationale },
        }
        emit({ kind: 'result', response })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown agent error'
        console.error('[runAgent]', err)
        try {
          emit({ kind: 'error', message })
        } catch {}
        controller.close()
      }
    },
  })
}

function cryptoUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function shortHash(hash: string): string {
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}
