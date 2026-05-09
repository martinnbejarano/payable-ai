/**
 * x402 Protocol Configuration
 *
 * x402 is an open payment standard built on HTTP 402 "Payment Required".
 * When an agent hits a protected endpoint without payment:
 *   → Server returns 402 with { amount, currency, recipient, network }
 *   → Client signs a Solana transaction and retries with X-Payment header
 *   → Facilitator (Coinbase CDP) verifies the tx onchain
 *   → Server returns 200 with the resource
 *
 * Docs: https://docs.cdp.coinbase.com/x402
 */

import type { Keypair } from '@solana/web3.js'

export const x402FetchConfig = {
  network: 'solana:devnet' as const,
  recipient: process.env.GATEWAY_WALLET_PUBLIC_KEY ?? '',
  currency: 'USDC' as const,
}

export const paymentMiddlewareConfig = {
  amount: 0.002,
  currency: 'USDC' as const,
  network: 'solana:devnet' as const,
  recipient: process.env.GATEWAY_WALLET_PUBLIC_KEY ?? '',
  cdpApiKeyId: process.env.CDP_API_KEY_ID ?? '',
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET ?? '',
}

/**
 * Returns a fetch client pre-configured for x402 automatic payments.
 * The keypair signs payment transactions on behalf of the calling agent.
 *
 * TODO: Wire in @x402/fetch wrapFetch once CDP credentials are available.
 */
export function createX402Fetch(walletKeypair: Keypair): typeof fetch {
  // TODO: Replace with real x402 fetch wrapper: wrapFetch(fetch, { keypair: walletKeypair, ...x402FetchConfig })
  void walletKeypair
  return fetch
}
