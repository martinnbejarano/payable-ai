'use client'

import { Cpu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PulseDot, randHex, truncAddr } from './primitives'

/* ── Phase ────────────────────────────────────────────────── */
export type Phase = 'IDLE' | 'DISCOVERING' | 'REASONING' | 'PAYING' | 'COMPLETE'

const PHASE_LABEL: Record<Phase, string> = {
  IDLE: 'IDLE',
  DISCOVERING: 'DISCOVERING',
  REASONING: 'REASONING',
  PAYING: 'PAYING',
  COMPLETE: 'COMPLETE',
}

/* ── Trace script ─────────────────────────────────────────── */
type LineType =
  | 'sys'
  | 'info'
  | 'api'
  | 'reasoning'
  | 'decision'
  | 'http'
  | 'http-ok'
  | 'payment'
  | 'success'

type Line = {
  type: LineType
  text: string
  indent?: number
  phase: Phase
  delay: number
}

function buildTraceScript(task: string, txHash: string): Line[] {
  return [
    { type: 'sys', text: 'Agent initialized. Parsing task...', phase: 'DISCOVERING', delay: 420 },
    { type: 'sys', text: `Task: "${task}"`, phase: 'DISCOVERING', delay: 480 },
    { type: 'sys', text: 'Discovering payable API endpoints...', phase: 'DISCOVERING', delay: 700 },
    {
      type: 'info',
      text: 'Found 2 endpoints matching capability: [search]',
      phase: 'DISCOVERING',
      delay: 620,
    },
    {
      type: 'api',
      text: 'tavily-standard      0.002 USDC/req   latency: 380ms',
      indent: 1,
      phase: 'DISCOVERING',
      delay: 480,
    },
    {
      type: 'api',
      text: 'serpapi-premium      0.015 USDC/req   latency: 210ms',
      indent: 1,
      phase: 'DISCOVERING',
      delay: 480,
    },
    {
      type: 'reasoning',
      text: 'Evaluating options against budget...',
      phase: 'REASONING',
      delay: 780,
    },
    {
      type: 'reasoning',
      text: 'serpapi-premium → cost 0.015 USDC exceeds budget threshold → REJECTED',
      indent: 1,
      phase: 'REASONING',
      delay: 720,
    },
    {
      type: 'reasoning',
      text: 'tavily-standard → cost 0.002 USDC within budget → ELIGIBLE',
      indent: 1,
      phase: 'REASONING',
      delay: 720,
    },
    {
      type: 'reasoning',
      text: 'Task complexity: LOW. Premium latency not required.',
      indent: 1,
      phase: 'REASONING',
      delay: 700,
    },
    {
      type: 'decision',
      text: '→ DECISION: tavily-standard @ 0.002 USDC',
      phase: 'REASONING',
      delay: 820,
    },
    { type: 'http', text: 'GET payable.ai/search/tavily', phase: 'PAYING', delay: 540 },
    { type: 'http', text: '← 402 Payment Required', phase: 'PAYING', delay: 620 },
    {
      type: 'http',
      text: 'amount: 0.002 USDC | network: solana:devnet',
      indent: 1,
      phase: 'PAYING',
      delay: 520,
    },
    { type: 'payment', text: 'Signing Solana transaction...', phase: 'PAYING', delay: 720 },
    { type: 'payment', text: 'Broadcasting to Solana Devnet...', phase: 'PAYING', delay: 800 },
    {
      type: 'success',
      text: `✓ Payment confirmed — ${truncAddr(txHash, 8, 8)}`,
      phase: 'PAYING',
      delay: 720,
    },
    {
      type: 'http',
      text: 'GET payable.ai/search/tavily (with payment)',
      phase: 'COMPLETE',
      delay: 480,
    },
    { type: 'http-ok', text: '← 200 OK · 4 results returned', phase: 'COMPLETE', delay: 600 },
  ]
}

const LINE_CLASS: Record<LineType, string> = {
  sys: 'text-zinc-500',
  info: 'text-blue-400',
  api: 'text-blue-300',
  reasoning: 'text-amber-400',
  decision: 'text-white font-bold',
  http: 'text-zinc-400',
  'http-ok': 'text-emerald-400',
  payment: 'text-orange-400',
  success: 'text-emerald-400 font-bold',
}

const LINE_PREFIX: Record<LineType, string> = {
  sys: '›',
  info: 'ℹ',
  api: '•',
  reasoning: '·',
  decision: '→',
  http: '—',
  'http-ok': '—',
  payment: '$',
  success: '✓',
}

