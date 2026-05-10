'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CapabilityStep, PlanSummary } from '@payable-ai/types'
import { ViewTransition } from '@/components/payable/view-transition'
import {
  Activity,
  Code as CodeIcon,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import {
  Logo,
  PulseDot,
  truncAddr,
} from '@/components/payable/primitives'
import { AgentTrace, useAgentRun } from '@/components/payable/agent-trace'
import { cn } from '@/lib/utils'
import { usePayableSession } from '@/components/payable/session'
import { navigateWithTransition } from '@/components/payable/nav'
import { useAgentBalance } from '@/hooks/useAgentBalance'

/* ── Compute market data (mirror of /api/discover) ────────── */
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
    live: true,
    providers: [
      { id: 'vision-flash', name: 'vision-flash', price: 0.003, latency: 240, live: true },
      { id: 'textract-premium', name: 'textract-premium', price: 0.012, latency: 95, live: false },
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

type SampleTask = { label: string; imageUrl?: string }
const SAMPLE_TASKS: SampleTask[] = [
  {
    label: 'Extract competitors from this product screenshot and research them',
    imageUrl: '/sample-screenshot.png',
  },
  { label: "Research Cursor's biggest competitors in the AI IDE space" },
  { label: 'Analyze Q1 earnings reports for top 5 AI companies' },
  { label: 'Compare GPU inference pricing across cloud providers' },
  { label: 'Find recent breakthroughs in protein folding research' },
]

const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/* ── Top nav ──────────────────────────────────────────────── */
function TopNav({
  wallet,
  balance,
  balanceLoading,
  onDisconnect,
  onLogo,
}: {
  wallet: string | null
  balance: number | null
  balanceLoading: boolean
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
            {balance === null ? (balanceLoading ? '…' : '0.0000') : balance.toFixed(4)}
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
  remaining,
  initialBudget,
  decisionMap,
}: {
  remaining: number
  initialBudget: number
  decisionMap: DecisionMap
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'web-search': true })
  const usedPct = Math.max(0, Math.min(100, ((initialBudget - remaining) / initialBudget) * 100))

  // Auto-expand any capability whose providers became 'selected'/'rejected' during a run.
  useEffect(() => {
    const auto: Record<string, boolean> = {}
    for (const cap of CAPABILITIES) {
      const involved = cap.providers.some((p) => decisionMap[p.id] !== undefined)
      if (involved) auto[cap.id] = true
    }
    if (Object.keys(auto).length > 0) {
      setExpanded((prev) => ({ ...prev, ...auto }))
    }
  }, [decisionMap])

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
            {remaining.toFixed(4)}
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
  onRun,
  phase,
  lines,
  running,
  disabled,
}: {
  onRun: (task: string, imageUrl?: string) => void
  phase: Parameters<typeof AgentTrace>[0]['phase']
  lines: Parameters<typeof AgentTrace>[0]['lines']
  running: boolean
  disabled: boolean
}) {
  const [task, setTask] = useState<string>(SAMPLE_TASKS[0].label)
  const [pendingImage, setPendingImage] = useState<string | null>(SAMPLE_TASKS[0].imageUrl ?? null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const submit = () => {
    if (!task.trim() || running || disabled) return
    onRun(task.trim(), pendingImage ?? undefined)
  }

  const onSampleClick = (s: SampleTask) => {
    setTask(s.label)
    setPendingImage(s.imageUrl ?? null)
    setImageError(null)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB · max 4 MB).`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      if (dataUrl) {
        setPendingImage(dataUrl)
        setImageError(null)
      }
    }
    reader.onerror = () => setImageError('Failed to read image file.')
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setPendingImage(null)
    setImageError(null)
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
                aria-label="clear task"
              >
                <X size={11} strokeWidth={1.75} />
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={running}
              className={cn(
                'ml-1 h-7 w-7 rounded-md inline-flex items-center justify-center transition',
                pendingImage
                  ? 'text-violet-400 bg-violet-500/10'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800',
                running && 'cursor-not-allowed opacity-50',
              )}
              aria-label="Attach image"
              title="Attach image"
            >
              <Paperclip size={13} strokeWidth={1.75} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
              aria-hidden
            />
            <span className="ml-1 text-[10px] font-mono text-zinc-600 hidden md:inline">↩</span>
          </div>
          <button
            onClick={submit}
            disabled={running || !task.trim() || disabled}
            className={cn(
              'h-12 px-5 rounded-xl font-medium text-[13.5px] inline-flex items-center gap-2 transition-all active:scale-[0.99]',
              running || !task.trim() || disabled
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

        {/* Image preview row */}
        {(pendingImage || imageError) && !running && (
          <div className="mt-2 flex items-center gap-2">
            {pendingImage && (
              <div className="inline-flex items-center gap-2 h-8 pl-1 pr-2 rounded-md border border-violet-500/30 bg-violet-500/5">
                {pendingImage.startsWith('data:') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pendingImage}
                    alt="attached"
                    className="h-6 w-6 rounded object-cover"
                  />
                ) : (
                  <span className="h-6 w-6 rounded bg-violet-500/20 inline-flex items-center justify-center text-violet-300">
                    <ImageIcon size={11} strokeWidth={1.75} />
                  </span>
                )}
                <span className="font-mono text-[10.5px] text-violet-300">
                  {pendingImage.startsWith('data:') ? 'uploaded image' : pendingImage}
                </span>
                <button
                  onClick={clearImage}
                  className="ml-0.5 h-4 w-4 rounded text-violet-300/70 hover:text-violet-200 hover:bg-violet-500/20 inline-flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <X size={10} strokeWidth={1.75} />
                </button>
              </div>
            )}
            {imageError && (
              <span className="font-mono text-[10.5px] text-red-400">{imageError}</span>
            )}
          </div>
        )}

        <div
          className={cn(
            'mt-3 flex items-start gap-2 flex-wrap transition-all duration-300',
            running && 'opacity-0 -translate-y-1 pointer-events-none h-0 mt-0 overflow-hidden',
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600 mt-2 mr-1">
            Try
          </span>
          {SAMPLE_TASKS.map((s) => {
            const active = task === s.label
            return (
              <button
                key={s.label}
                onClick={() => onSampleClick(s)}
                className={cn(
                  'h-7 px-3 rounded-lg border text-[11.5px] transition truncate max-w-[340px] inline-flex items-center gap-1.5',
                  active
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
                )}
              >
                {s.imageUrl && <ImageIcon size={11} strokeWidth={1.75} className="shrink-0" />}
                <span className="truncate">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <AgentTrace phase={phase} lines={lines} running={running} />
      </div>
    </main>
  )
}

/* ── Right panel — Execution log ──────────────────────────── */
type Execution = {
  id: string
  task: string
  at: number
  steps: CapabilityStep[]
  totalCostUsdc: number
  totalSavedUsdc: number
  plan: PlanSummary
}

type StepRef = { execId: string; stepIdx: number }

function StepRow({
  step,
  onOpenTx,
}: {
  step: CapabilityStep
  onOpenTx: () => void
}) {
  const isPending = step.txHash.startsWith('pending-')
  const valueRej = step.rejectedProviders.find(
    (r) => r.reason === 'cost delta exceeds task value threshold',
  )
  return (
    <div className="rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2.5 py-2 space-y-1 font-mono text-[11px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 shrink-0">
          {step.capabilityLabel}
        </span>
        <span className="text-violet-300 truncate text-right text-[11px] font-medium">
          {step.selectedProvider.name}
        </span>
      </div>
      {valueRej && (
        <div className="flex justify-between gap-3 text-[10.5px]">
          <span className="text-zinc-600 shrink-0">rejected</span>
          <span className="text-red-400/80 truncate text-right">
            {valueRej.name}{' '}
            <span className="text-red-400/60">(+{valueRej.costDeltaPct}%)</span>
          </span>
        </div>
      )}
      <div className="flex justify-between gap-3 text-[10.5px]">
        <span className="text-zinc-600 shrink-0">cost</span>
        <span className="text-zinc-300 num-tab">{step.costUsdc.toFixed(3)} USDC</span>
      </div>
      {step.savedUsdc > 0 && (
        <div className="flex justify-between gap-3 text-[10.5px]">
          <span className="text-zinc-600 shrink-0">saved</span>
          <span className="text-emerald-400 num-tab">{step.savedUsdc.toFixed(3)} USDC</span>
        </div>
      )}
      <div className="flex justify-between items-center gap-3 text-[10.5px]">
        <span className="text-zinc-600 shrink-0">tx</span>
        <button
          onClick={onOpenTx}
          className={cn(
            'inline-flex items-center gap-1 transition shrink-0',
            isPending
              ? 'text-amber-400/80 hover:text-amber-300'
              : 'text-violet-400 hover:text-violet-300',
          )}
        >
          {isPending ? 'pending settlement' : truncAddr(step.txHash, 4, 4)}{' '}
          <ExternalLink size={10} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

function ExecutionCard({
  exec,
  onOpenStep,
}: {
  exec: Execution
  onOpenStep: (ref: StepRef) => void
}) {
  const taskShort = exec.task.length > 48 ? exec.task.slice(0, 46) + '…' : exec.task
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 mb-2 screen-in">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[12px] text-zinc-200 truncate font-medium">{taskShort}</span>
        <span className="inline-flex items-center h-[18px] px-1.5 rounded text-[9.5px] font-mono uppercase tracking-[0.1em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          complete
        </span>
      </div>
      <div className="font-mono text-[10.5px] text-zinc-500 mb-2 truncate">
        plan · <span className="text-zinc-300">{exec.plan.capabilities.join(' → ')}</span>
      </div>
      <div className="space-y-1.5">
        {exec.steps.map((s, i) => (
          <StepRow
            key={`${s.txHash}-${i}`}
            step={s}
            onOpenTx={() => onOpenStep({ execId: exec.id, stepIdx: i })}
          />
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between font-mono text-[10.5px]">
        <span className="text-zinc-500">
          total · <span className="text-zinc-200 num-tab">{exec.totalCostUsdc.toFixed(3)}</span> USDC
        </span>
        {exec.totalSavedUsdc > 0 && (
          <span className="text-emerald-400">
            saved <span className="num-tab">{exec.totalSavedUsdc.toFixed(3)}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function RightPanel({
  executions,
  onOpenStep,
}: {
  executions: Execution[]
  onOpenStep: (ref: StepRef) => void
}) {
  const tasksRun = executions.length
  const providersRejected = executions.reduce(
    (sum, e) => sum + e.steps.reduce((ss, s) => ss + s.rejectedProviders.length, 0),
    0,
  )
  const usdcSaved = executions.reduce((sum, e) => sum + e.totalSavedUsdc, 0)

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
            <ExecutionCard key={e.id} exec={e} onOpenStep={onOpenStep} />
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
function SolscanModal({
  step,
  task,
  onClose,
}: {
  step: CapabilityStep | null
  task: string | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!step) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose])

  if (!step) return null
  const isPending = step.txHash.startsWith('pending-')

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
          {task && (
            <div>
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.14em] mb-1">
                Task · {step.capabilityLabel}
              </div>
              <div className="text-zinc-300 leading-snug">{task}</div>
            </div>
          )}
          <div>
            <div className="text-zinc-500 text-[10px] uppercase tracking-[0.14em] mb-1">
              Signature
            </div>
            <div className={cn(
              'break-all leading-snug',
              isPending ? 'text-amber-400' : 'text-violet-400',
            )}>
              {step.txHash}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.12em]">Status</div>
              <div className={cn('mt-1', isPending ? 'text-amber-400' : 'text-emerald-400')}>
                {isPending ? '◐ pending settlement' : '✓ Confirmed'}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="text-zinc-500 text-[10px] uppercase tracking-[0.12em]">Amount</div>
              <div className="text-white mt-1 num-tab">{step.costUsdc.toFixed(3)} USDC</div>
            </div>
          </div>
          {isPending ? (
            <div className="text-[10.5px] text-amber-400/70 text-center pt-2 leading-relaxed">
              Settlement is pending — the gateway wallet failed to sign on devnet. The
              cost/value decision and the live provider call still ran.
            </div>
          ) : (
            <div className="text-[10px] text-zinc-600 text-center pt-2">
              <a
                href={`https://solscan.io/tx/${step.txHash}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white underline underline-offset-2"
              >
                View on solscan.io →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const { wallet, initialBudget, setWallet } = usePayableSession()
  const { balance, isLoading: balanceLoading } = useAgentBalance()
  const [executions, setExecutions] = useState<Execution[]>([])
  const [openStep, setOpenStep] = useState<{ step: CapabilityStep; task: string } | null>(null)
  const [decisionMap, setDecisionMap] = useState<DecisionMap>({})
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const spent = useMemo(
    () => executions.reduce((sum, e) => sum + e.totalCostUsdc, 0),
    [executions],
  )
  const remaining = Math.max(0, +(initialBudget - spent).toFixed(4))

  const { phase, lines, running, run } = useAgentRun({
    onComplete: ({ response, task }) => {
      setExecutions((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          task,
          at: Date.now(),
          steps: response.steps,
          totalCostUsdc: response.totalCostUsdc,
          totalSavedUsdc: response.totalSavedUsdc,
          plan: response.plan,
        },
        ...prev,
      ])
    },
    onError: ({ message }) => {
      setErrorBanner(message)
      setTimeout(() => setErrorBanner(null), 6000)
    },
  })

  // Drive decision map from streaming lines (real providerIds)
  useEffect(() => {
    const map: DecisionMap = {}
    for (const l of lines) {
      if (!l.providerId) continue
      if (l.type === 'decision') map[l.providerId] = 'selected'
      else if (l.type === 'reject') map[l.providerId] = 'rejected'
    }
    setDecisionMap(map)
  }, [lines])

  // Redirect to /connect if no wallet
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

  const handleRun = (task: string, imageUrl?: string) => {
    if (!wallet) return
    setErrorBanner(null)
    run({
      task,
      budget: remaining > 0 ? remaining : initialBudget,
      walletAddress: wallet,
      imageUrl,
    })
  }

  const handleOpenStep = ({ execId, stepIdx }: StepRef) => {
    const exec = executions.find((e) => e.id === execId)
    const step = exec?.steps[stepIdx]
    if (!exec || !step) return
    setOpenStep({ step, task: exec.task })
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
          balance={balance}
          balanceLoading={balanceLoading}
          onDisconnect={onDisconnect}
          onLogo={onLogo}
        />
        {errorBanner && (
          <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/30 text-red-300 text-[12px] font-mono">
            agent error · {errorBanner}
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel
            remaining={remaining}
            initialBudget={initialBudget}
            decisionMap={decisionMap}
          />
          <CenterPanel
            onRun={handleRun}
            phase={phase}
            lines={lines}
            running={running}
            disabled={!wallet}
          />
          <RightPanel
            executions={executions}
            onOpenStep={handleOpenStep}
          />
        </div>
        <SolscanModal
          step={openStep?.step ?? null}
          task={openStep?.task ?? null}
          onClose={() => setOpenStep(null)}
        />
      </div>
    </ViewTransition>
  )
}
