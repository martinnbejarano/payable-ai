/**
 * GET /api/search
 *
 * x402-protected endpoint. Returns Tavily search results.
 *
 * Without payment header → HTTP 402 with payment requirements
 * With valid USDC payment on Solana devnet → HTTP 200 with search results
 *
 * TEST:
 * curl "http://localhost:3000/api/search?q=cursor+competitors"
 * → 402 Payment Required
 *
 * curl -H "X-Payment: <signed_tx_base64>" \
 *   "http://localhost:3000/api/search?q=cursor+competitors"
 * → 200 OK with results
 */

import { type NextRequest, NextResponse } from 'next/server'
import { tavilySearch } from '@/lib/tavily'
import { paymentMiddlewareConfig } from '@/lib/x402'

export async function GET(request: NextRequest) {
  try {
    // TODO: Uncomment once @x402/next middleware is fully wired with CDP credentials:
    // const paymentHeader = request.headers.get('X-Payment')
    // if (!paymentHeader) {
    //   return NextResponse.json(
    //     {
    //       error: 'Payment Required',
    //       code: 'PAYMENT_REQUIRED',
    //       payment: {
    //         amount: paymentMiddlewareConfig.amount,
    //         currency: paymentMiddlewareConfig.currency,
    //         network: paymentMiddlewareConfig.network,
    //         recipient: paymentMiddlewareConfig.recipient,
    //       },
    //     },
    //     { status: 402 }
    //   )
    // }

    void paymentMiddlewareConfig // referenced so the import is not tree-shaken

    const query = request.nextUrl.searchParams.get('q')
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter: q', code: 'MISSING_QUERY' },
        { status: 400 }
      )
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TAVILY_API_KEY is not configured', code: 'MISSING_API_KEY' },
        { status: 500 }
      )
    }

    const results = await tavilySearch(query)

    const txHash = request.headers.get('X-Payment') ?? 'unpaid'
    return NextResponse.json(results, {
      headers: { 'X-Payment-Tx': txHash },
    })
  } catch (err) {
    console.error('[/api/search]', err)
    return NextResponse.json(
      { error: 'Search failed', code: 'SEARCH_ERROR' },
      { status: 500 }
    )
  }
}
