export interface PayableAPI {
  id: string
  name: string
  description: string
  endpoint: string
  priceUsdc: number
  currency: string
  network: string
  latencyMs: number
  category: string
}

export interface AgentTask {
  task: string
  budget: number
  walletAddress: string
}

export type ReasoningLineType =
  | 'sys'
  | 'api'
  | 'think'
  | 'decision'
  | 'http'
  | 'pay'
  | 'confirmed'

export interface ReasoningLine {
  type: ReasoningLineType
  text: string
  timestamp: number
}

export interface Transaction {
  hash: string
  amount: number
  api: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
}

export interface AgentResponse {
  reasoning: ReasoningLine[]
  selectedApi: PayableAPI
  txHash: string
  results: string[]
}
