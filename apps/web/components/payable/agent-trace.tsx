'use client'

import { Cpu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { PulseDot, randHex, truncAddr } from './primitives'

/* ── Phases ───────────────────────────────────────────────── */
export type Phase = 'IDLE' | 'EVALUATING' | 'DECIDING' | 'ACQUIRING' | 'COMPLETE'

/* ── Line types ───────────────────────────────────────────── */
type LineType =
  | 'sys'
  | 'found'
  | 'market'
  | 'provider'
  | 'eval'
  | 'reject'
  | 'decision'
  | 'http'
  | 'settled'
  | 'complete'

type Line = {
  type: LineType
  text: string
  indent?: boolean
  phase: Phase
  delay: number
}

/* ── Trace script ─────────────────────────────────────────── */
function buildTraceScript(task: string, txHash: string, remaining: number): Line[] {
  const t = (type: LineType, text: string, phase: Phase, delay: number, indent?: boolean): Line =>
    ({ type, text, phase, delay, ...(indent ? { indent: true } : {}) })

  return [
    t('sys',      'Parsing task...',                                          'EVALUATING', 480),
    t('sys',      `Goal: "${task}"`,                                          'EVALUATING', 540),
    t('sys',      'Classifying required capability...',                       'EVALUATING', 700),
    t('found',    'Required: [ web search ]',                                 'EVALUATING', 480),
    t('sys',      'Querying compute market...',                               'EVALUATING', 700),
    t('market',   'WEB SEARCH — 2 providers available',                       'EVALUATING', 700),
    t('provider', 'tavily-standard    0.002 USDC    conf 0.82    lat 380ms', 'EVALUATING', 380, true),
    t('provider', 'serpapi-premium    0.015 USDC    conf 0.89    lat 210ms', 'EVALUATING', 380, true),
    t('eval',     'Evaluating cost/value tradeoffs...',                       'DECIDING',   760, true),
    t('eval',     'Δ cost: +0.013 USDC for +8% confidence gain',             'DECIDING',   640, true),
    t('eval',     'Task value threshold: 0.005 USDC',                        'DECIDING',   540, true),
    t('eval',     'Premium cost delta exceeds task value threshold',          'DECIDING',   480, true),
    t('reject',   'serpapi-premium → REJECTED',                               'DECIDING',   480),
    t('decision', '→ OPTIMAL: tavily-standard @ 0.002 USDC',                 'DECIDING',   780),
    t('sys',      'Acquiring capability via x402...',                         'ACQUIRING',  720),
    t('http',     'GET /capabilities/web-search/tavily-standard',             'ACQUIRING',  460, true),
    t('http',     '← 402 · payment required · 0.002 USDC',                   'ACQUIRING',  380, true),
    t('http',     'Settling on solana:devnet...',                             'ACQUIRING',  1100, true),
    t('settled',  `✓ Settled — capability acquired · ${truncAddr(txHash, 5, 5)}`, 'ACQUIRING', 1300, true),
    t('sys',      'Executing web search...',                                  'COMPLETE',   480),
    t('http',     '← 200 OK · 4 results',                                    'COMPLETE',   700, true),
    t('complete', `Task complete · 0.002 USDC spent · budget remaining ${remaining.toFixed(4)} USDC`, 'COMPLETE', 420),
  ]
}

/* ── Styling ──────────────────────────────────────────────── */
function lineClass(type: LineType): string {
  switch (type) {
    case 'sys':      return 'text-zinc-500'
    case 'found':    return 'text-zinc-300'
    case 'market':   return 'text-blue-400'
    case 'provider': return 'text-zinc-400'
    case 'eval':     return 'text-amber-400'
    case 'reject':   return 'text-red-400/70'
    case 'decision': return 'text-white font-semibold text-[13px]'
    case 'http':     return 'text-zinc-600'
    case 'settled':  return 'text-emerald-400'
    case 'complete': return 'text-emerald-300 font-medium'
    default:         return 'text-zinc-300'
  }
}

/* ── Phase pill ───────────────────────────────────────────── */
export function PhasePill({ phase }: { phase: Phase }) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-2 h-[26px] px-2.5 rounded-md border font-mono text-[10.5px] tracking-[0.14em] uppercase overflow-hidden',
        phase === 'IDLE'       && 'border-zinc-800 bg-zinc-900 text-zinc-500',
        phase === 'EVALUATING' && 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        phase === 'DECIDING'   && 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        phase === 'ACQUIRING'  && 'border-violet-500/30 bg-violet-500/10 text-violet-300',
        phase === 'COMPLETE'   && 'border-emerald-500/25 bg-emerald-500/15 text-emerald-400',
      )}
    >
      {phase !== 'IDLE' && phase !== 'COMPLETE' && (
        <div className="absolute inset-0 shimmer pointer-events-none" />
      )}
      <PulseDot
        tone={
          phase === 'EVALUATING' ? 'muted'
          : phase === 'DECIDING' ? 'warn'
          : phase === 'ACQUIRING' ? 'accent'
          : phase === 'COMPLETE' ? 'success'
          : 'muted'
        }
        size={5}
      />
      <span className="relative">{phase}</span>
    </div>
  )
}

