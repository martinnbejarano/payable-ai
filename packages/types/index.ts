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

export interface ReasoningLine {
  type: ReasoningLineType
  text: string
  indent?: number
  timestamp: number
  phase: string
}

export interface Transaction {
  hash: string
  amount: number
  capability: string
  provider: string
  task: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
}

export interface AgentResponse {
  reasoning: ReasoningLine[]
  selectedProvider: Provider
  selectedCapability: string
  rejectedProviders: string[]
  savedUsdc: number
  txHash: string
  results: string[]
}
