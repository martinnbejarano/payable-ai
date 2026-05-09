'use client'

import { createContext, useContext, useMemo, useState } from 'react'

type Session = {
  wallet: string | null
  initialBudget: number
  setWallet: (addr: string | null) => void
  setInitialBudget: (n: number) => void
}

const Ctx = createContext<Session | null>(null)

export function PayableSessionProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null)
  const [initialBudget, setInitialBudget] = useState(0.01)

  const value = useMemo(
    () => ({ wallet, initialBudget, setWallet, setInitialBudget }),
    [wallet, initialBudget],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePayableSession(): Session {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePayableSession must be used inside <PayableSessionProvider>')
  return v
}
