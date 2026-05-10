import type { Capability } from '@payable-ai/types'

export const CAPABILITIES: Capability[] = [
  {
    id: 'web-search',
    label: 'WEB SEARCH',
    live: true,
    providers: [
      {
        id: 'tavily-standard',
        name: 'tavily-standard',
        priceUsdc: 0.002,
        latencyMs: 380,
        live: true,
        endpoint: '/api/search',
        network: 'solana:devnet',
      },
      {
        id: 'serpapi-premium',
        name: 'serpapi-premium',
        priceUsdc: 0.015,
        latencyMs: 210,
        live: false,
        network: 'solana:devnet',
      },
    ],
  },
  {
    id: 'ocr',
    label: 'OCR',
    live: true,
    providers: [
      { id: 'vision-flash', name: 'vision-flash', priceUsdc: 0.003, latencyMs: 240, live: true, endpoint: '/api/ocr', network: 'solana:devnet' },
      { id: 'textract-premium', name: 'textract-premium', priceUsdc: 0.012, latencyMs: 95, live: false, network: 'solana:devnet' },
    ],
  },
  {
    id: 'gpu-inference',
    label: 'GPU INFERENCE',
    live: false,
    providers: [
      { id: 'runpod-a100', name: 'runpod-a100', priceUsdc: 0.050, latencyMs: 800, live: false, network: 'solana:devnet' },
      { id: 'lambda-h100', name: 'lambda-h100', priceUsdc: 0.120, latencyMs: 400, live: false, network: 'solana:devnet' },
    ],
  },
  {
    id: 'financial-data',
    label: 'FINANCIAL DATA',
    live: false,
    providers: [
      { id: 'polygon-basic', name: 'polygon-basic', priceUsdc: 0.003, latencyMs: 150, live: false, network: 'solana:devnet' },
      { id: 'bloomberg-rt', name: 'bloomberg-rt', priceUsdc: 0.040, latencyMs: 80, live: false, network: 'solana:devnet' },
    ],
  },
  {
    id: 'satellite-imaging',
    label: 'SATELLITE IMAGING',
    live: false,
    providers: [
      { id: 'planet-standard', name: 'planet-standard', priceUsdc: 0.020, latencyMs: 600, live: false, network: 'solana:devnet' },
      { id: 'maxar-hd', name: 'maxar-hd', priceUsdc: 0.080, latencyMs: 320, live: false, network: 'solana:devnet' },
    ],
  },
]
