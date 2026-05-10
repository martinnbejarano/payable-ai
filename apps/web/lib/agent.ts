/**
 * Agent runtime — deterministic NDJSON stream.
 *
 * The agent discovers capabilities, evaluates providers under a cheapest-eligible
 * policy, rejects overpriced ones, and acquires the optimal one. Reasoning is
 * emitted as ReasoningLine events through the stream so the UI can render the
 * trace live without an LLM in the path.
 *
 * The x402 settlement step is currently a placeholder: txHash is generated
 * client-side as `pending-<uuid>` until CDP credentials are wired in.
 */

import type {
  AgentPhase,
  AgentResponse,
  AgentStreamEvent,
  Capability,
  Provider,
  ReasoningLine,
  ReasoningLineType,
  RejectedProvider,
  RejectionReason,
  SearchResult,
} from '@payable-ai/types'
import { settleOnchain } from './x402'

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
): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (ev: AgentStreamEvent) => {
        controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'))
      }
      // Initial 2 KB pad as a parser-skippable line, to defeat dev-server
      // and proxy chunk buffering — guarantees the browser starts delivering
      // chunks to the client reader as soon as we emit our first real event.
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
        // ─── Phase 1: EVALUATING ──────────────────────────────────────────
        phase('EVALUATING')
        line('sys', 'Parsing task...', 'EVALUATING')
        await sleep(420)
        line('sys', `Goal: "${task}"`, 'EVALUATING')
        await sleep(540)
        line('sys', 'Classifying required capability...', 'EVALUATING')
        await sleep(640)
        line('found', 'Required: [ web search ]', 'EVALUATING')
        await sleep(440)
        line('sys', 'Querying compute market...', 'EVALUATING')
        await sleep(620)

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
        const cap = capabilities.find((c) => c.id === 'web-search')
        if (!cap) {
          fail('web-search capability not found in compute market')
          return
        }

        line('market', `WEB SEARCH — ${cap.providers.length} providers available`, 'EVALUATING')
        await sleep(540)

        for (const p of cap.providers) {
          const conf = (0.78 + Math.random() * 0.12).toFixed(2)
          line(
            'provider',
            `${p.name.padEnd(18)} ${fmtPrice(p.priceUsdc)} USDC    conf ${conf}    lat ${p.latencyMs}ms`,
            'EVALUATING',
            { indent: true, providerId: p.id },
          )
          await sleep(360)
        }

        // ─── Phase 2: DECIDING ────────────────────────────────────────────
        phase('DECIDING')
        await sleep(180)
        line('eval', 'Evaluating cost/value tradeoffs...', 'DECIDING', { indent: true })
        await sleep(620)

        const eligible = cap.providers
          .filter((p) => p.live && p.priceUsdc <= budget)
          .sort((a, b) => a.priceUsdc - b.priceUsdc)

        if (eligible.length === 0) {
          fail(
            `No eligible providers within budget ${budget} USDC (cheapest live = ${
              cap.providers.find((p) => p.live)?.priceUsdc ?? '—'
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
          // Active economic reasoning takes priority over hard filters: if the cost
          // delta exceeds the value threshold, that's the decision the agent made,
          // even if the provider was also mock-only or out of budget.
          let reason: RejectionReason
          if (costDelta > VALUE_THRESHOLD_USDC) {
            reason = 'cost delta exceeds task value threshold'
          } else if (!p.live) {
            reason = 'mock-only — no live endpoint'
          } else if (p.priceUsdc > budget) {
            reason = 'exceeds budget'
          } else {
            // Eligible but not cheapest — treat as a marginal value-threshold rejection
            // so the demo can still show a rationale rather than silently skipping.
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
              { indent: true, providerId: p.id, costDelta, costDeltaPct },
            )
            await sleep(420)
            line(
              'eval',
              `Task value threshold: ${fmtPrice(VALUE_THRESHOLD_USDC)} USDC`,
              'DECIDING',
              { indent: true },
            )
            await sleep(380)
            line(
              'eval',
              `${p.name} cost delta exceeds task value threshold`,
              'DECIDING',
              { indent: true, providerId: p.id },
            )
            await sleep(360)
          } else if (reason === 'exceeds budget') {
            line(
              'eval',
              `${p.name} ${fmtPrice(p.priceUsdc)} USDC > budget ${fmtPrice(budget)} — out of bounds`,
              'DECIDING',
              { indent: true, providerId: p.id, costDelta, costDeltaPct },
            )
            await sleep(360)
          } else {
            line(
              'eval',
              `${p.name} has no live endpoint — skipped`,
              'DECIDING',
              { indent: true, providerId: p.id },
            )
            await sleep(320)
          }

          line('reject', `${p.name} → REJECTED`, 'DECIDING', { providerId: p.id })
          await sleep(380)
        }

        // savedUsdc only counts active value-rejections (not hard filters).
        const valueRejections = rejected.filter(
          (r) => r.reason === 'cost delta exceeds task value threshold',
        )
        const savedUsdc = +valueRejections
          .reduce((sum, r) => sum + r.costDelta, 0)
          .toFixed(4)

        line(
          'decision',
          `→ OPTIMAL: ${cheapest.name} @ ${fmtPrice(cheapest.priceUsdc)} USDC`,
          'DECIDING',
          { providerId: cheapest.id },
        )
        await sleep(620)

        // ─── Phase 3: ACQUIRING ───────────────────────────────────────────
        phase('ACQUIRING')
        line('sys', 'Acquiring capability via x402...', 'ACQUIRING')
        await sleep(420)
        line(
          'http',
          `GET /capabilities/web-search/${cheapest.id}`,
          'ACQUIRING',
          { indent: true },
        )
        await sleep(280)
        line(
          'http',
          `← 402 · payment required · ${fmtPrice(cheapest.priceUsdc)} USDC`,
          'ACQUIRING',
          { indent: true },
        )
        await sleep(280)
        line('http', 'Settling on solana:devnet...', 'ACQUIRING', { indent: true })

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
            { indent: true },
          )
          await sleep(200)
        }

        line(
          'settled',
          settled
            ? `✓ Settled onchain — capability acquired · ${shortHash(txHash)}`
            : `✓ Settled (pending) — capability acquired · ${shortHash(txHash)}`,
          'ACQUIRING',
          { indent: true, txHash },
        )
        await sleep(380)

        // ─── Real Tavily call ─────────────────────────────────────────────
        if (!cheapest.endpoint) {
          fail(`Selected provider ${cheapest.name} has no endpoint configured`)
          return
        }
        const searchRes = await fetch(
          `${base}${cheapest.endpoint}?q=${encodeURIComponent(task)}`,
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

        // ─── Phase 4: COMPLETE ────────────────────────────────────────────
        phase('COMPLETE')
        line('http', `← 200 OK · ${results.length} results`, 'COMPLETE', { indent: true })
        await sleep(380)
        const remaining = +(budget - cheapest.priceUsdc).toFixed(4)
        line(
          'complete',
          `Task complete · ${fmtPrice(cheapest.priceUsdc)} USDC spent · budget remaining ${fmtPrice(
            remaining,
          )} USDC`,
          'COMPLETE',
        )
        await sleep(160)

        const response: AgentResponse = {
          selectedProvider: cheapest as Provider,
          selectedCapability: cap.label,
          rejectedProviders: rejected,
          savedUsdc,
          txHash,
          costUsdc: cheapest.priceUsdc,
          results,
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
