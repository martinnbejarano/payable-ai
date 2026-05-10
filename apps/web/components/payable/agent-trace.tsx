'use client'

import { Cpu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type {
  AgentPhase,
  AgentResponse,
  AgentStreamEvent,
  ReasoningLine,
  ReasoningLineType,
} from '@payable-ai/types'
import { cn } from '@/lib/utils'
import { PulseDot } from './primitives'

export type Phase = AgentPhase

/* ── Styling ──────────────────────────────────────────────── */
function lineClass(type: ReasoningLineType): string {
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
    case 'plan':     return 'text-violet-300 font-semibold text-[13px]'
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
        phase === 'PLANNING'   && 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300',
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
          phase === 'PLANNING' ? 'accent'
          : phase === 'EVALUATING' ? 'muted'
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
function TraceLine({ line, idx }: { line: ReasoningLine; idx: number }) {
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
  costUsdc,
}: {
  phase: Phase
  lines: ReasoningLine[]
  running: boolean
  costUsdc?: number
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, running])

  const evals = lines.filter((l) => l.type === 'eval').length
  const settledCount = lines.filter((l) => l.type === 'settled').length
  const cost = costUsdc ?? +(settledCount * 0.005).toFixed(3)

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
type RunArgs = { task: string; budget: number; walletAddress: string; imageUrl?: string }

type UseAgentRunArgs = {
  onTxConfirmed?: (info: { hash: string; task: string }) => void
  onComplete?: (info: { response: AgentResponse; task: string }) => void
  onError?: (info: { message: string; task: string }) => void
}

export function useAgentRun({ onTxConfirmed, onComplete, onError }: UseAgentRunArgs = {}) {
  const [phase, setPhase] = useState<Phase>('IDLE')
  const [lines, setLines] = useState<ReasoningLine[]>([])
  const [running, setRunning] = useState(false)
  const [lastTask, setLastTask] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cbRef = useRef({ onTxConfirmed, onComplete, onError })

  useEffect(() => {
    cbRef.current = { onTxConfirmed, onComplete, onError }
  }, [onTxConfirmed, onComplete, onError])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('IDLE')
    setLines([])
    setRunning(false)
    setLastTask(null)
    setLastTx(null)
  }, [])

  const run = useCallback(async ({ task, budget, walletAddress, imageUrl }: RunArgs) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    setLines([])
    setPhase('PLANNING')
    setRunning(true)
    setLastTask(task)
    setLastTx(null)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, budget, walletAddress, imageUrl }),
        signal: ac.signal,
      })
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '')
        throw new Error(`/api/agent ${res.status} ${errText}`)
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const parts = buf.split('\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.trim()) continue
          let ev: { kind: string; [k: string]: unknown }
          try {
            ev = JSON.parse(part)
          } catch {
            continue
          }
          if (ev.kind === '_pad') continue
          // flushSync forces React to render between events even when several
          // chunks arrive within the same microtask, so the trace never
          // collapses into a single render ("lineal" appearance).
          flushSync(() => {
            const e = ev as unknown as AgentStreamEvent
            if (e.kind === 'line') {
              setLines((prev) => [...prev, e.line])
              if (e.line.type === 'settled' && e.line.txHash) {
                setLastTx(e.line.txHash)
                cbRef.current.onTxConfirmed?.({ hash: e.line.txHash, task })
              }
            } else if (e.kind === 'phase') {
              setPhase(e.phase)
            } else if (e.kind === 'result') {
              cbRef.current.onComplete?.({ response: e.response, task })
            } else if (e.kind === 'error') {
              cbRef.current.onError?.({ message: e.message, task })
            }
          })
        }
      }
    } catch (err) {
      if (ac.signal.aborted) return
      const message = err instanceof Error ? err.message : String(err)
      console.error('[useAgentRun]', err)
      cbRef.current.onError?.({ message, task })
    } finally {
      if (!ac.signal.aborted) {
        setRunning(false)
      }
    }
  }, [])

  return { phase, lines, running, lastTask, lastTx, run, reset }
}
