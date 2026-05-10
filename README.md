# Payable.ai

**Economic infrastructure for autonomous agents.** AI agents discover APIs, evaluate cost vs. value, and pay for them in Solana USDC — autonomously, on-chain, via x402.

> Submission for **Dev3pack Global Hackathon 2026**.

- **Live demo:** [payable-ai-web.vercel.app](https://payable-ai-web.vercel.app)
- **Gateway wallet (devnet):** [`AnCBKYVAQqDVCRGWQSGbXRWZXfyoPTWrnw56PBFjBTd7`](https://solscan.io/account/AnCBKYVAQqDVCRGWQSGbXRWZXfyoPTWrnw56PBFjBTd7?cluster=devnet)
- **Public API:** `POST https://payable-ai-web.vercel.app/api/v1/run`
- **Network:** Solana **devnet** (no real funds — test USDC at [faucet.circle.com](https://faucet.circle.com))

---

## The problem

Today's AI agents can think, plan, and act — but they can't **pay**. Every API key, every paywalled dataset, every premium model lives behind a human-issued credential. An autonomous agent can't sign up for SerpAPI at 3 a.m., compare it to Tavily, decide which is worth it, and start using the cheaper one before the next task. There's no economic layer.

Without one, "agentic" AI is a misnomer. Agents inherit their operator's accounts, budgets, and decisions. They don't reason about money.

## What Payable.ai does

Payable.ai is the missing economic layer. We turn the API economy into a **compute market** that agents can shop in:

- **Discover** capabilities (web-search, OCR, GPU-inference, financial-data, satellite-imaging) and the providers that fulfill them (`tavily-standard`, `serpapi-premium`, `vision-flash`, `textract-premium`, ...).
- **Evaluate** each provider on price/latency/quality and **reject** the ones whose cost-delta exceeds the task's value threshold.
- **Acquire** the cheapest eligible provider via the **x402** payment protocol on **Solana**, settling onchain in USDC.
- **Use** the API immediately — the same TX signature is the auth header.

The agent does this autonomously, deterministically, and visibly: every decision is reasoned, every payment is on Solscan.

---

## Demo: 60 seconds end-to-end

Visit [payable-ai-web.vercel.app](https://payable-ai-web.vercel.app) on **desktop**.

1. **Connect** Phantom (devnet). Get test USDC from [faucet.circle.com](https://faucet.circle.com) if needed.
2. **Pick a sample task.** The first one — *"Extract competitors from this product screenshot and research them"* — bundles a screenshot to trigger a multi-capability flow.
3. **Click "Run agent."** Watch the trace stream in real time:
   ```
   PLANNING   → gpt-4o-mini routes the task to [ocr, web-search]
   EVALUATING → list providers per capability with price + latency
   DECIDING   → reject premium providers whose cost delta > 0.005 USDC
   ACQUIRING  → settle onchain (real Solana devnet TX) → call provider
   COMPLETE   → return AgentResponse with steps, cost, savings
   ```
4. **Two real Solana TXs** are produced — one per capability. Each is linked to Solscan from the execution log.
5. **Click any step card** to see the actual output (extracted OCR text, search results) and the TX details.
6. **Copy the curl** from the "Integrate" card at the bottom of the right panel. Paste it in your terminal — you get the same `AgentResponse` JSON back, runnable from any client.

---

## Architecture

```
                            ┌────────────────────────┐
                            │  apps/web (Next.js 16) │
   user (Phantom) ────────► │   /dashboard           │
                            │   /api/agent  (NDJSON) │
                            │   /api/v1/run (JSON)   │ ◄── public copy-paste API
                            └──────────┬─────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              ▼                        ▼                         ▼
       ┌────────────┐          ┌─────────────┐         ┌─────────────────┐
       │ planner    │          │ x402 gate   │         │  CAPABILITIES   │
       │ gpt-4o-mini│          │ verify TX   │         │  (in-process)   │
       │ → Plan{}   │          │ on devnet   │         │  capabilities[] │
       └────────────┘          └──────┬──────┘         └─────────────────┘
                                      │
                       ┌──────────────┴───────────────┐
                       ▼                              ▼
                 /api/search (Tavily)          /api/ocr (gpt-4o vision)
                       │                              │
                       └──────────────┬───────────────┘
                                      ▼
                     ┌────────────────────────────────┐
                     │   Solana devnet                │
                     │  • Memo program  (x402 metadata)│
                     │  • SPL Token program (USDC TX) │
                     │  • Gateway wallet (signer)     │
                     └────────────────────────────────┘
```

### Core model: Capability → Provider

A **Capability** (e.g. `web-search`) has multiple **Providers** (e.g. `tavily-standard`, `serpapi-premium`). The agent shops across providers within a capability — never assumes brand loyalty.

### Multi-capability sequencing

A task with an attached image typically yields plan `[ocr, web-search]`: the OCR output is chained as context into the search query. The agent settles **two independent x402 payments**, one per provider, each visible on Solscan.

### Cost/value reasoning (not just budget filtering)

We don't just reject providers that exceed a budget cap. We reject providers whose **delta** vs. the cheapest eligible exceeds a per-task value threshold (`0.005 USDC` by default). The savings shown in the UI count *only* these rejections — not budget-filtered or mock-only providers, since those weren't real economic options.

### x402 payment flow

```
1. Agent → /api/search?q=...     → 402 Payment Required (USDC, 0.002)
2. Agent → settleOnchain()       → Memo + transferChecked on devnet
3. Agent → /api/search?q=...     + X-Payment-Tx: <real signature>
4. Server verifies signature confirmed/finalized → 200 + results
```

Verification lives in `apps/web/lib/x402.ts`. The settlement TX includes a structured memo (`x402:payable-ai/v0` JSON) plus a USDC `transferChecked` self-pay so Solscan shows both a memo and a "USDC Transfer" line per payment.

---

## Public API

A judge or a developer can hit Payable.ai from any HTTP client without a wallet — the endpoint runs in **demo mode** and returns a synthetic but well-formed `AgentResponse`:

```bash
curl -X POST https://payable-ai-web.vercel.app/api/v1/run \
  -H "content-type: application/json" \
  -d '{"task":"Extract competitors from this product screenshot",
       "imageUrl":"/sample-screenshot.png"}'
```

With a `walletAddress` provided, the same endpoint runs the real `runAgent` and returns the live `AgentResponse` (real onchain TXs, real provider calls).

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend / app | Next.js 16 (App Router, React 19, Turbopack) |
| Monorepo | pnpm workspaces + Turborepo |
| Wallet | `@solana/wallet-adapter-react` + Phantom |
| Onchain | `@solana/web3.js`, `@solana/spl-token` |
| Payment proto | `@x402/svm`, `@x402/next`, `@x402/fetch` |
| Planner LLM | OpenAI `gpt-4o-mini` (JSON-only) |
| Vision LLM | OpenAI `gpt-4o` (`/api/ocr`) |
| Web search | Tavily (`/api/search`) |
| Hosting | Vercel |

---

## Project structure

```
payable-ai/
├── apps/
│   └── web/                    Next.js app
│       ├── app/
│       │   ├── api/
│       │   │   ├── agent/      NDJSON streaming agent endpoint
│       │   │   ├── v1/run/     Single-JSON public endpoint (demo + live)
│       │   │   ├── discover/   Capabilities catalog
│       │   │   ├── search/     Tavily-backed web search (x402-gated)
│       │   │   └── ocr/        gpt-4o vision OCR (x402-gated)
│       │   ├── connect/        Wallet connect + budget screen
│       │   ├── dashboard/      Live demo: trace, execution log, integrate snippet
│       │   └── page.tsx        Landing
│       ├── components/payable/ AgentTrace, primitives, IntegrateSnippet, ...
│       └── lib/
│           ├── agent.ts        Deterministic NDJSON agent runtime
│           ├── planner.ts      gpt-4o-mini routing
│           ├── x402.ts         settleOnchain + verifyPaymentSignature
│           ├── solana.ts       connection + gateway keypair
│           ├── capabilities.ts Shared capability catalog
│           └── v1-demo.ts      Demo-mode fixture for /api/v1/run
└── packages/
    └── types/                  Shared TS interfaces (@payable-ai/types)
```

---

## Run locally

```bash
git clone https://github.com/martinnbejarano/payable-ai
cd payable-ai
pnpm install

cp apps/web/.env.example apps/web/.env.local
# fill in OPENAI_API_KEY, TAVILY_API_KEY, GATEWAY_WALLET_*, etc.

pnpm dev
# → http://localhost:3000
```

You'll need a Solana devnet keypair for the gateway wallet (`solana-keygen new --no-bip39-passphrase`), funded with a tiny bit of devnet SOL (`solana airdrop 1 --url devnet`) and some devnet USDC (transfer from [faucet.circle.com](https://faucet.circle.com) into the associated token account for mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`).

### Getting your keys

| Key | Where to get it | Free tier |
|-----|-----------------|-----------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | [helius.dev](https://helius.dev) | Yes |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) | Pay-as-you-go |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) | Yes (1k req/mo) |
| `CDP_API_KEY_ID / SECRET` | [cdp.coinbase.com](https://cdp.coinbase.com) | 1k tx/month |
| Devnet SOL | [faucet.solana.com](https://faucet.solana.com) | Free |
| Devnet USDC | [faucet.circle.com](https://faucet.circle.com) | Free |

### Environment variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Powers the planner (`gpt-4o-mini`) and OCR (`gpt-4o` vision) |
| `TAVILY_API_KEY` | Powers `/api/search` |
| `GATEWAY_WALLET_PUBLIC_KEY` / `GATEWAY_WALLET_PRIVATE_KEY` | Backend signer that mediates x402 settlements |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | Coinbase CDP for x402 enforcement |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Helius devnet RPC (falls back to public devnet endpoint) |
| `NEXT_PUBLIC_APP_URL` | App's own base URL — used by `runAgent` for self-fetch |

---

## Deploy to Vercel

This is a pnpm monorepo — Vercel needs explicit hints. The `apps/web/vercel.json` ships with the right install + build commands so the workspace context is preserved:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @payable-ai/web build"
}
```

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Set **Root Directory** to `apps/web`.
3. Add the env vars listed above (mark `GATEWAY_WALLET_PRIVATE_KEY` and `*_SECRET` as **Sensitive**).
4. Deploy.

---

## On-chain footprint

Every agent run produces N real Solana devnet TXs (one per capability acquired). All are signed by the gateway wallet:

- Wallet: [`AnCBKYVAQqDVCRGWQSGbXRWZXfyoPTWrnw56PBFjBTd7`](https://solscan.io/account/AnCBKYVAQqDVCRGWQSGbXRWZXfyoPTWrnw56PBFjBTd7?cluster=devnet)
- USDC mint (devnet): `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Each TX contains:
  1. A **memo instruction** with structured `x402:payable-ai/v0` JSON metadata (capability, providerId, amount, task)
  2. A **USDC `transferChecked`** self-pay so Solscan renders both a memo and a "USDC Transfer" line

Visit the gateway wallet on Solscan and you'll see live TXs from real demo runs.

---

## What's not built (yet)

- A registered SDK package (`@payable-ai/sdk`) — for now, the public API is the surface
- Production-grade x402: full v2 verification (TX content matching the resource, not just signature confirmed)
- Custom Solana program — Payable.ai currently composes existing primitives (SPL Token + Memo) via the gateway wallet; a dedicated program for atomic 402-then-settle is on the roadmap
- Rate limiting and API keys for `/api/v1/run`

---

## Submission

- **Hackathon:** Dev3pack Global Hackathon 2026
- **Track:** Solana / x402
- **Repo:** github.com/martinnbejarano/payable-ai
- **Live demo:** [payable-ai-web.vercel.app](https://payable-ai-web.vercel.app)
- **Smart contract / program address (on-chain identity):** `AnCBKYVAQqDVCRGWQSGbXRWZXfyoPTWrnw56PBFjBTd7` (gateway wallet, devnet) — Payable.ai composes existing Solana primitives (SPL Token + Memo programs) signed from this wallet rather than deploying its own program.
