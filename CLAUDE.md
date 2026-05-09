# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start Next.js dev server at http://localhost:3000 (via Turbopack)
pnpm build        # build all packages in dependency order via Turbo
pnpm lint         # lint all packages via Turbo
```

All commands run from the repo root via Turborepo. To run only the web app directly:

```bash
cd apps/web && pnpm dev
```

## Architecture

This is a pnpm monorepo with two packages:

- `apps/web` — Next.js 16 app (App Router, React 19, Turbopack)
- `packages/types` — shared TypeScript interfaces consumed by `apps/web` as `@payable-ai/types`

### Core model: Capability → Provider

The data model is hierarchical. A **Capability** (e.g. `web-search`, `ocr`, `gpu-inference`) has multiple **Providers** (e.g. `tavily-standard`, `serpapi-premium`). The agent discovers capabilities, evaluates providers by cost/value, rejects overpriced ones, and acquires the cheapest eligible provider via x402.

### Payment flow

```
POST /api/agent
  → lib/agent.ts (createAgentStream)
      → payableSearch tool
          → GET /api/discover        (returns { capabilities: Capability[] })
          → finds web-search capability
          → filters providers by budget, rejects expensive ones
          → acquires cheapest eligible provider via x402
          → GET /api/search?q=...    (x402-protected, calls Tavily)
          → returns { selectedProvider, rejectedProviders, savedUsdc, results }
```

`/api/agent` streams via Vercel AI SDK `streamText` + `toDataStreamResponse()`. The agent has one tool (`payableSearch`) that handles capability discovery, provider evaluation, and search.

### Discover endpoint

`GET /api/discover` returns `{ capabilities: Capability[] }` with 5 capabilities:
- `web-search` — `tavily-standard` (live) + `serpapi-premium` (mock)
- `ocr` — `textract-basic` + `vision-pro` (both mock)
- `gpu-inference` — `runpod-a100` + `lambda-h100` (both mock)
- `financial-data` — `polygon-basic` + `bloomberg-rt` (both mock)
- `satellite-imaging` — `planet-standard` + `maxar-hd` (both mock)

Only `tavily-standard` has `live: true` and a real endpoint.

### Agent reasoning phases

The trace UI emits these phases in order:
`IDLE → EVALUATING → DECIDING → ACQUIRING → COMPLETE`

And these line types: `sys, found, market, provider, eval, reject, decision, http, settled, complete`

The key difference from prior versions: the agent now does **cost/value reasoning** (not just budget filtering). It evaluates the Δ cost vs Δ confidence gain and rejects providers whose delta exceeds the task value threshold.

### x402 payment gate

`/api/search` is the only x402-protected route. The 402 enforcement block is **commented out** in `app/api/search/route.ts` — it requires `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` to verify Solana transactions onchain. When credentials are added, uncomment the block and wire `createX402Fetch` from `lib/x402.ts` into the agent tool.

### Solana / wallet

- All operations are on **Solana devnet** — no real funds.
- USDC mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` (Circle devnet)
- `lib/solana.ts` exports `getConnection()`, `getGatewayKeypair()` (base58 private key from env), and `getUsdcBalance(address)`.
- `components/providers/wallet-provider.tsx` sets up PhantomWalletAdapter with `autoConnect: false`. `NEXT_PUBLIC_SOLANA_RPC_URL` falls back to `clusterApiUrl('devnet')` when empty.

### Dashboard panels

- **Left** — Compute Market: collapsible capability blocks, each showing providers with status (selected/rejected/live/mock). Budget + agent policy below.
- **Center** — Task input + AgentTrace reasoning panel (streams live).
- **Right** — Execution Log: per-task card showing capability, provider, decision rationale, rejected providers, cost, and tx hash. Header stats: tasks run / providers rejected / USDC saved.

### Error responses

All API routes return `{ error: string, code: string }` on failure with appropriate HTTP status codes.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Helius devnet RPC (falls back to public endpoint if empty) |
| `GATEWAY_WALLET_PUBLIC_KEY` / `GATEWAY_WALLET_PRIVATE_KEY` | Backend wallet that receives x402 payments |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | Coinbase CDP — required to activate x402 enforcement |
| `OPENAI_API_KEY` | Powers the agent via `gpt-4o-mini` |
| `TAVILY_API_KEY` | Powers `/api/search` results |
| `NEXT_PUBLIC_APP_URL` | Used by the agent tool to call internal API routes |
