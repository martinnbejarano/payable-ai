// All operations target Solana Devnet — no real funds are involved.

import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import bs58 from 'bs58'

export const USDC_DEVNET_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
// ↑ Circle's official devnet USDC mint address

/** Returns a Connection to Solana devnet via the configured RPC URL. */
export function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  return new Connection(rpcUrl, 'confirmed')
}

/** Loads the gateway Keypair from GATEWAY_WALLET_PRIVATE_KEY (base58-encoded). */
export function getGatewayKeypair(): Keypair {
  const privateKey = process.env.GATEWAY_WALLET_PRIVATE_KEY
  if (!privateKey) throw new Error('GATEWAY_WALLET_PRIVATE_KEY is not set')
  return Keypair.fromSecretKey(bs58.decode(privateKey))
}

/** Truncates a wallet address to "7xKp...3mNq" format. */
export function formatAddress(address: string): string {
  if (address.length < 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/** Converts lamports to SOL. */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000
}

/** Returns the USDC balance (in human-readable units) for a given wallet address. */
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  // TODO: Replace with production mint address when moving to mainnet
  const connection = getConnection()
  const owner = new PublicKey(walletAddress)
  const mint = new PublicKey(USDC_DEVNET_MINT)

  try {
    const ata = await getAssociatedTokenAddress(mint, owner)
    const account = await getAccount(connection, ata)
    // USDC has 6 decimals
    return Number(account.amount) / 1_000_000
  } catch {
    return 0
  }
}
