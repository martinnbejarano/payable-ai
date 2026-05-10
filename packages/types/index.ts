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

export type AgentPhase = 'IDLE' | 'EVALUATING' | 'DECIDING' | 'ACQUIRING' | 'COMPLETE'

export interface ReasoningLine {
  type: ReasoningLineType
  text: string
  indent?: boolean
  timestamp: number
  phase: AgentPhase
  costDelta?: number
  costDeltaPct?: number
  providerId?: string
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

export interface AgentResponse {
  selectedProvider: Provider
  selectedCapability: string
  rejectedProviders: RejectedProvider[]
  savedUsdc: number
  txHash: string
  costUsdc: number
  results: SearchResult[]
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
