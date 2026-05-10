/**
 * GET /api/search
 *
 * Payment-gated endpoint. Requires `X-Payment-Tx` header containing a
 * confirmed Solana devnet transaction signature. Without it (or with an
 * unconfirmed / failed signature) returns 402 Payment Required.
 *
 * The verification is lightweight: we only check that the signature
 * exists and is confirmed. We don't (yet) verify the TX contents match
 * the requested resource — that's the job of full x402 v2.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { tavilySearch } from '@/lib/tavily'
import { verifyPaymentSignature, SETTLEMENT_NETWORK } from '@/lib/x402'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAYMENT_AMOUNT_USDC = 0.002
const PAYMENT_RECIPIENT = process.env.GATEWAY_WALLET_PUBLIC_KEY ?? ''

export async function GET(request: NextRequest) {
  try {
    const paymentSig = request.headers.get('X-Payment-Tx')
    const verification = await verifyPaymentSignature(paymentSig)

    if (!verification.ok) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          code: 'PAYMENT_REQUIRED',
          reason: verification.reason,
          payment: {
            amount: PAYMENT_AMOUNT_USDC,
            currency: 'USDC',
            network: SETTLEMENT_NETWORK,
            recipient: PAYMENT_RECIPIENT,
          },
        },
        { status: 402 },
      )
    }

    const query = request.nextUrl.searchParams.get('q')
    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter: q', code: 'MISSING_QUERY' },
        { status: 400 },
      )
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TAVILY_API_KEY is not configured', code: 'MISSING_API_KEY' },
        { status: 500 },
      )
    }

    const results = await tavilySearch(query)
    return NextResponse.json(results, {
      headers: { 'X-Payment-Tx': paymentSig ?? '' },
    })
  } catch (err) {
    console.error('[/api/search]', err)
    return NextResponse.json(
      { error: 'Search failed', code: 'SEARCH_ERROR' },
      { status: 500 },
    )
  }
}
