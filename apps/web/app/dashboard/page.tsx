'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ViewTransition } from '@/components/payable/view-transition'
import {
  ArrowRight,
  Check,
  Code as CodeIcon,
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Logo,
  PulseDot,
  SectionLabel,
  timeAgo,
  truncAddr,
} from '@/components/payable/primitives'
import { AgentTrace, useAgentRun, type Phase } from '@/components/payable/agent-trace'
import { cn } from '@/lib/utils'
import { usePayableSession } from '@/components/payable/session'
import { navigateWithTransition } from '@/components/payable/nav'

type ApiState = 'available' | 'eligible' | 'rejected' | 'selected'
type Tx = { hash: string; api: string; amount: number; task: string; at: number }

const SAMPLE_TASKS = [
  "Research Cursor's biggest competitors in the AI IDE space",
  'Find recent news about Solana mobile devices',
  'Summarize the x402 protocol specification',
  'Compare pricing of LLM inference providers',
] as const

const SAMPLE_RESULTS = [
  "Cursor's main competitors include GitHub Copilot, Codeium, Tabnine and Windsurf — each pursuing a different agentic-edit philosophy.",
  'GitHub Copilot holds the largest enterprise market share thanks to native VS Code distribution and tight Microsoft account integration.',
  'Codeium is growing rapidly with a generous free tier and a self-hosted option that appeals to security-conscious teams.',
  'Windsurf differentiates with multi-file refactor flows and an opinionated agent runtime built into the IDE itself.',
]

/* ── Top nav ──────────────────────────────────────────────── */
function TopNav({
  wallet,
  balance,
  onDisconnect,
  onLogo,
}: {
  wallet: string | null
  balance: number
  onDisconnect: () => void
  onLogo: () => void
}) {
  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 backdrop-blur shrink-0 relative z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onLogo} className="flex items-center" aria-label="Home">
          <Logo size="sm" />
        </button>
        <span className="text-zinc-700">/</span>
        <span className="font-mono text-[11px] text-zinc-500 tracking-tight truncate">
          agent · default
        </span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md text-[10.5px] font-mono uppercase tracking-[0.12em] bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <PulseDot tone="accent" size={5} /> DEVNET
        </span>
        <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-500/90">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          solana · cluster healthy
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="h-7 w-7 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition inline-flex items-center justify-center"
          aria-label="API"
        >
          <CodeIcon size={13} strokeWidth={1.75} />
        </button>
        <button
          className="h-7 w-7 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition inline-flex items-center justify-center"
          aria-label="Docs"
        >
          <ExternalLink size={13} strokeWidth={1.75} />
        </button>
        <span className="h-4 w-px bg-zinc-800 mx-1" />
        <div className="h-7 pl-2 pr-2 rounded-md border border-zinc-800 bg-zinc-900 flex items-center gap-2">
          <PulseDot tone="success" size={5} />
          <span className="font-mono text-[11px] text-zinc-300">{truncAddr(wallet, 4, 4)}</span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-[11px] text-white font-medium num-tab">
            {balance.toFixed(4)}
          </span>
          <span className="font-mono text-[10px] text-zinc-500">USDC</span>
          <button
            onClick={onDisconnect}
            className="ml-0.5 h-5 w-5 rounded text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 inline-flex items-center justify-center"
            aria-label="Disconnect"
          >
            <X size={11} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  )
}

/* ── Left panel ───────────────────────────────────────────── */
function ApiCard({
  name,
  price,
  latency,
  status,
  expensive,
}: {
  name: string
  price: number
  latency: number
  status: ApiState
  expensive?: boolean
}) {
  const isSelected = status === 'selected'
  const isRejected = status === 'rejected'
  const isEligible = status === 'eligible'
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all duration-300 ease-out bg-zinc-900',
        isSelected && 'border-violet-500/40 ring-1 ring-violet-500/40 bg-violet-500/[0.04]',
        isRejected && 'border-red-500/20 opacity-40',
        isEligible && !isSelected && 'border-blue-500/30',
        !isSelected && !isRejected && !isEligible && 'border-zinc-800 hover:border-zinc-700',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12.5px] font-medium text-zinc-200 truncate">{name}</span>
        <span
          key={status}
          className={cn(
            'inline-flex items-center h-[18px] px-1.5 rounded text-[9.5px] font-mono uppercase tracking-[0.1em] border pop',
            isSelected && 'bg-violet-500/20 text-violet-300 border-violet-500/30',
            isRejected && 'bg-red-500/10 text-red-400 border-red-500/20',
            isEligible && !isSelected && 'bg-blue-500/10 text-blue-400 border-blue-500/25',
            !isSelected && !isRejected && !isEligible && 'bg-zinc-800 text-zinc-400 border-transparent',
          )}
        >
          {status}
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <span
          className={cn(
            'font-mono text-[16px] font-semibold num-tab leading-none',
            expensive ? 'text-red-400' : 'text-emerald-400',
          )}
        >
          {price.toFixed(3)}
          <span className="text-[10px] text-zinc-500 font-normal ml-1">USDC</span>
        </span>
        <span className="font-mono text-[10.5px] text-zinc-500">{latency}ms</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>per request</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          reachable
        </span>
      </div>
    </div>
  )
}

