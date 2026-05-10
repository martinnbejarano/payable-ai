'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { ViewTransition } from '@/components/payable/view-transition'
import {
  Badge,
  Logo,
  PayableCard,
  PulseDot,
  WalletGlyph,
  truncAddr,
} from '@/components/payable/primitives'
import { cn } from '@/lib/utils'
import { usePayableSession } from '@/components/payable/session'
import { navigateWithTransition } from '@/components/payable/nav'
import { getUsdcBalance } from '@/lib/solana'

const QUICK_AMOUNTS = [0.005, 0.01, 0.05, 0.1] as const

export default function ConnectPage() {
  const router = useRouter()
  const { wallet, setWallet, setInitialBudget } = usePayableSession()
  const { publicKey, connected, connecting, disconnect } = useWallet()
  const { setVisible, visible: modalVisible } = useWalletModal()

  const [amount, setAmount] = useState('0.0100')
  const [deploying, setDeploying] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Mirror wallet adapter state into the session
  useEffect(() => {
    if (connected && publicKey) {
      setWallet(publicKey.toBase58())
    } else if (!connected) {
      setWallet(null)
    }
  }, [connected, publicKey, setWallet])

  // Read on-chain USDC balance once connected
  useEffect(() => {
    if (!publicKey) {
      setBalance(null)
      return
    }
    let cancelled = false
    setBalanceError(null)
    getUsdcBalance(publicKey.toBase58())
      .then((b) => {
        if (!cancelled) setBalance(b)
      })
      .catch((err) => {
        if (!cancelled) setBalanceError(err instanceof Error ? err.message : 'balance read failed')
      })
    return () => {
      cancelled = true
    }
  }, [publicKey])

  const connectWallet = () => {
    if (connected || connecting) return
    setVisible(true)
  }

  const isOpening = connecting || (modalVisible && !connected)

  const onDisconnect = async () => {
    try {
      await disconnect()
    } finally {
      setWallet(null)
    }
  }

  const deploy = () => {
    if (!wallet) return
    setDeploying(true)
    setTimeout(() => {
      setInitialBudget(parseFloat(amount) || 0.01)
      navigateWithTransition(router, '/dashboard', 'nav-forward')
    }, 400)
  }

  const onBack = () => navigateWithTransition(router, '/', 'nav-back')

  const requestedAmount = parseFloat(amount) || 0
  const insufficient = balance !== null && balance < requestedAmount && requestedAmount > 0

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div
        className="screen-in min-h-screen flex flex-col mesh-bg"
        data-screen-label="02 Connect Wallet"
      >
        <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-900/80">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-400 hover:text-zinc-100 transition"
          >
            <ArrowLeft size={14} strokeWidth={1.75} /> Back
          </button>
          <Logo size="sm" />
          <Badge tone="muted" mono icon={<PulseDot tone="accent" size={5} />}>
            Solana Devnet
          </Badge>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[440px]">
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-2xl bg-accent/30 blur-2xl" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent-soft border border-accent-soft/40 flex items-center justify-center shadow-[0_8px_30px_-8px_rgba(124,58,237,0.6)]">
                  <span className="h-3 w-3 rounded bg-zinc-950" />
                </div>
              </div>
              <h1 className="font-display text-[32px] tracking-tightest text-white text-center leading-[1.1]">
                Deploy your agent
              </h1>
              <p className="mt-2 text-[13.5px] text-zinc-400 text-center max-w-[340px]">
                Connect a wallet to fund the agent&apos;s autonomous spending budget.
              </p>
            </div>

            <PayableCard className="p-6 bg-zinc-900/50 backdrop-blur-xl">
              {/* Step 1 */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-mono',
                        wallet
                          ? 'bg-success/15 border-success/40 text-success'
                          : 'border-zinc-700 text-zinc-500',
                      )}
                    >
                      {wallet ? <Check size={11} strokeWidth={2.5} /> : '1'}
                    </span>
                    <span className="text-[12px] text-zinc-300 font-medium">Connect a wallet</span>
                  </div>
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-zinc-600">
                    Phantom · Devnet
                  </span>
                </div>

                <button
                  onClick={connectWallet}
                  disabled={!!wallet || isOpening}
                  className={cn(
                    'group w-full h-14 rounded-xl border transition-all duration-200 flex items-center justify-between px-4 active:scale-[0.99]',
                    wallet
                      ? 'border-success/40 bg-success/5'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-accent-soft/50 hover:bg-accent/5 hover:shadow-[0_0_0_1px_rgba(167,139,250,0.3),0_10px_30px_-10px_rgba(124,58,237,0.55)]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <WalletGlyph size={28} />
                    <div className="text-left">
                      {wallet ? (
                        <>
                          <div className="text-[13px] text-zinc-100 font-medium flex items-center gap-2">
                            Phantom connected
                            <PulseDot tone="success" size={5} />
                          </div>
                          <div className="text-[11.5px] font-mono text-zinc-400 mt-0.5">
                            {truncAddr(wallet, 6, 4)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[13px] text-zinc-100 font-medium">
                            {isOpening ? 'Opening Phantom…' : 'Connect Phantom'}
                          </div>
                          <div className="text-[11.5px] text-zinc-500 mt-0.5">
                            Sign in to deploy your agent
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {wallet ? (
                    <div className="flex items-center gap-2">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          onDisconnect()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            onDisconnect()
                          }
                        }}
                        className="text-[11px] text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded cursor-pointer"
                      >
                        disconnect
                      </span>
                      <Check size={16} className="text-success" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <ArrowRight
                      size={15}
                      strokeWidth={1.75}
                      className="text-zinc-500 group-hover:text-accent-soft group-hover:translate-x-0.5 transition-all"
                    />
                  )}
                </button>

                {wallet && (
                  <div className="mt-2 flex items-center justify-between font-mono text-[10.5px] text-zinc-500">
                    <span>devnet USDC balance</span>
                    <span className="text-zinc-300 num-tab">
                      {balanceError
                        ? '—'
                        : balance === null
                          ? 'loading…'
                          : `${balance.toFixed(4)} USDC`}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[10.5px] font-mono text-zinc-500 tracking-[0.18em]">
                  THEN
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Step 2 */}
              <div className={cn('transition-opacity', !wallet && 'opacity-50')}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-mono',
                        wallet ? 'border-zinc-700 text-zinc-300' : 'border-zinc-800 text-zinc-600',
                      )}
                    >
                      2
                    </span>
                    <span className="text-[12px] text-zinc-300 font-medium">Agent budget</span>
                  </div>
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-zinc-600">
                    Devnet USDC · test tokens
                  </span>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-2 h-14 rounded-xl border border-zinc-800 bg-zinc-950/70 pl-4 pr-3 transition-colors focus-within:border-accent/60">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      disabled={!wallet}
                      className="flex-1 min-w-0 bg-transparent outline-none text-[24px] font-mono font-medium text-white placeholder:text-zinc-700 num-tab"
                      placeholder="0.0000"
                      aria-label="Agent budget in USDC"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[14px] font-mono text-zinc-400">USDC</span>
                      <Badge tone="blue" mono className="!h-5">
                        DEVNET
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {QUICK_AMOUNTS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(v.toFixed(4))}
                        disabled={!wallet}
                        className={cn(
                          'h-6 px-2 rounded-md font-mono text-[10.5px] border transition',
                          amount === v.toFixed(4)
                            ? 'border-accent/50 bg-accent/10 text-accent-soft'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
                          !wallet && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        {v.toFixed(3)}
                      </button>
                    ))}
                    <span className="ml-auto text-[10.5px] font-mono text-zinc-600">
                      ≈ {requestedAmount.toFixed(4)} USDC
                    </span>
                  </div>
                  {insufficient && (
                    <div className="mt-2 text-[10.5px] font-mono text-red-400/80">
                      insufficient devnet USDC — get test tokens at{' '}
                      <a
                        href="https://faucet.circle.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2"
                      >
                        faucet.circle.com
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={deploy}
                disabled={!wallet || deploying || insufficient}
                className={cn(
                  'mt-6 w-full h-12 rounded-xl font-medium text-[14px] tracking-tight inline-flex items-center justify-center gap-2 transition-all active:scale-[0.99]',
                  wallet && !insufficient
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_0_0_1px_rgba(255,255,255,0.4)_inset,0_12px_32px_-12px_rgba(255,255,255,0.4)]'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800',
                )}
              >
                {deploying ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-700 border-t-zinc-950 animate-spin" />
                    Deploying agent…
                  </>
                ) : (
                  <>
                    Deploy agent
                    <ArrowRight size={15} strokeWidth={1.75} />
                  </>
                )}
              </button>
            </PayableCard>

            <p className="mt-5 text-center text-[11.5px] text-zinc-600">
              This uses Solana Devnet. No real funds required.
              &nbsp;
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-zinc-100 underline underline-offset-2 decoration-zinc-700"
              >
                Get test USDC →
              </a>
            </p>
          </div>
        </div>
      </div>
    </ViewTransition>
  )
}
