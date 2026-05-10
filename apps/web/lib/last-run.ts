import type { AgentResponse } from '@payable-ai/types'

export interface LastRunStep {
  capabilityId: string
  capabilityLabel: string
  selected: { name: string; priceUsdc: number }
  premium: { name: string; priceUsdc: number } | null
}

export interface LastRunSummary {
  task: string
  steps: LastRunStep[]
  payablePaidUsdc: number
  naiveWouldPayUsdc: number
  savedUsdc: number
  timestamp: number
}

const KEY = 'payable:lastRun:v1'

export function summarizeRun(task: string, response: AgentResponse): LastRunSummary {
  const steps: LastRunStep[] = response.steps.map((s) => {
    const candidates = [
      { name: s.selectedProvider.name, priceUsdc: s.selectedProvider.priceUsdc },
      ...s.rejectedProviders.map((r) => ({ name: r.name, priceUsdc: r.priceUsdc })),
    ]
    const premium = candidates.reduce<{ name: string; priceUsdc: number } | null>(
      (max, c) => (max == null || c.priceUsdc > max.priceUsdc ? c : max),
      null,
    )
    return {
      capabilityId: s.capabilityId,
      capabilityLabel: s.capabilityLabel,
      selected: { name: s.selectedProvider.name, priceUsdc: s.selectedProvider.priceUsdc },
      premium: premium && premium.name !== s.selectedProvider.name ? premium : null,
    }
  })
  const payablePaidUsdc = steps.reduce((acc, s) => acc + s.selected.priceUsdc, 0)
  const naiveWouldPayUsdc = steps.reduce(
    (acc, s) => acc + (s.premium?.priceUsdc ?? s.selected.priceUsdc),
    0,
  )
  return {
    task,
    steps,
    payablePaidUsdc: +payablePaidUsdc.toFixed(6),
    naiveWouldPayUsdc: +naiveWouldPayUsdc.toFixed(6),
    savedUsdc: +(naiveWouldPayUsdc - payablePaidUsdc).toFixed(6),
    timestamp: Date.now(),
  }
}

export function writeLastRun(s: LastRunSummary): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function readLastRun(): LastRunSummary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastRunSummary
    if (!parsed || !Array.isArray(parsed.steps) || typeof parsed.payablePaidUsdc !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const SAMPLE_LAST_RUN: LastRunSummary = {
  task: 'Extract competitors from this product screenshot and research them',
  steps: [
    {
      capabilityId: 'ocr',
      capabilityLabel: 'OCR',
      selected: { name: 'vision-flash', priceUsdc: 0.003 },
      premium: { name: 'textract-premium', priceUsdc: 0.012 },
    },
    {
      capabilityId: 'web-search',
      capabilityLabel: 'WEB SEARCH',
      selected: { name: 'tavily-standard', priceUsdc: 0.002 },
      premium: { name: 'serpapi-premium', priceUsdc: 0.015 },
    },
  ],
  payablePaidUsdc: 0.005,
  naiveWouldPayUsdc: 0.027,
  savedUsdc: 0.022,
  timestamp: 0,
}