/* ── TraceLine ────────────────────────────────────────────── */
function TraceLine({ line, idx }: { line: Line; idx: number }) {
  const isDecision = line.type === 'decision'
  return (
    <div
      className={cn(
        'line-in flex items-baseline gap-0',
        line.indent && 'pl-6',
        isDecision && 'py-1.5 pl-3 -ml-1 border-l-2 border-violet-500 bg-violet-500/5 rounded-r-md mt-1 mb-1',
      )}
    >
      <span className={cn('font-mono text-[10.5px] mr-2 num-tab', isDecision ? 'text-violet-400/70' : 'text-zinc-700')}>
        {String(idx + 1).padStart(2, '0')}
      </span>
      <span className={cn('whitespace-pre-wrap break-words', lineClass(line.type))}>
        {line.text}
      </span>
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

  const evals = lines.filter((l) => l.type === 'eval').length
  const cost = lines.some((l) => l.type === 'settled' || l.type === 'complete') ? 0.002 : 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden flex flex-col h-full">
      <div className="h-10 px-3.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-zinc-500 truncate">
            Reasoning
          </span>
          <span className="text-zinc-700 shrink-0">·</span>
          <span className="font-mono text-[10.5px] text-zinc-600 truncate">payable/v1</span>
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
              Run an agent task to see economic reasoning stream live.
            </div>
          </div>
        )}

        {lines.map((line, i) => (
          <TraceLine key={i} line={line} idx={i} />
        ))}

        {running && (
          <div className="flex items-baseline gap-0 mt-1.5">
            <span className="font-mono text-[10.5px] mr-2 text-zinc-700 num-tab">
              {String(lines.length + 1).padStart(2, '0')}
            </span>
            <span className="text-violet-300 caret">▍</span>
          </div>
        )}
      </div>

      <div className="h-8 px-3.5 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/30 shrink-0 text-[10.5px] font-mono text-zinc-600 tracking-[0.04em]">
        <div className="flex items-center gap-3">
          <span>steps · <span className="text-zinc-300 num-tab">{String(lines.length).padStart(2, '0')}</span></span>
          <span className="text-zinc-800">|</span>
          <span>evaluations · <span className="text-amber-400 num-tab">{String(evals).padStart(2, '0')}</span></span>
          <span className="text-zinc-800">|</span>
          <span>cost · <span className="text-zinc-300 num-tab">{cost.toFixed(3)}</span> USDC</span>
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
  getRemaining?: () => number
}

export function useAgentRun({ onTxConfirmed, onComplete, getRemaining }: UseAgentRunArgs = {}) {
  const [phase, setPhase] = useState<Phase>('IDLE')
  const [lines, setLines] = useState<Line[]>([])
  const [running, setRunning] = useState(false)
  const [lastTask, setLastTask] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cbRef = useRef({ onTxConfirmed, onComplete, getRemaining })

  useEffect(() => {
    cbRef.current = { onTxConfirmed, onComplete, getRemaining }
  }, [onTxConfirmed, onComplete, getRemaining])

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
    const remaining = Math.max(0, (cbRef.current.getRemaining?.() ?? 0.01) - 0.002)
    const script = buildTraceScript(task, txHash, remaining)
    setLines([])
    setPhase('EVALUATING')
    setRunning(true)
    setLastTask(task)
    setLastTx(txHash)

    let cum = 0
    script.forEach((line, idx) => {
      cum += line.delay
      const t = setTimeout(() => {
        setLines((prev) => [...prev, line])
        setPhase(line.phase)
        if (line.type === 'settled') {
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
