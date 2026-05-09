'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ViewTransition } from '@/components/payable/view-transition'
import {
  Activity,
  Code as CodeIcon,
  ChevronRight,
  ExternalLink,
  Plus,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import {
  Logo,
  PulseDot,
  SectionLabel,
  truncAddr,
} from '@/components/payable/primitives'
import { AgentTrace, useAgentRun } from '@/components/payable/agent-trace'
import { cn } from '@/lib/utils'
import { usePayableSession } from '@/components/payable/session'
import { navigateWithTransition } from '@/components/payable/nav'

/* ── Compute market data ──────────────────────────────────── */
const CAPABILITIES = [
  {
    id: 'web-search',
    label: 'WEB SEARCH',
    live: true,
    providers: [
      { id: 'tavily-standard', name: 'tavily-standard', price: 0.002, latency: 380, live: true },
      { id: 'serpapi-premium', name: 'serpapi-premium', price: 0.015, latency: 210, live: false },
    ],
  },
  {
    id: 'ocr',
    label: 'OCR',
    live: false,
    providers: [
      { id: 'textract-basic', name: 'textract-basic', price: 0.001, latency: 200, live: false },
      { id: 'vision-pro', name: 'vision-pro', price: 0.008, latency: 95, live: false },
    ],
  },
  {
    id: 'gpu-inference',
    label: 'GPU INFERENCE',
    live: false,
    providers: [
      { id: 'runpod-a100', name: 'runpod-a100', price: 0.050, latency: 800, live: false },
      { id: 'lambda-h100', name: 'lambda-h100', price: 0.120, latency: 400, live: false },
    ],
  },
  {
    id: 'financial-data',
    label: 'FINANCIAL DATA',
    live: false,
    providers: [
      { id: 'polygon-basic', name: 'polygon-basic', price: 0.003, latency: 150, live: false },
      { id: 'bloomberg-rt', name: 'bloomberg-rt', price: 0.040, latency: 80, live: false },
    ],
  },
  {
    id: 'satellite-imaging',
    label: 'SATELLITE IMAGING',
    live: false,
    providers: [
      { id: 'planet-standard', name: 'planet-standard', price: 0.020, latency: 600, live: false },
      { id: 'maxar-hd', name: 'maxar-hd', price: 0.080, latency: 320, live: false },
    ],
  },
] as const

type DecisionMap = Record<string, 'selected' | 'rejected' | undefined>

const SAMPLE_TASKS = [
  "Research Cursor's biggest competitors in the AI IDE space",
  'Analyze Q1 earnings reports for top 5 AI companies',
  'Compare GPU inference pricing across cloud providers',
  'Find recent breakthroughs in protein folding research',
] as const

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
        <span className="hidden xl:inline-flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-500/90">
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

/* ── Compute market left panel ────────────────────────────── */
function ProviderRow({
  p,
  decisionStatus,
  cheapest,
}: {
  p: { id: string; name: string; price: number; latency: number; live: boolean }
  decisionStatus?: 'selected' | 'rejected'
  cheapest: boolean
}) {
  const isSelected = decisionStatus === 'selected'
  const isRejected = decisionStatus === 'rejected'
  return (
    <div
      className={cn(
        'py-1.5 px-2 rounded-md transition-all duration-300 font-mono text-[11px]',
        isSelected && 'border-l-2 border-violet-500 bg-violet-500/5 -ml-0.5 pl-2.5',
        isRejected && 'opacity-30',
        !isSelected && !isRejected && 'pl-3',
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className={cn('truncate min-w-0', isSelected ? 'text-violet-200' : 'text-zinc-300')}>
          {p.name}
        </span>
        <span
          className={cn(
            'shrink-0 text-[9px] uppercase tracking-[0.08em] inline-flex items-center gap-1',
            isSelected
              ? 'text-violet-400 font-semibold'
              : isRejected
                ? 'text-red-400/70 font-semibold'
                : p.live
                  ? 'text-emerald-400'
                  : 'text-zinc-600',
          )}
        >
          {isSelected ? (
            <><span>●</span><span className="hidden xl:inline">selected</span></>
          ) : isRejected ? (
            <><span>×</span><span className="hidden xl:inline">rejected</span></>
          ) : p.live ? (
            '● live'
          ) : (
            '○ mock'
          )}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-0.5 text-[10px]">
        <span className={cn('num-tab', cheapest ? 'text-violet-400' : 'text-zinc-500')}>
          {p.price.toFixed(3)} USDC
        </span>
        <span className="text-zinc-600 num-tab">{p.latency}ms</span>
      </div>
    </div>
  )
}

function CapabilityBlock({
  cap,
  expanded,
  onToggle,
  decisionMap,
}: {
  cap: (typeof CAPABILITIES)[number]
  expanded: boolean
  onToggle: () => void
  decisionMap: DecisionMap
}) {
  const cheapestId = [...cap.providers].sort((a, b) => a.price - b.price)[0]?.id
  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 py-2 px-1 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <ChevronRight
            size={11}
            strokeWidth={1.75}
            className={cn('shrink-0 transition-transform', expanded && 'rotate-90')}
          />
          <span className="truncate">{cap.label}</span>
        </span>
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            cap.live ? 'bg-emerald-500' : 'bg-zinc-700',
          )}
        />
      </button>
      {expanded && (
        <div className="pb-2 space-y-0.5">
          {cap.providers.map((p) => (
            <ProviderRow
              key={p.id}
              p={p}
              cheapest={p.id === cheapestId}
              decisionStatus={decisionMap[p.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LeftPanel({
  budget,
  initialBudget,
  decisionMap,
}: {
  budget: number
  initialBudget: number
  decisionMap: DecisionMap
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'web-search': true })
  const usedPct = Math.max(0, Math.min(100, ((initialBudget - budget) / initialBudget) * 100))

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  return (
    <aside className="w-[260px] shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-y-auto thin-scroll">
      {/* Budget */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Budget
          </span>
          <button className="font-mono text-[10px] text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 transition">
            refill <ExternalLink size={10} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[32px] font-semibold text-white tracking-tight leading-none num-tab transition-all duration-500">
            {budget.toFixed(4)}
          </span>
          <span className="font-mono text-[12px] text-zinc-400 leading-none">USDC</span>
        </div>
        <div className="mt-1 text-[10.5px] text-zinc-500 font-mono">
          remaining of <span className="text-zinc-300 num-tab">{initialBudget.toFixed(4)}</span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      {/* Compute market */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            Compute Market
          </span>
          <span className="flex-1 h-px bg-zinc-800" />
        </div>
        <div>
          {CAPABILITIES.map((c) => (
            <CapabilityBlock
              key={c.id}
              cap={c}
              expanded={!!expanded[c.id]}
              onToggle={() => toggle(c.id)}
              decisionMap={decisionMap}
            />
          ))}
        </div>
      </div>

      {/* Agent policy */}
      <div className="px-4 py-4 mt-2 border-t border-zinc-900">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2.5">
          Agent Policy
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-zinc-500">strategy</span>
            <span className="text-zinc-300">cheapest-eligible</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">max/request</span>
            <span className="text-zinc-300 num-tab">0.005 USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">max/task</span>
            <span className="text-zinc-300">budget</span>
          </div>
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-zinc-900">
        <button className="w-full font-mono text-[11px] text-zinc-500 hover:text-zinc-200 inline-flex items-center justify-center gap-1.5 h-7 rounded-md hover:bg-zinc-900 transition">
          <Plus size={11} strokeWidth={1.75} /> register provider
        </button>
      </div>
    </aside>
  )
}

/* ── Center panel ─────────────────────────────────────────── */
function CenterPanel({
  run,
  phase,
  lines,
  running,
}: {
  run: (task: string) => void
  phase: Parameters<typeof AgentTrace>[0]['phase']
  lines: Parameters<typeof AgentTrace>[0]['lines']
  running: boolean
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
                'h-7 px-3 rounded-lg border text-[11.5px] transition truncate max-w-[300px]',
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
    </main>
  )
}

/* ── Right panel — Execution log ──────────────────────────── */
type Execution = { hash: string; task: string; at: number }

function ExecutionCard({
  exec,
  onOpenTx,
}: {
  exec: Execution
  onOpenTx: (hash: string) => void
}) {
  const taskShort = exec.task.length > 36 ? exec.task.slice(0, 34) + '…' : exec.task
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 mb-2 screen-in">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[12px] text-zinc-200 truncate font-medium">{taskShort}</span>
        <span className="inline-flex items-center h-[18px] px-1.5 rounded text-[9.5px] font-mono uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          complete
        </span>
      </div>
      <div className="space-y-1 font-mono text-[11px]">
        <div className="flex justify-between gap-3">
          <span className="text-zinc-600 shrink-0">capability</span>
          <span className="text-zinc-300 truncate text-right">WEB SEARCH</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-600 shrink-0">provider</span>
          <span className="text-zinc-300 truncate text-right">tavily-standard</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-600 shrink-0">decision</span>
          <span className="text-zinc-300 truncate text-right">cheapest-eligible</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-600 shrink-0">rejected</span>
          <span className="text-red-400/80 truncate text-right">
            serpapi-premium <span className="text-red-400/60">(+650%)</span>
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-zinc-600 shrink-0">cost</span>
          <span className="text-zinc-300 num-tab text-right">0.002 USDC</span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-zinc-600 shrink-0">tx</span>
          <button
            onClick={() => onOpenTx(exec.hash)}
            className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 transition shrink-0"
          >
            {truncAddr(exec.hash, 4, 4)} <ExternalLink size={10} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}

function RightPanel({
  executions,
  onOpenTx,
}: {
  executions: Execution[]
  onOpenTx: (hash: string) => void
}) {
  const tasksRun = executions.length
  const providersRejected = executions.length
  const usdcSaved = parseFloat((executions.length * 0.013).toFixed(3))

  return (
    <aside className="w-[300px] shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Execution Log
        </span>
        <span className="bg-zinc-800 text-zinc-400 font-mono text-[10px] px-1.5 py-0.5 rounded num-tab">
          {String(tasksRun).padStart(2, '0')}
        </span>
      </div>

      {/* 3-column stats */}
      <div className="px-4 py-3 border-b border-zinc-900 grid grid-cols-3 gap-2 shrink-0">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-zinc-500 leading-tight">
            Tasks<br />run
          </div>
          <div className="mt-1.5 font-mono text-[15px] font-medium text-white num-tab leading-none">
            {String(tasksRun).padStart(2, '0')}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-zinc-500 leading-tight">
            Providers<br />rejected
          </div>
          <div className="mt-1.5 font-mono text-[15px] font-medium text-red-400/90 num-tab leading-none">
            {String(providersRejected).padStart(2, '0')}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-zinc-500 leading-tight">
            USDC<br />saved
          </div>
          <div className="mt-1.5 font-mono text-[15px] font-medium text-emerald-400 num-tab leading-none">
            {usdcSaved.toFixed(3)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll p-3">
        {executions.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center">
            <div className="text-zinc-700 mb-3">
              <Activity size={26} strokeWidth={1.75} />
            </div>
            <div className="font-mono text-[12px] text-zinc-500">No executions yet.</div>
            <div className="mt-1.5 font-mono text-[11px] text-zinc-600 max-w-[220px] leading-snug">
              Run an agent task to see economic decisions logged here.
            </div>
          </div>
        ) : (
          executions.map((e) => (
            <ExecutionCard key={e.hash} exec={e} onOpenTx={onOpenTx} />
          ))
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
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.12em]">Status</div>
              <div className="text-emerald-400 mt-1">✓ Success</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.12em]">Amount</div>
              <div className="text-white mt-1 num-tab">0.002 USDC</div>
            </div>
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

/* ── Page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const { wallet, initialBudget, setWallet } = usePayableSession()
  const [budget, setBudget] = useState(initialBudget)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [openTx, setOpenTx] = useState<string | null>(null)
  const [decisionMap, setDecisionMap] = useState<DecisionMap>({})

  const budgetRef = useRef(initialBudget)
  useEffect(() => { budgetRef.current = budget }, [budget])

  const { phase, lines, running, run } = useAgentRun({
    getRemaining: () => budgetRef.current,
    onTxConfirmed: ({ hash, task }) => {
      setBudget((b) => Math.max(0, +(b - 0.002).toFixed(4)))
      setExecutions((prev) => [{ hash, task, at: Date.now() }, ...prev])
    },
  })

  // Drive decision map from trace lines
  useEffect(() => {
    const hasReject = lines.some((l) => l.type === 'reject')
    const hasDecision = lines.some((l) => l.type === 'decision')
    if (!hasReject && !hasDecision) {
      setDecisionMap({})
      return
    }
    setDecisionMap({
      'tavily-standard': hasDecision ? 'selected' : undefined,
      'serpapi-premium': hasReject ? 'rejected' : undefined,
    })
  }, [lines])

  useEffect(() => {
    if (!wallet) {
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
          <LeftPanel budget={budget} initialBudget={initialBudget} decisionMap={decisionMap} />
          <CenterPanel run={run} phase={phase} lines={lines} running={running} />
          <RightPanel executions={executions} onOpenTx={(h) => setOpenTx(h)} />
        </div>
        <SolscanModal tx={openTx} onClose={() => setOpenTx(null)} />
      </div>
    </ViewTransition>
  )
}
