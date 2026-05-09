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

### Payment flow

The core concept: AI agents autonomously pay for APIs using HTTP 402 (x402 protocol) with Solana USDC on devnet.

```
POST /api/agent
  → lib/agent.ts (createAgentStream)
      → payableSearch tool
          → GET /api/discover        (returns PayableAPI list with prices)
          → selects cheapest within budget
          → GET /api/search?q=...    (x402-protected, calls Tavily)
```

`/api/agent` streams via Vercel AI SDK `streamText` + `toDataStreamResponse()`. The agent has one tool (`payableSearch`) that handles discovery, cost evaluation, and search in a single call.

### x402 payment gate

`/api/search` is the only x402-protected route. The 402 enforcement block is **commented out** in `app/api/search/route.ts` — it requires `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` to verify Solana transactions onchain. When credentials are added, uncomment the block and wire `createX402Fetch` from `lib/x402.ts` into the agent tool.

### Solana / wallet

- All operations are on **Solana devnet** — no real funds.
- USDC mint: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` (Circle devnet)
- `lib/solana.ts` exports `getConnection()`, `getGatewayKeypair()` (base58 private key from env), and `getUsdcBalance(address)`.
- `components/providers/wallet-provider.tsx` sets up PhantomWalletAdapter with `autoConnect: false`. `NEXT_PUBLIC_SOLANA_RPC_URL` falls back to `clusterApiUrl('devnet')` when empty.

### Pages

All three pages (`/`, `/connect`, `/dashboard`) are placeholder stubs. They confirm routing works but contain no real UI — replace with actual components when building the frontend.

### Error responses

All API routes return `{ error: string, code: string }` on failure with appropriate HTTP status codes.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Helius devnet RPC (falls back to public endpoint if empty) |
| `GATEWAY_WALLET_PUBLIC_KEY` / `PRIVATE_KEY` | Backend wallet that receives x402 payments |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | Coinbase CDP — required to activate x402 enforcement |
| `OPENAI_API_KEY` | Powers the agent via `gpt-4o-mini` |
| `TAVILY_API_KEY` | Powers `/api/search` results |
| `NEXT_PUBLIC_APP_URL` | Used by the agent tool to call internal API routes |
