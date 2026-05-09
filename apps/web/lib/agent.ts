/**
 * AI Agent — Economic Reasoning Layer
 *
 * This is the core of Payable.ai. The agent:
 * 1. Receives a task + budget from the user
 * 2. Discovers available payable APIs via /api/discover
 * 3. Evaluates each API: price vs budget, latency vs task complexity
 * 4. Makes an economic decision: selects the best API within budget
 * 5. Pays automatically via x402 (no human intervention)
 * 6. Returns results + full reasoning trace
 *
 * The key insight: agents don't just USE tools — they REASON about cost.
 */

import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import type { PayableAPI } from '@payable-ai/types'

/** Returns a streamText result for the agent task using the payableSearch tool. */
export function createAgentStream(task: string, budget: number, walletAddress: string) {
  return streamText({
    model: openai('gpt-4o-mini'),
    system: `You are an autonomous AI agent with a budget of $${budget} USDC.
Your job is to complete tasks by discovering and paying for APIs using the x402 protocol.
Always reason about cost before acting. Only call APIs you can afford.
Wallet: ${walletAddress}`,
    prompt: task,
    tools: {
      payableSearch: tool({
        description:
          'Discover payable search APIs, select the cheapest option within budget, and execute a search query.',
        parameters: z.object({
          query: z.string().describe('The search query to execute'),
        }),
        execute: async ({ query }) => {
          // TODO: Use x402/fetch with automatic payment once CDP credentials are set
          const discoverRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/discover`
          )
          const { apis } = (await discoverRes.json()) as { apis: PayableAPI[] }

          const affordable = apis
            .filter((api) => api.priceUsdc <= budget)
            .sort((a, b) => a.priceUsdc - b.priceUsdc)

          if (affordable.length === 0) {
            return { error: 'No APIs available within budget', budget, cheapestAvailable: apis[0]?.priceUsdc }
          }

          const selected = affordable[0]

          const searchRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${selected.endpoint}?q=${encodeURIComponent(query)}`
          )

          if (!searchRes.ok) {
            return {
              error: `Search endpoint returned ${searchRes.status}`,
              selectedApi: selected.name,
              hint: '402 means payment header is required — x402/fetch handles this automatically',
            }
          }

          const results = await searchRes.json()
          return {
            selectedApi: selected.name,
            priceUsdc: selected.priceUsdc,
            query,
            results,
          }
        },
      }),
    },
    maxSteps: 5,
  })
}
