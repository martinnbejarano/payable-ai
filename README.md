# Payable.ai

> Payable.ai enables autonomous AI agents to discover, evaluate and consume APIs through programmable micropayments on Solana.

---

## Quick Start

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in your keys in .env.local
pnpm dev
# → http://localhost:3000
```

---

## Getting Your Keys (Before First Run)

| Key | Where to get it | Free tier |
|-----|-----------------|-----------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | [helius.dev](https://helius.dev) | Yes |
| `CDP_API_KEY_ID / SECRET` | [cdp.coinbase.com](https://cdp.coinbase.com) | 1000 tx/month |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) | Yes |
| Devnet SOL | [faucet.solana.com](https://faucet.solana.com) | Free |
| Devnet USDC | [faucet.circle.com](https://faucet.circle.com) | Free |

---

## Project Structure

```
payable-ai/
├── apps/
│   └── web/               # Next.js 14 frontend + API routes
│       ├── app/           # App Router pages and API routes
│       ├── components/    # React components (providers, ui/)
│       ├── lib/           # Solana, x402, Tavily, agent logic
│       └── hooks/         # Custom React hooks
├── packages/
│   └── types/             # Shared TypeScript types (PayableAPI, AgentTask, etc.)
├── turbo.json             # Turborepo task pipeline
├── vercel.json            # Vercel deployment config
└── pnpm-workspace.yaml    # pnpm monorepo config
```

---

## How It Works

The x402 payment flow in 5 steps:

- **Discover** — agent calls `GET /api/discover` to see available APIs and their USDC prices
- **Evaluate** — agent reasons about each option: can I afford this? is the latency acceptable for my task?
- **Request** — agent sends `GET /api/search?q=...` without a payment header → receives `402 Payment Required`
- **Pay** — `@x402/fetch` automatically signs a Solana USDC transaction and retries with `X-Payment` header
- **Receive** — Coinbase CDP verifies the transaction onchain → server returns `200 OK` with results

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in vercel.com/new
3. Set Root Directory to: (leave empty — vercel.json handles it)
4. Add all environment variables from `.env.example` in the Vercel dashboard:
   - `NEXT_PUBLIC_SOLANA_NETWORK`
   - `NEXT_PUBLIC_SOLANA_RPC_URL`
   - `GATEWAY_WALLET_PUBLIC_KEY`
   - `GATEWAY_WALLET_PRIVATE_KEY`
   - `CDP_API_KEY_ID`
   - `CDP_API_KEY_SECRET`
   - `OPENAI_API_KEY`
   - `TAVILY_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)
5. Click Deploy

> Note: `GATEWAY_WALLET_PRIVATE_KEY` is a sensitive value.
> Mark it as "Sensitive" in the Vercel dashboard so it's never exposed.

---

## Key Concepts

- **x402**: HTTP 402 protocol for machine-native payments — agents pay for APIs the same way browsers load pages
- **Economic Reasoning**: agents compare prices and decide if a call is worth paying for before acting
- **Solana Devnet**: test network — no real funds required for development
