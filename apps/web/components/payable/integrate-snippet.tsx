'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronRight, Code as CodeIcon, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntegrateSnippetProps {
  task: string | null
  hasImage: boolean
}

function buildEndpointUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env) return `${env.replace(/\/$/, '')}/api/v1/run`
  if (typeof window !== 'undefined') return `${window.location.origin}/api/v1/run`
  return 'https://payable.ai/api/v1/run'
}

function buildCurl(endpoint: string, task: string, hasImage: boolean): string {
  const safeTask = task.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const payload = hasImage
    ? `{"task":"${safeTask}","budget":0.01,"imageUrl":"/sample-screenshot.png"}`
    : `{"task":"${safeTask}","budget":0.01}`
  return `curl -X POST ${endpoint} \\\n  -H "content-type: application/json" \\\n  -d '${payload}'`
}

function HighlightedCurl({ endpoint, task, hasImage }: {
  endpoint: string
  task: string
  hasImage: boolean
}) {
  const safeTask = task.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return (
    <code className="block whitespace-pre font-mono text-[11px] leading-[1.55] text-zinc-300">
      <span className="text-violet-300">curl</span>
      <span className="text-zinc-300"> -X </span>
      <span className="text-amber-300">POST</span>
      <span className="text-zinc-300"> </span>
      <span className="text-emerald-400/90">{endpoint}</span>
      <span className="text-zinc-500"> \</span>
      {'\n  '}
      <span className="text-zinc-300">-H </span>
      <span className="text-emerald-400/80">&quot;content-type: application/json&quot;</span>
      <span className="text-zinc-500"> \</span>
      {'\n  '}
      <span className="text-zinc-300">-d </span>
      <span className="text-emerald-400/80">
        {`'{"task":"${safeTask}","budget":0.01${hasImage ? ',"imageUrl":"/sample-screenshot.png"' : ''}}'`}
      </span>
    </code>
  )
}

export function IntegrateSnippet({ task, hasImage }: IntegrateSnippetProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const endpoint = useMemo(() => buildEndpointUrl(), [])
  const isDisabled = task === null
  const effectiveTask = task ?? 'Your task here'
  const curlText = useMemo(
    () => buildCurl(endpoint, effectiveTask, hasImage),
    [endpoint, effectiveTask, hasImage],
  )

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard may be blocked in some browsers — silently no-op
    }
  }

  return (
    <div
      className={cn(
        'rounded-md border transition-colors',
        isDisabled
          ? 'border-zinc-800 bg-zinc-900/40'
          : 'border-violet-500/25 bg-violet-500/5',
      )}
    >
      <button
        type="button"
        onClick={() => !isDisabled && setExpanded((e) => !e)}
        disabled={isDisabled}
        className={cn(
          'w-full h-9 px-2.5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors',
          isDisabled
            ? 'text-zinc-600 cursor-not-allowed'
            : 'text-violet-300 hover:text-violet-200',
        )}
        aria-expanded={expanded}
        aria-label="Toggle integration snippet"
      >
        <CodeIcon
          size={12}
          strokeWidth={1.75}
          className={cn('shrink-0', isDisabled ? 'text-zinc-600' : 'text-violet-400')}
        />
        <span className="truncate">
          Integrate <span className="text-zinc-500">·</span>{' '}
          <span className={isDisabled ? 'text-zinc-600' : 'text-violet-200'}>
            {isDisabled ? 'run a task first' : 'curl'}
          </span>
        </span>
        <ChevronRight
          size={12}
          strokeWidth={1.75}
          className={cn(
            'ml-auto shrink-0 transition-transform',
            expanded && 'rotate-90',
            isDisabled && 'opacity-40',
          )}
        />
      </button>

      {expanded && !isDisabled && (
        <div className="px-2.5 pb-2.5 pt-0.5 screen-in">
          <div className="relative rounded border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 overflow-x-auto thin-scroll">
            <button
              type="button"
              onClick={onCopy}
              className={cn(
                'absolute top-1.5 right-1.5 h-6 px-1.5 inline-flex items-center gap-1 rounded text-[10px] font-mono uppercase tracking-[0.12em] transition-colors',
                copied
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800',
              )}
              aria-label={copied ? 'Copied' : 'Copy curl'}
            >
              {copied ? (
                <>
                  <Check size={10} strokeWidth={2} /> copied
                </>
              ) : (
                <>
                  <Copy size={10} strokeWidth={1.75} /> copy
                </>
              )}
            </button>
            <HighlightedCurl endpoint={endpoint} task={effectiveTask} hasImage={hasImage} />
          </div>
          <div className="mt-1.5 px-0.5 font-mono text-[10px] text-zinc-600 leading-snug">
            → returns AgentResponse JSON · demo mode (no wallet required)
          </div>
        </div>
      )}
    </div>
  )
}
