export interface Provider {
  id: string
  name: string
  priceUsdc: number
  latencyMs: number
  live: boolean
  endpoint?: string
  network: string
}

export interface Capability {
  id: string
  label: string
  live: boolean
  providers: Provider[]
}

export interface AgentTask {
  task: string
  budget: number
  walletAddress: string
  imageUrl?: string
}

export type ReasoningLineType =
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
  | 'plan'

export type AgentPhase =
  | 'IDLE'
  | 'PLANNING'
  | 'EVALUATING'
  | 'DECIDING'
  | 'ACQUIRING'
  | 'COMPLETE'

export interface ReasoningLine {
  type: ReasoningLineType
  text: string
  indent?: boolean
  timestamp: number
  phase: AgentPhase
  costDelta?: number
  costDeltaPct?: number
  providerId?: string
  capabilityId?: string
  txHash?: string
}

export type RejectionReason =
  | 'cost delta exceeds task value threshold'
  | 'exceeds budget'
  | 'mock-only — no live endpoint'

export interface RejectedProvider {
  id: string
  name: string
  reason: RejectionReason
  priceUsdc: number
  costDelta: number
  costDeltaPct: number
}

export interface SearchResult {
  title: string
  url: string
  snippet?: string
}

export interface OcrResult {
  text: string
  confidence: number
}

export type CapabilityOutput =
  | { kind: 'search'; results: SearchResult[] }
  | { kind: 'ocr'; text: string; confidence: number }

export interface CapabilityStep {
  capabilityId: string
  capabilityLabel: string
  selectedProvider: Provider
  rejectedProviders: RejectedProvider[]
  costUsdc: number
  savedUsdc: number
  txHash: string
  output?: CapabilityOutput
}

export interface PlanSummary {
  capabilities: string[]
  rationale: string
}

export interface AgentResponse {
  task: string
  steps: CapabilityStep[]
  totalCostUsdc: number
  totalSavedUsdc: number
  plan: PlanSummary
}

export type AgentStreamEvent =
  | { kind: 'line'; line: ReasoningLine }
  | { kind: 'phase'; phase: AgentPhase }
  | { kind: 'result'; response: AgentResponse }
  | { kind: 'error'; message: string }

export interface Transaction {
  hash: string
  amount: number
  capability: string
  provider: string
  task: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
}
