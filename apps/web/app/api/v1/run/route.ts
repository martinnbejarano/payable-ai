/**
 * POST /api/v1/run — Public-facing demo endpoint.
 *
 * Same shape as /api/agent but returns a single JSON AgentResponse instead of
 * an NDJSON stream. Designed for copy-paste curl from the dashboard's
 * IntegrateSnippet card.
 *
 * Two modes:
 *   - demo  (no walletAddress): returns a synthetic AgentResponse from
 *           lib/v1-demo.ts. No onchain settlement. Latency ~800ms.
 *   - live  (walletAddress provided): wraps runAgent(), drains the NDJSON
 *           stream, and returns the final result event.
 *
 * Production note: this endpoint has no rate limiting or auth. Before
 * exposing publicly, add an API key check + per-key rate limit.
 */

import { type NextRequest } from 'next/server'
import type { AgentResponse, AgentStreamEvent } from '@payable-ai/types'
import { runAgent } from '@/lib/agent'
import { buildDemoResponse } from '@/lib/v1-demo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface RunBody {
  task: string
  budget?: number
  walletAddress?: string
  imageUrl?: string
}

function isValidImageUrl(s: string): boolean {
  return (
    s.startsWith('/') ||
    s.startsWith('data:image/') ||
    s.startsWith('http://') ||
    s.startsWith('https://')
  )
}

async function drainAgent(
  task: string,
  budget: number,
  walletAddress: string,
  imageUrl: string | undefined,
): Promise<AgentResponse> {
  const stream = runAgent(task, budget, walletAddress, imageUrl)
  const reader = stream.getReader()
  const dec = new TextDecoder()
  let buffer = ''
  let result: AgentResponse | null = null
  let errorMsg: string | null = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += dec.decode(value, { stream: true })
    let idx = buffer.indexOf('\n')
    while (idx >= 0) {
      const raw = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      idx = buffer.indexOf('\n')
      if (!raw) continue
      try {
        const ev = JSON.parse(raw) as AgentStreamEvent | { kind: '_pad' }
        if (ev.kind === 'result') result = ev.response
        else if (ev.kind === 'error') errorMsg = ev.message
      } catch {
        // ignore malformed line
      }
    }
  }

  if (errorMsg) throw new Error(errorMsg)
  if (!result) throw new Error('Agent stream closed without a result event')
  return result
}

export async function POST(request: NextRequest) {
  let body: RunBody
  try {
    body = (await request.json()) as RunBody
  } catch {
    return Response.json(
      { error: 'Invalid JSON body', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const { task, budget, walletAddress, imageUrl } = body

  if (!task || typeof task !== 'string' || !task.trim()) {
    return Response.json(
      { error: 'Missing or invalid field: task', code: 'INVALID_TASK' },
      { status: 400 },
    )
  }
  if (budget !== undefined && (typeof budget !== 'number' || budget <= 0)) {
    return Response.json(
      { error: 'Invalid field: budget (must be a positive number)', code: 'INVALID_BUDGET' },
      { status: 400 },
    )
  }
  if (imageUrl !== undefined) {
    if (typeof imageUrl !== 'string' || !imageUrl || !isValidImageUrl(imageUrl)) {
      return Response.json(
        { error: 'imageUrl must be a /public path, data: URL, or http(s) URL', code: 'INVALID_IMAGE_URL' },
        { status: 400 },
      )
    }
  }

  const effectiveBudget = budget ?? 0.01
  const isDemoMode = !walletAddress || process.env.PAYABLE_DEMO_FORCE === '1'

  if (isDemoMode) {
    await sleep(800)
    return Response.json(buildDemoResponse(task.trim(), !!imageUrl))
  }

  try {
    const response = await drainAgent(task.trim(), effectiveBudget, walletAddress!, imageUrl)
    return Response.json(response)
  } catch (err) {
    console.error('[/api/v1/run]', err)
    const message = err instanceof Error ? err.message : 'Agent failed'
    return Response.json({ error: message, code: 'AGENT_ERROR' }, { status: 500 })
  }
}
