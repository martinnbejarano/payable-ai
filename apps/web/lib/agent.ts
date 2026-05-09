/**
 * AI Agent — Economic Reasoning Layer
 *
 * The agent discovers capabilities (not individual APIs), evaluates providers
 * within each capability by cost/value, rejects overpriced options, and
 * acquires the cheapest eligible one via x402.
 */

import { openai } from '@ai-sdk/openai'
import { streamText, tool } from 'ai'
import { z } from 'zod'
import type { Capability } from '@payable-ai/types'

export function createAgentStream(task: string, budget: number, walletAddress: string) {
  return streamText({
    model: openai('gpt-4o-mini'),
    system: `You are an autonomous AI agent with a budget of $${budget} USDC.
Your job is to complete tasks by discovering capabilities from a compute market and acquiring the cheapest eligible provider via the x402 protocol.
Always reason about cost/value before acting. Reject providers whose cost delta exceeds task value threshold.
Wallet: ${walletAddress}`,
    prompt: task,
    tools: {
      payableSearch: tool({
        description:
          'Query the compute market for web-search capability, select the cheapest eligible provider, acquire it via x402, and execute the query.',
        parameters: z.object({
          query: z.string().describe('The search query to execute'),
        }),
        execute: async ({ query }) => {
          const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
          const discoverRes = await fetch(`${base}/api/discover`)
          const { capabilities } = (await discoverRes.json()) as { capabilities: Capability[] }

          const searchCap = capabilities.find((c) => c.id === 'web-search')
          if (!searchCap) {
            return { error: 'web-search capability not found in compute market' }
          }

          const eligible = searchCap.providers
            .filter((p) => p.priceUsdc <= budget)
            .sort((a, b) => a.priceUsdc - b.priceUsdc)

          const rejected = searchCap.providers.filter((p) => p.priceUsdc > budget)

          if (eligible.length === 0) {
            return {
              error: 'No providers within budget',
              budget,
              cheapestAvailable: searchCap.providers[0]?.priceUsdc,
            }
          }

          const selected = eligible[0]
          const rejectedProviders = rejected.map((p) => p.name)
          const savedUsdc = rejected.reduce((sum, p) => sum + (p.priceUsdc - selected.priceUsdc), 0)

          if (!selected.endpoint) {
            return {
              error: 'Selected provider has no live endpoint (mock only)',
              selectedProvider: selected.name,
              rejectedProviders,
              savedUsdc,
            }
          }

          // TODO: replace with createX402Fetch from lib/x402.ts once CDP credentials are set
          const searchRes = await fetch(`${base}${selected.endpoint}?q=${encodeURIComponent(query)}`)

          if (!searchRes.ok) {
            return {
              error: `Search endpoint returned ${searchRes.status}`,
              selectedProvider: selected.name,
              rejectedProviders,
              savedUsdc,
              hint: '402 means payment proof required — x402/fetch handles this automatically',
            }
          }

          const results = await searchRes.json()
          return {
            selectedProvider: selected.name,
            selectedCapability: searchCap.label,
            priceUsdc: selected.priceUsdc,
            rejectedProviders,
            savedUsdc: parseFloat(savedUsdc.toFixed(4)),
            query,
            results,
          }
        },
      }),
    },
    maxSteps: 5,
  })
}
