'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getUsdcBalance } from '@/lib/solana'

export function useAgentBalance() {
  const { publicKey } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null)
      return
    }
    setIsLoading(true)
    try {
      const usdc = await getUsdcBalance(publicKey.toBase58())
      setBalance(usdc)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { balance, isLoading, refresh }
}
