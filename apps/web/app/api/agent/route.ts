/**
 * POST /api/agent
 *
 * Accepts { task, budget, walletAddress } and streams an AI agent response
 * using Vercel AI SDK. The agent uses the `payableSearch` tool to discover
 * APIs, pick the cheapest within budget, pay via x402, and return results.
 *
 * Flow:
 *   1. Parse and validate the request body
 *   2. Create a streamText agent via lib/agent.ts
 *   3. The agent calls payableSearch tool as needed
 *   4. Stream the response back using toDataStreamResponse()
 */

import { type NextRequest } from 'next/server'
import { createAgentStream } from '@/lib/agent'

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

    const result = createAgentStream(task, budget, walletAddress)
    return result.toDataStreamResponse()
  } catch (err) {
    console.error('[/api/agent]', err)
    return Response.json(
      { error: 'Agent failed to start', code: 'AGENT_ERROR' },
      { status: 500 }
    )
  }
}
