import { createHash } from 'node:crypto'
import type { AgentResponse, CapabilityStep, Provider, RejectedProvider } from '@payable-ai/types'

export type DemoAgentResponse = AgentResponse & { demo: true }

const VISION_FLASH: Provider = {
  id: 'vision-flash',
  name: 'vision-flash',
  priceUsdc: 0.003,
  latencyMs: 240,
  live: true,
  endpoint: '/api/ocr',
  network: 'solana:devnet',
}

const TEXTRACT_PREMIUM_REJECTED: RejectedProvider = {
  id: 'textract-premium',
  name: 'textract-premium',
  reason: 'cost delta exceeds task value threshold',
  priceUsdc: 0.012,
  costDelta: 0.009,
  costDeltaPct: 300,
}

const TAVILY_STANDARD: Provider = {
  id: 'tavily-standard',
  name: 'tavily-standard',
  priceUsdc: 0.002,
  latencyMs: 380,
  live: true,
  endpoint: '/api/search',
  network: 'solana:devnet',
}

const SERPAPI_PREMIUM_REJECTED: RejectedProvider = {
  id: 'serpapi-premium',
  name: 'serpapi-premium',
  reason: 'cost delta exceeds task value threshold',
  priceUsdc: 0.015,
  costDelta: 0.013,
  costDeltaPct: 650,
}

const FIXED_OCR_TEXT =
  'AgentForge — AI coding assistants, ranked by real developer benchmarks.\n' +
  'Cursor · $20 / mo · OpenAI + Claude · Top pick\n' +
  'GitHub Copilot · $10 / mo · OpenAI · Solid\n' +
  'Codeium · Free · Proprietary · Top pick\n' +
  'Tabnine · $12 / mo · Self-hosted · Solid'

const FIXED_SEARCH_RESULTS = [
  {
    title: 'Cursor — The AI Code Editor',
    url: 'https://cursor.com',
    snippet:
      'Cursor is the IDE built for pair-programming with AI. Real-time edits across files, codebase-aware chat, and a free tier for hobbyists.',
  },
  {
    title: 'GitHub Copilot · Your AI pair programmer',
    url: 'https://github.com/features/copilot',
    snippet:
      'Copilot offers code completions and chat across 200+ languages, with Business and Enterprise tiers and IDE integrations.',
  },
  {
    title: 'Codeium — Free AI-powered code completion',
    url: 'https://codeium.com',
    snippet:
      'Codeium provides free unlimited AI completions to individuals, with proprietary models and JetBrains/VS Code support.',
  },
]

function hash8(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 8)
}

function ocrStep(task: string): CapabilityStep {
  return {
    capabilityId: 'ocr',
    capabilityLabel: 'OCR',
    selectedProvider: VISION_FLASH,
    rejectedProviders: [TEXTRACT_PREMIUM_REJECTED],
    costUsdc: VISION_FLASH.priceUsdc,
    savedUsdc: TEXTRACT_PREMIUM_REJECTED.costDelta,
    txHash: `demo-ocr-${hash8(task)}`,
    output: { kind: 'ocr', text: FIXED_OCR_TEXT, confidence: 0.94 },
  }
}

function webSearchStep(task: string): CapabilityStep {
  return {
    capabilityId: 'web-search',
    capabilityLabel: 'WEB SEARCH',
    selectedProvider: TAVILY_STANDARD,
    rejectedProviders: [SERPAPI_PREMIUM_REJECTED],
    costUsdc: TAVILY_STANDARD.priceUsdc,
    savedUsdc: SERPAPI_PREMIUM_REJECTED.costDelta,
    txHash: `demo-web-search-${hash8(task)}`,
    output: { kind: 'search', results: FIXED_SEARCH_RESULTS },
  }
}

export function buildDemoResponse(task: string, hasImage: boolean): DemoAgentResponse {
  const steps: CapabilityStep[] = hasImage
    ? [ocrStep(task), webSearchStep(task)]
    : [webSearchStep(task)]
  const totalCostUsdc = +steps.reduce((s, x) => s + x.costUsdc, 0).toFixed(4)
  const totalSavedUsdc = +steps.reduce((s, x) => s + x.savedUsdc, 0).toFixed(4)
  return {
    task,
    steps,
    totalCostUsdc,
    totalSavedUsdc,
    plan: {
      capabilities: hasImage ? ['ocr', 'web-search'] : ['web-search'],
      rationale: hasImage
        ? 'Image attached — extract text first, then research the entities found.'
        : 'Pure-text task — single web-search hop is enough.',
    },
    demo: true,
  }
}