function Progress({ value }: { value: number }) {
  const tone =
    value < 50
      ? 'from-violet-500 to-violet-400'
      : value < 80
        ? 'from-orange-500 to-amber-400'
        : 'from-red-500 to-red-400'
  return (
    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
      <div
        className={cn('h-full bg-gradient-to-r transition-all duration-700 ease-out', tone)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

function LeftPanel({
  budget,
  initialBudget,
  apiStatus,
}: {
  budget: number
  initialBudget: number
  apiStatus: { tavily: ApiState; serpapi: ApiState }
}) {
  const usedPct = ((initialBudget - budget) / initialBudget) * 100
  const usedPctClamped = Math.max(0, Math.min(100, usedPct))
  const txCount = Math.round((initialBudget - budget) / 0.002)
  const capacity = Math.floor(budget / 0.002)
  return (
    <aside className="w-[240px] shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto thin-scroll">
      <div className="p-4">
        <SectionLabel
          className="mb-3"
          trailing={
            <button className="font-mono text-[10px] text-zinc-500 hover:text-zinc-200 normal-case tracking-normal inline-flex items-center gap-1 transition">
              refill <ExternalLink size={10} strokeWidth={1.75} />
            </button>
          }
        >
          Budget
        </SectionLabel>

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[34px] font-semibold text-white tracking-tight leading-none num-tab transition-all duration-500">
            {budget.toFixed(4)}
          </span>
          <span className="font-mono text-[13px] text-zinc-400 leading-none">USDC</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-500 font-mono">
          remaining of <span className="text-zinc-300 num-tab">{initialBudget.toFixed(4)}</span>
        </div>

        <div className="mt-4">
          <Progress value={usedPctClamped} />
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 num-tab">
            <span>{usedPctClamped.toFixed(1)}% used</span>
            <span className="text-zinc-700">·</span>
            <span>{txCount} txs</span>
            <span className="text-zinc-700">·</span>
            <span>capacity {capacity} more</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex-1 h-px bg-zinc-800" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            available apis
          </span>
          <span className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="space-y-2">
          <ApiCard name="tavily-standard" price={0.002} latency={380} status={apiStatus.tavily} />
          <ApiCard
            name="serpapi-premium"
            price={0.015}
            latency={210}
            status={apiStatus.serpapi}
            expensive
          />
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-zinc-900">
        <button className="w-full font-mono text-[11px] text-zinc-500 hover:text-zinc-200 inline-flex items-center justify-center gap-1.5 h-7 rounded-md hover:bg-zinc-900 transition">
          <Plus size={11} strokeWidth={1.75} /> register provider
        </button>
      </div>
    </aside>
  )
}

/* ── Center panel ─────────────────────────────────────────── */
function ResultsSection({
  txHash,
  onOpenTx,
}: {
  txHash: string
  onOpenTx: () => void
}) {
  return (
    <div className="screen-in rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-500">
          Results
        </span>
        <button
          onClick={onOpenTx}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-violet-400 hover:text-violet-300 transition"
        >
          {truncAddr(txHash, 4, 3)}
          <ArrowRight size={11} strokeWidth={1.75} />
        </button>
      </div>
      <div className="space-y-1.5">
        {SAMPLE_RESULTS.map((t, i) => (
          <div
            key={i}
            className="border-l-2 border-violet-500 pl-3 py-1 text-[13px] text-zinc-300 leading-snug"
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}

function CenterPanel({
  run,
  phase,
  lines,
  running,
  lastTx,
  completed,
  onOpenTx,
}: {
  run: (task: string) => void
  phase: Phase
  lines: Parameters<typeof AgentTrace>[0]['lines']
  running: boolean
  lastTx: string | null
  completed: boolean
  onOpenTx: (h: string) => void
}) {
  const [task, setTask] = useState<string>(SAMPLE_TASKS[0])
  const submit = () => {
    if (!task.trim() || running) return
    run(task.trim())
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950 dot-grid p-5 gap-4">
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center h-12 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 transition-colors focus-within:border-zinc-700">
            <Sparkles size={15} strokeWidth={1.75} className="text-violet-400 mr-2.5 shrink-0" />
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Give your agent a task..."
              className="flex-1 bg-transparent outline-none text-[13.5px] text-zinc-100 placeholder:text-zinc-500 min-w-0"
              disabled={running}
              aria-label="Agent task"
            />
            {task && !running && (
              <button
                onClick={() => setTask('')}
                className="ml-2 h-5 w-5 rounded text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 inline-flex items-center justify-center"
                aria-label="clear"
              >
                <X size={11} strokeWidth={1.75} />
              </button>
            )}
            <span className="ml-1 text-[10px] font-mono text-zinc-600 hidden md:inline">↩</span>
          </div>
          <button
            onClick={submit}
            disabled={running || !task.trim()}
            className={cn(
              'h-12 px-5 rounded-xl font-medium text-[13.5px] inline-flex items-center gap-2 transition-all active:scale-[0.99]',
              running || !task.trim()
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_10px_30px_-12px_rgba(139,92,246,0.6)]',
            )}
          >
            {running ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Zap size={14} strokeWidth={1.75} />
                Run agent
              </>
            )}
          </button>
        </div>

        <div
          className={cn(
            'mt-3 flex items-start gap-2 flex-wrap transition-all duration-300',
            running && 'opacity-0 -translate-y-1 pointer-events-none h-0 mt-0 overflow-hidden',
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600 mt-2 mr-1">
            Try
          </span>
          {SAMPLE_TASKS.map((t) => (
            <button
              key={t}
              onClick={() => setTask(t)}
              className={cn(
                'h-7 px-3 rounded-lg border text-[11.5px] transition truncate max-w-[280px]',
                task === t
                  ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AgentTrace phase={phase} lines={lines} running={running} />
      </div>

      {completed && lastTx && (
        <div className="shrink-0">
          <ResultsSection txHash={lastTx} onOpenTx={() => onOpenTx(lastTx)} />
        </div>
      )}
    </main>
  )
}

/* ── Right panel ──────────────────────────────────────────── */
function TxRow({ tx, onOpen }: { tx: Tx; onOpen: (hash: string) => void }) {
  return (
    <button
      onClick={() => onOpen(tx.hash)}
      className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors p-3 mb-2 block screen-in"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-violet-400">{truncAddr(tx.hash, 4, 3)}</span>
        <span className="inline-flex items-center h-[18px] px-1.5 rounded text-[9.5px] font-mono uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          confirmed
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="font-mono text-[12px] text-zinc-400">{tx.api}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-[13px] text-white font-medium num-tab">
          −{tx.amount.toFixed(3)}{' '}
          <span className="text-[10px] text-zinc-500 font-normal">USDC</span>
        </span>
        <span className="font-mono text-[11px] text-zinc-600">{timeAgo(tx.at)}</span>
      </div>
    </button>
  )
}

function RightPanel({ txs, onOpenTx }: { txs: Tx[]; onOpenTx: (hash: string) => void }) {
  const totalSpent = txs.reduce((a, t) => a + t.amount, 0)
  const avg = txs.length ? totalSpent / txs.length : 0
  return (
    <aside className="w-[280px] shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Transaction History
        </span>
        <span className="bg-zinc-800 text-zinc-400 font-mono text-[10px] px-1.5 py-0.5 rounded num-tab">
          {String(txs.length).padStart(2, '0')}
        </span>
      </div>

      <div className="px-4 py-3 border-b border-zinc-900 grid grid-cols-2 gap-3 shrink-0">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            Spent
          </div>
          <div className="mt-1 font-mono text-[13px] font-medium text-white num-tab">
            {totalSpent.toFixed(4)}{' '}
            <span className="text-[10px] text-zinc-500 font-normal">USDC</span>
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            Avg/tx
          </div>
          <div className="mt-1 font-mono text-[13px] font-medium text-white num-tab">
            {avg.toFixed(4)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-4">
        {txs.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center">
            <div className="text-zinc-700 mb-3">
              <Wallet size={28} strokeWidth={1.75} />
            </div>
            <div className="font-mono text-[12px] text-zinc-500">No transactions yet</div>
            <div className="mt-1.5 font-mono text-[11px] text-zinc-600 max-w-[200px] leading-snug">
              Once your agent pays for an API call, the on-chain settlement will appear here.
            </div>
          </div>
        ) : (
          txs.map((tx) => <TxRow key={tx.hash} tx={tx} onOpen={onOpenTx} />)
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-zinc-900 flex items-center justify-between font-mono text-[10px] text-zinc-600 shrink-0">
        <span>cluster · devnet</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          healthy
        </span>
      </div>
    </aside>
  )
}

/* ── Solscan modal ────────────────────────────────────────── */
function SolscanModal({ tx, onClose }: { tx: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!tx) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tx, onClose])

  const slot = useMemo(() => Math.floor(280_000_000 + Math.random() * 1_000_000), [tx])

  if (!tx) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm screen-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-[520px] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ExternalLink size={13} strokeWidth={1.75} className="text-zinc-400" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-400">
              solscan · devnet
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 h-7 w-7 inline-flex items-center justify-center rounded hover:bg-zinc-900"
            aria-label="Close"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>
        <div className="p-5 space-y-3 font-mono text-[12px]">
          <div>
            <div className="text-zinc-500 text-[10px] uppercase tracking-[0.14em] mb-1">
              Signature
            </div>
            <div className="text-violet-400 break-all leading-snug">{tx}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Status"
              value={
                <span className="text-emerald-400 inline-flex items-center gap-1.5">
                  <Check size={12} strokeWidth={3} /> Success
                </span>
              }
            />
            <Stat label="Fee" value={<span className="text-white num-tab">0.000005 SOL</span>} />
            <Stat label="Amount" value={<span className="text-white num-tab">0.002 USDC</span>} />
            <Stat label="Slot" value={<span className="text-white num-tab">{slot}</span>} />
          </div>
          <div className="text-[10px] text-zinc-600 text-center pt-2">
            mock view — production would link to{' '}
            <span className="text-zinc-400">solscan.io/tx/…?cluster=devnet</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-zinc-500 text-[10px] uppercase tracking-[0.12em]">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const { wallet, initialBudget, setWallet } = usePayableSession()
  const [budget, setBudget] = useState(initialBudget)
  const [txs, setTxs] = useState<Tx[]>([])
  const [completed, setCompleted] = useState(false)
  const [openTx, setOpenTx] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<{ tavily: ApiState; serpapi: ApiState }>({
    tavily: 'available',
    serpapi: 'available',
  })

  const { phase, lines, running, lastTx, run } = useAgentRun({
    onTxConfirmed: ({ hash, task }) => {
      setBudget((b) => Math.max(0, +(b - 0.002).toFixed(4)))
      setTxs((prev) => [
        { hash, api: 'tavily-standard', amount: 0.002, task, at: Date.now() },
        ...prev,
      ])
    },
    onComplete: () => setCompleted(true),
  })

  // Drive API status from phase + lines
  useEffect(() => {
    if (!running && lines.length === 0) {
      setApiStatus({ tavily: 'available', serpapi: 'available' })
      return
    }
    if (phase === 'DISCOVERING') {
      setApiStatus({ tavily: 'available', serpapi: 'available' })
    } else if (phase === 'REASONING') {
      const hasRej = lines.some((l) => l.text.includes('REJECTED'))
      const hasElig = lines.some((l) => l.text.includes('ELIGIBLE'))
      const hasDecision = lines.some((l) => l.type === 'decision')
      setApiStatus({
        tavily: hasDecision ? 'selected' : hasElig ? 'eligible' : 'available',
        serpapi: hasRej ? 'rejected' : 'available',
      })
    } else if (phase === 'PAYING' || phase === 'COMPLETE') {
      setApiStatus({ tavily: 'selected', serpapi: 'rejected' })
    }
  }, [phase, lines, running])

  // Demo fallback: if user lands here without going through connect, mint a mock wallet
  useEffect(() => {
    if (!wallet) {
      // Soft redirect rather than hard fail — keeps the demo navigable.
      navigateWithTransition(router, '/connect', 'nav-back')
    }
  }, [wallet, router])

  const onLogo = () => navigateWithTransition(router, '/', 'nav-back')
  const onDisconnect = () => {
    setWallet(null)
    navigateWithTransition(router, '/connect', 'nav-back')
  }

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div
        className="screen-in h-screen flex flex-col bg-zinc-950 overflow-hidden"
        data-screen-label="03 Dashboard"
      >
        <TopNav
          wallet={wallet}
          balance={budget}
          onDisconnect={onDisconnect}
          onLogo={onLogo}
        />
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel budget={budget} initialBudget={initialBudget} apiStatus={apiStatus} />
          <CenterPanel
            run={run}
            phase={phase}
            lines={lines}
            running={running}
            lastTx={lastTx}
            completed={completed}
            onOpenTx={(h) => setOpenTx(h)}
          />
          <RightPanel txs={txs} onOpenTx={(h) => setOpenTx(h)} />
        </div>
        <SolscanModal tx={openTx} onClose={() => setOpenTx(null)} />
      </div>
    </ViewTransition>
  )
}
