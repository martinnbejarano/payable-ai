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
POST /api/agent { task, budget, walletAddress, imageUrl? }
  → lib/agent.ts (runAgent → ReadableStream<NDJSON>)
      → PLANNING:  lib/planner.ts (gpt-4o-mini) → { capabilities: [...], rationale }
      → GET /api/discover (returns { capabilities: Capability[] })
      → for each capability in plan:
          → EVALUATING: list providers
          → DECIDING:   cheapest-eligible + cost/value reasoning
          → ACQUIRING:  settleOnchain (real solana:devnet TX) → call provider endpoint
                        - ocr        → POST /api/ocr   { image }
                        - web-search → GET  /api/search?q=...
      → emit { kind: 'result', response: { task, steps[], totalCostUsdc, totalSavedUsdc, plan } }
```

`/api/agent` returns NDJSON (one JSON-encoded `AgentStreamEvent` per line). The agent loop is deterministic — only the planner involves an LLM (one call, JSON-only).

### Discover endpoint

`GET /api/discover` returns `{ capabilities: Capability[] }` with 5 capabilities:
- `web-search` — `tavily-standard` (live, `/api/search`) + `serpapi-premium` (mock)
- `ocr` — `vision-flash` (live, `/api/ocr`) + `textract-premium` (mock)
- `gpu-inference` — `runpod-a100` + `lambda-h100` (both mock)
- `financial-data` — `polygon-basic` + `bloomberg-rt` (both mock)
- `satellite-imaging` — `planet-standard` + `maxar-hd` (both mock)

Live providers: `tavily-standard` (Tavily) and `vision-flash` (OpenAI gpt-4o vision).

### Agent reasoning phases

The trace UI emits these phases:
`IDLE → PLANNING → EVALUATING → DECIDING → ACQUIRING → COMPLETE`

`PLANNING` runs once at the start. `EVALUATING → DECIDING → ACQUIRING` runs in a loop, once per capability the planner returned. `COMPLETE` runs once at the end.

Line types: `sys, found, market, provider, eval, reject, decision, http, settled, complete, plan`. Each line carries optional `providerId` and `capabilityId` so the dashboard can attribute it to the right block.

Multi-capability example: a task with an attached image typically yields plan `[ocr, web-search]` — two settlements, two Solscan-visible TXs, two provider selections, two rejection sets. Pure-text tasks yield `[web-search]` only.

The agent does **cost/value reasoning** (not just budget filtering). It evaluates the Δ cost between the cheapest eligible provider and each competitor, rejecting any whose delta exceeds the task value threshold (`VALUE_THRESHOLD_USDC = 0.005`). `savedUsdc` only counts rejections under that reason — not budget cap or mock-only filters, since those weren't real options.

### x402 payment gate

`/api/search` and `/api/ocr` are both x402-protected. They require an `X-Payment-Tx` header containing a confirmed Solana devnet signature; without it (or with a `pending-...` placeholder, or with an unconfirmed/failed signature), they return 402.

Verification (`verifyPaymentSignature` in `lib/x402.ts`) is lightweight — it confirms the signature exists and is in `confirmed`/`finalized` state on devnet. It does not yet check that the TX contents match the requested resource (that's the job of full x402 v2).

The settlement TX is signed by the gateway keypair via `settleOnchain` — a memo instruction (with structured `x402:payable-ai/v0` JSON metadata) plus a USDC `transferChecked` self-pay so Solscan shows both a memo and a "USDC Transfer" line.

### Solana / wallet

- All operations are on **Solana devnet** — no real funds.
- USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (current Circle devnet)
- `lib/solana.ts` exports `getConnection()`, `getGatewayKeypair()` (base58 private key from env), and `getUsdcBalance(address)`.
- `components/providers/wallet-provider.tsx` sets up PhantomWalletAdapter with `autoConnect`. `NEXT_PUBLIC_SOLANA_RPC_URL` falls back to `clusterApiUrl('devnet')` when empty.

### Dashboard panels

- **Left** — Compute Market: collapsible capability blocks, each showing providers with status (selected/rejected/live/mock). Auto-expands the blocks involved in the most recent run. Budget + agent policy below.
- **Center** — Task input + AgentTrace reasoning panel (streams live). Includes a `Paperclip` button to attach an image (data URL, ≤4MB) for OCR-bearing tasks; first sample task ships with a pre-bundled `/sample-screenshot.png`.
- **Right** — Execution Log: per-task card with one sub-row per capability step (capability, provider, rejected, cost, saved, tx). Card footer shows total cost + total saved across all steps. Header stats: tasks run / providers rejected / USDC saved.

### Public demo endpoint

`POST /api/v1/run` accepts `{ task, budget?, walletAddress?, imageUrl? }` and returns a single JSON `AgentResponse` (not a stream). When `walletAddress` is omitted (or `PAYABLE_DEMO_FORCE=1`), it returns a synthetic `AgentResponse & { demo: true }` from `lib/v1-demo.ts` — no onchain settlement, fixture OCR text and 3 stock search results, deterministic `demo-<cap>-<hash8>` TX strings. Used by the IntegrateSnippet card on the dashboard right panel so judges can copy the curl and run it from their terminal without a wallet. Has no rate limiting or auth — production-gating TBD.

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