/* ── Phase pill ───────────────────────────────────────────── */
export function PhasePill({ phase }: { phase: Phase }) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-2 h-[26px] px-2.5 rounded-md border font-mono text-[10.5px] tracking-[0.14em] uppercase overflow-hidden',
        phase === 'IDLE' && 'border-zinc-800 bg-zinc-900 text-zinc-500',
        phase === 'DISCOVERING' && 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        phase === 'REASONING' && 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        phase === 'PAYING' && 'border-red-500/25 bg-red-500/15 text-red-400',
        phase === 'COMPLETE' && 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400',
      )}
    >
      {phase !== 'IDLE' && phase !== 'COMPLETE' && (
        <div className="absolute inset-0 shimmer pointer-events-none" />
      )}
      <PulseDot
        tone={
          phase === 'COMPLETE'
            ? 'success'
            : phase === 'REASONING'
              ? 'warn'
              : phase === 'PAYING'
                ? 'danger'
                : 'muted'
        }
        size={5}
      />
      <span className="relative">{PHASE_LABEL[phase]}</span>
    </div>
  )
}

/* ── AgentTrace panel ─────────────────────────────────────── */
export function AgentTrace({
  phase,
  lines,
  running,
}: {
  phase: Phase
  lines: Line[]
  running: boolean
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, running])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden flex flex-col h-full">
      <div className="h-10 px-3.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-500">
            Agent Trace
          </span>
          <span className="text-zinc-700">·</span>
          <span className="font-mono text-[10.5px] text-zinc-600">claude-3.7-sonnet</span>
        </div>
        <PhasePill phase={phase} />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto thin-scroll p-4 font-mono text-[12px] leading-[1.7] min-h-[260px]"
      >
        {lines.length === 0 && !running && (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-6">
            <div className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-900/60 flex items-center justify-center text-zinc-500 mb-4">
              <Cpu size={16} strokeWidth={1.75} />
            </div>
            <div className="text-[13px] text-zinc-300 font-display">Idle</div>
            <div className="mt-1 text-[12px] text-zinc-500 max-w-[320px]">
              Run an agent task to see the economic reasoning trace stream live.
            </div>
          </div>
        )}

        {lines.map((line, i) => (
          <div
            key={i}
            className={cn('line-in flex items-baseline gap-0', line.indent && 'pl-6')}
          >
            <span className="trace-prefix font-mono text-[11px]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={cn('mr-2 opacity-60', LINE_CLASS[line.type])}>
              {LINE_PREFIX[line.type]}
            </span>
            <span className={cn('whitespace-pre-wrap break-words', LINE_CLASS[line.type])}>
              {line.text}
            </span>
          </div>
        ))}

        {running && (
          <div className="flex items-baseline gap-0 mt-1.5">
            <span className="trace-prefix font-mono text-[11px]">
              {String(lines.length + 1).padStart(2, '0')}
            </span>
            <span className="text-accent-soft caret">▍</span>
          </div>
        )}
      </div>

      <div className="h-8 px-3.5 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/30 shrink-0 text-[10.5px] font-mono text-zinc-600 tracking-[0.08em]">
        <div className="flex items-center gap-3">
          <span>
            lines · <span className="text-zinc-300 num-tab">{String(lines.length).padStart(2, '0')}</span>
          </span>
          <span className="text-zinc-800">|</span>
          <span>
            tokens ·{' '}
            <span className="text-zinc-300 num-tab">
              {String(lines.length * 24 + 128).padStart(4, '0')}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <PulseDot tone={running ? 'accent' : 'muted'} size={5} />
          <span>{running ? 'streaming' : 'ready'}</span>
        </div>
      </div>
    </div>
  )
}

/* ── useAgentRun ──────────────────────────────────────────── */
type UseAgentRunArgs = {
  onTxConfirmed?: (info: { hash: string; task: string }) => void
  onComplete?: (info: { hash: string; task: string }) => void
}

export function useAgentRun({ onTxConfirmed, onComplete }: UseAgentRunArgs = {}) {
  const [phase, setPhase] = useState<Phase>('IDLE')
  const [lines, setLines] = useState<Line[]>([])
  const [running, setRunning] = useState(false)
  const [lastTask, setLastTask] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cbRef = useRef({ onTxConfirmed, onComplete })

  useEffect(() => {
    cbRef.current = { onTxConfirmed, onComplete }
  }, [onTxConfirmed, onComplete])

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout)
    },
    [],
  )

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setPhase('IDLE')
    setLines([])
    setRunning(false)
    setLastTask(null)
    setLastTx(null)
  }, [])

  const run = useCallback((task: string) => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    const txHash = randHex(64)
    const script = buildTraceScript(task, txHash)
    setLines([])
    setPhase('DISCOVERING')
    setRunning(true)
    setLastTask(task)
    setLastTx(txHash)

    let cum = 0
    script.forEach((line, idx) => {
      cum += line.delay
      const t = setTimeout(() => {
        setLines((prev) => [...prev, line])
        setPhase(line.phase)
        if (line.type === 'success') {
          cbRef.current.onTxConfirmed?.({ hash: txHash, task })
        }
        if (idx === script.length - 1) {
          setPhase('COMPLETE')
          setRunning(false)
          cbRef.current.onComplete?.({ hash: txHash, task })
        }
      }, cum)
      timersRef.current.push(t)
    })
  }, [])

  return { phase, lines, running, lastTask, lastTx, run, reset }
}
