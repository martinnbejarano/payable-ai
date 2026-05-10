/**
 * x402-style onchain settlement on Solana devnet.
 *
 * This is a pragmatic implementation that signs a real Solana transaction
 * to record a payment. It does NOT implement the full x402 v2 protocol
 * with the CDP facilitator — that requires `@solana/kit` + `ExactSvmScheme`
 * which aren't wired up yet. What we do produce is:
 *
 *   - A real, verifiable Solana transaction on devnet
 *   - A signature that resolves on Solscan
 *   - A memo instruction with structured payment metadata
 *   - An SPL-token transferChecked of USDC (gateway → gateway self-pay)
 *     so Solscan also shows a "USDC Transfer" line
 *
 * For the demo this is functionally equivalent: an agent has signed and
 * submitted a TX before the gateway serves the resource.
 */

import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { getConnection, getGatewayKeypair, USDC_DEVNET_MINT } from './solana'

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const USDC_DECIMALS = 6

export interface SettlementPayload {
  task: string
  capability: string
  providerId: string
  amountUsdc: number
}

export const SETTLEMENT_NETWORK = 'solana:devnet' as const

/**
 * Signs and submits a real settlement TX on Solana devnet.
 * Returns the transaction signature on success.
 * Throws on RPC / signing failure — callers fall back to a pending placeholder.
 */
export async function settleOnchain(payload: SettlementPayload): Promise<string> {
  const connection = getConnection()
  const payer = getGatewayKeypair()
  const mint = new PublicKey(USDC_DEVNET_MINT)
  const gatewayAta = await getAssociatedTokenAddress(mint, payer.publicKey)

  const memoData = JSON.stringify({
    x402: 'payable-ai/v0',
    task: payload.task.slice(0, 60),
    cap: payload.capability,
    prov: payload.providerId,
    amt: payload.amountUsdc,
    ts: Math.floor(Date.now() / 1000),
  })

  const memoIx = new TransactionInstruction({
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, 'utf-8'),
  })

  const amountRaw = BigInt(Math.round(payload.amountUsdc * 10 ** USDC_DECIMALS))
  const transferIx = createTransferCheckedInstruction(
    gatewayAta,
    mint,
    gatewayAta,
    payer.publicKey,
    amountRaw,
    USDC_DECIMALS,
  )

  const tx = new Transaction().add(memoIx).add(transferIx)
  return await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: 'confirmed',
    skipPreflight: false,
    maxRetries: 3,
  })
}

export interface PaymentVerification {
  ok: boolean
  reason?: string
}

/**
 * Verifies a payment signature exists and is confirmed on Solana devnet.
 * Used by /api/search to gate access without payment proof.
 */
export async function verifyPaymentSignature(
  signature: string | null | undefined,
): Promise<PaymentVerification> {
  if (!signature) return { ok: false, reason: 'missing X-Payment-Tx header' }
  if (signature.startsWith('pending-')) {
    return { ok: false, reason: 'pending placeholder, not a real signature' }
  }
  try {
    const connection = getConnection()
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: false,
    })
    if (!status.value) return { ok: false, reason: 'signature not found onchain' }
    if (status.value.err) {
      return { ok: false, reason: 'transaction failed onchain' }
    }
    const cs = status.value.confirmationStatus
    if (cs !== 'confirmed' && cs !== 'finalized') {
      return { ok: false, reason: `not yet confirmed (status=${cs ?? 'unknown'})` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'rpc error' }
  }
}
