/**
 * POST /api/agent
 *
 * Accepts { task, budget, walletAddress } and streams agent reasoning + result
 * events back as NDJSON (one JSON-encoded AgentStreamEvent per line).
 */

import { type NextRequest } from 'next/server'
import { runAgent } from '@/lib/agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, budget, walletAddress } = body as {
      task: string
      budget: number
      walletAddress: string
    }

    if (!task || typeof task !== 'string') {
      return Response.json(
        { error: 'Missing or invalid field: task', code: 'INVALID_TASK' },
        { status: 400 }
      )
    }
    if (typeof budget !== 'number' || budget <= 0) {
      return Response.json(
        { error: 'Missing or invalid field: budget (must be a positive number)', code: 'INVALID_BUDGET' },
        { status: 400 }
      )
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return Response.json(
        { error: 'Missing or invalid field: walletAddress', code: 'INVALID_WALLET' },
        { status: 400 }
      )
    }

    return new Response(runAgent(task, budget, walletAddress), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Encoding': 'identity',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    console.error('[/api/agent]', err)
    return Response.json(
      { error: 'Agent failed to start', code: 'AGENT_ERROR' },
      { status: 500 }
    )
  }
}
