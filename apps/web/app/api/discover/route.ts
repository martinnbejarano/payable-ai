import { NextResponse } from 'next/server'
import type { PayableAPI } from '@payable-ai/types'

const PAYABLE_APIS: PayableAPI[] = [
  {
    id: 'tavily-standard',
    name: 'Tavily Search',
    description: 'Real-time web search optimized for AI agents',
    endpoint: '/api/search',
    priceUsdc: 0.002,
    currency: 'USDC',
    network: 'solana:devnet',
    latencyMs: 380,
    category: 'search',
  },
  {
    id: 'serpapi-premium',
    name: 'SerpAPI Premium',
    description: 'Premium search with structured results',
    endpoint: '/api/search/premium',
    priceUsdc: 0.015,
    currency: 'USDC',
    network: 'solana:devnet',
    latencyMs: 210,
    category: 'search',
  },
]

export async function GET() {
  try {
    return NextResponse.json({ apis: PAYABLE_APIS })
  } catch (err) {
    console.error('[/api/discover]', err)
    return NextResponse.json(
      { error: 'Failed to load APIs', code: 'DISCOVER_ERROR' },
      { status: 500 }
    )
  }
}
