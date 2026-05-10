# Payable.ai — Documento de Proyecto

> Economic Infrastructure for Autonomous AI Agents

*Última actualización: Mayo 2026 — Hackathon Solana*

---

## 1. La Idea Central

### El problema

Las APIs de hoy están diseñadas para humanos:

- accounts y dashboards
- subscriptions y credit cards
- API keys preconfiguradas
- billing setup manual
- providers estáticos definidos por el developer

Esto crea un mundo donde los agentes de IA **pueden usar herramientas**, pero solo a través de integraciones estáticas configuradas manualmente por desarrolladores. El agente en sí mismo no puede decidir nada económicamente.

### La solución

Payable.ai introduce un **Compute Market**: un mercado de capacidades computacionales donde los agentes pueden descubrir, evaluar y adquirir capabilities en tiempo real — sin intervención humana.

El agente no elige APIs. El agente **compra capacidades computacionales**:

- Web Search
- OCR
- GPU Inference
- Financial Market Data
- Satellite Imaging
- Translation
- Scraping

Cada capability tiene múltiples providers compitiendo en precio, latencia y calidad.

### El diferenciador clave

El diferenciador **NO** es el pago en sí.  
El diferenciador **NO** es Solana.  
El diferenciador **NO** es x402.

El diferenciador es:

> **Economic decision-making para agentes autónomos.**

En vez de consumir herramientas a ciegas, los agentes:

- consultan el compute market
- comparan providers por precio, latencia y confianza
- evalúan costo vs valor para la tarea específica
- rechazan providers económicamente irracionales
- seleccionan el óptimo dentro del budget
- pagan y ejecutan — sin humanos en el loop

### El momento más memorable del demo

```
Δ cost: +0.013 USDC for +8% confidence gain
Task value threshold: 0.005 USDC
Premium provider cost delta exceeds task value threshold
serpapi-premium → REJECTED

→ OPTIMAL: tavily-standard @ 0.002 USDC
```

Ese es el producto. No el pago — la **decisión**.

---

## 2. Posicionamiento

### Lo que NO es

```
❌ "Stripe for AI agents"
❌ Crypto payment infrastructure
❌ x402 demo genérico
❌ API gateway con billing
```

### Lo que ES

```
✅ Economic infrastructure for autonomous agents
✅ Compute market for AI capabilities
✅ Observability layer for agent economic decisions
✅ The reasoning layer that makes agents financially intelligent
```

### One-Line Pitch

> "Payable.ai enables autonomous AI agents to operate inside computational markets — discovering, evaluating, and acquiring capabilities through economic reasoning and programmable micropayments on Solana."

### Narrativa central

AI agents can already reason about text, tools and workflows.  
**Payable.ai enables them to reason about economics.**

---

## 3. Ejemplo de Demo Flow

```
Task: "Research Cursor's biggest competitors in the AI IDE space"
Budget: 0.010 USDC

COMPUTE MARKET — WEB SEARCH capability
  tavily-standard    0.002 USDC    conf: 0.82    lat: 380ms    ● live
  serpapi-premium    0.015 USDC    conf: 0.89    lat: 210ms    ○ mocked

AGENT REASONING ENGINE:
  Querying compute market...
  Found: WEB SEARCH — 2 providers available

  Evaluating cost/value tradeoffs...
  Δ cost: +0.013 USDC for +8% confidence gain
  Task value threshold: 0.005 USDC
  Premium provider cost delta exceeds task value threshold
  serpapi-premium → REJECTED

  → OPTIMAL: tavily-standard @ 0.002 USDC

Acquiring capability via x402...
  GET /capabilities/web-search/tavily-standard
  ← 402 · payment required · 0.002 USDC
  Settling on solana:devnet...
  ✓ Settled — capability acquired

Executing web search...
  ← 200 OK · 4 results

Task complete · 0.002 USDC spent · budget remaining: 0.008 USDC
```

**Execution Log muestra:**
```
capability    WEB SEARCH
selected      tavily-standard · 0.002 USDC
rejected      serpapi-premium
              +650% cost · exceeds value threshold
saved         0.013 USDC vs premium
tx            4xR7K...9pNq ↗ Solscan
```

---

## 4. El Producto — Qué es y qué no es

### El SDK/API es el core del producto

El cliente real es el **developer que construye agentes de IA**.
En producción, el agente corre en el backend del developer — autónomamente,
sin UI, sin intervención humana:

```typescript
import { createPayableAgent } from '@payable-ai/sdk'

const agent = createPayableAgent({
  wallet: keypair,
  budget: 0.01,
  network: 'solana:devnet',
})

const result = await agent.run('Research Cursor competitors')
// → internamente: discover → reason → pay via x402 → return results
```

### La UI es monitoring + onboarding

La pantalla principal del producto es una **API Reference interactiva** —
como Stripe Docs meets FastAPI Swagger. Muestra:

- Documentación de los endpoints públicos (`/discover`, `/search`, `/agent`)
- Un "Try it out" que ejecuta el flujo real end-to-end
- El Reasoning Engine con el trace en vivo
- El Execution Log con el historial de decisiones del agente

**No es** un dashboard donde usuarios ejecutan tareas manualmente.
**Es** una herramienta de developer que muestra cómo integrar el SDK
y qué hace el agente internamente.

### El Compute Market

El mercado de capacidades disponibles para los agentes:

| Capability | Providers | Status en demo |
|---|---|---|
| WEB SEARCH | tavily-standard (0.002), serpapi-premium (0.015) | ● live (Tavily real) |
| OCR | textract-basic (0.001), vision-pro (0.008) | ○ mocked |
| GPU INFERENCE | runpod-a100 (0.050), lambda-h100 (0.120) | ○ mocked |
| FINANCIAL DATA | polygon-basic (0.003), bloomberg-rt (0.040) | ○ mocked |
| SATELLITE IMAGING | planet-standard (0.020), maxar-hd (0.080) | ○ mocked |

Solo WEB SEARCH tiene un provider real (Tavily). El resto es mocked pero
conceptualmente coherente — hace que el pricing decisions del agente
se sientan económicamente significativas.

---

## 5. Por qué Solana

Solana no es cosmética en este proyecto — es funcional:

| Necesidad del producto | Solana lo resuelve |
|---|---|
| Micropagos reales | Fees de ~$0.00025 por transacción |
| Finalidad instantánea | ~400ms de settlement |
| Wallets programáticas | Agentes firman transacciones autónomamente |
| Stablecoins nativas | USDC como SPL token en Solana |
| Machine-to-machine | Transacciones sin cuentas ni onboarding humano |

### Lo que pasa onchain

Cuando el agente paga una capability, se ejecuta una transacción Solana
real verificable públicamente:

```
Network:    Solana Devnet
Token:      USDC (SPL)
Amount:     0.002
From:       agent wallet
To:         gateway wallet
Status:     confirmed ✓
TX Hash:    4xR7KMpQ...9pNq  [visible en Solscan]
```

Eso no es simulado. Es una transacción real en la blockchain de Solana.

---

## 6. Protocolo Base: x402

x402 es un protocolo de pagos abierto que revive el código HTTP 402
("Payment Required"). Lanzado en mayo de 2025 por Coinbase.

### El flujo x402

```
1. Agente hace GET /capabilities/web-search/tavily-standard
2. Servidor responde → HTTP 402
   { amount: 0.002, currency: USDC, recipient: "gateway...", network: "solana:devnet" }
3. Agente construye y firma transacción Solana
4. Agente reintenta el GET con proof de pago en el header
5. CDP Facilitator verifica la transacción onchain
6. Si válida → Servidor ejecuta Tavily y retorna 200 OK
```

### Por qué x402 (y no inventar el protocolo)

En 24-48h de hackathon no se puede construir infraestructura de pagos
from scratch. x402 ya existe, ya tiene SDKs, ya tiene un facilitador
gratuito. Se usa como base y se construye el **reasoning layer** encima.
Eso es lo que diferencia Payable.ai — no el protocolo de pagos.

---

## 7. Agent Policies

Los agentes operan bajo reglas económicas programables:

```
AGENT POLICY
─────────────────────────────
strategy        cheapest-eligible
max/request     0.005 USDC
max/task        budget disponible
```

Estas policies determinan cómo el agente evalúa el compute market:
- `cheapest-eligible`: selecciona el provider más barato que cumpla los requerimientos
- `max/request`: nunca paga más de X USDC por un solo request
- El agente rechaza automáticamente cualquier provider que exceda estos límites

---

## 8. Modelo de Negocio

### Revenue Model

Payable.ai actúa como gateway entre agents y providers, cobrando un fee:

```
Provider price:      0.0020 USDC
Payable.ai price:    0.0025 USDC
Platform fee:        0.0005 USDC  (20% margin)
```

A escala con high-frequency machine commerce (agentes haciendo miles
de requests por hora), el volumen genera revenue significativo.

### Monetización adicional (largo plazo)

- SDK como producto principal (`@payable-ai/sdk`)
- Hosted wallets para agentes
- Analytics de decisiones económicas por agente
- Enterprise tooling con budget management programático
- Provider dashboards con métricas de adopción

### Potenciales Moats

**1. Network effects de providers**
Más capabilities disponibles → plataforma más útil para agentes →
más agentes → más providers quieren estar.

**2. Estandarización**
Payable.ai puede evolucionar como estándar de consumo de capabilities
para agentes, análogo a cómo OAuth estandarizó la autenticación.

**3. Integraciones con frameworks de agentes**
Integración nativa con LangChain, OpenAI Agents SDK, Claude tools (MCP),
CrewAI, AutoGPT.

**4. Economic Orchestration Layer**
La capa más defensible: budget reasoning, provider routing inteligente,
price comparison, autonomous economic decision-making.

---

## 9. Stack Tecnológico

### Frontend

| Tecnología | Rol |
|---|---|
| **Next.js 14** (App Router) | Framework principal — frontend + backend en un repo |
| **TypeScript** | Tipado estricto para los SDKs de Solana/x402 |
| **Tailwind CSS** | Estilos |
| **shadcn/ui** | Componentes de UI |
| **Geist Sans + Geist Mono** | Tipografía (Google Fonts) |
| **Motion (framer-motion)** | Animaciones y micro-interacciones |
| **@solana/wallet-adapter-react** | Conexión con Phantom Wallet |

### Backend (API Routes dentro de Next.js)

| Tecnología | Rol |
|---|---|
| **Next.js API Routes** | Endpoints del gateway |
| **@x402/next** | Middleware de pagos para endpoints protegidos |
| **@x402/fetch** | Cliente del agente con pago automático |
| **Vercel AI SDK** | Lógica del agente (streamText + tool calls) |
| **Tavily API** | La única API real integrada para el demo |

### Solana / Blockchain

| Tecnología | Rol |
|---|---|
| **@solana/web3.js** | Interacción con la blockchain desde JS |
| **@x402/svm** | Implementación x402 para Solana |
| **Solana Devnet** | Red de prueba (dinero ficticio, misma tecnología que mainnet) |
| **Phantom Wallet** | Wallet del usuario en el browser |
| **Helius** | RPC endpoint confiable (tier gratuito) |
| **CDP Facilitator** | Verificación y settlement de transacciones x402 |
| **USDC Devnet** | USDC como SPL token en Solana Devnet |

---

## 10. Arquitectura del MVP

```
┌──────────────────────────────────────────────────────────┐
│                    BROWSER                               │
│   Phantom Wallet ←→ Next.js Frontend (React)            │
│                                                          │
│   API Reference page con "Try it out":                  │
│   Input: task + budget                                   │
│   Output: Reasoning trace + TX hash + resultados        │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼─────────────────────────────────┐
│                NEXT.JS API ROUTES                        │
│                                                          │
│  GET  /api/discover                                      │
│    → Retorna el Compute Market completo                  │
│    → { capabilities: [{ id, name, providers: [...] }] } │
│                                                          │
│  POST /api/agent                                         │
│    → Recibe: { task, budget, walletAddress }             │
│    → Vercel AI SDK ejecuta el reasoning engine           │
│    → Agente evalúa capabilities y providers              │
│    → Selecciona el óptimo dentro del budget              │
│    → @x402/fetch paga automáticamente                    │
│    → Retorna: reasoning[], selectedProvider,             │
│               rejectedProviders[], savedUsdc, results[]  │
│                                                          │
│  GET  /api/search (protegido con @x402/next)             │
│    → Requiere pago de 0.002 USDC                         │
│    → Sin pago → HTTP 402 + payment requirements          │
│    → Con pago válido → ejecuta Tavily → retorna 200      │
└────────────────────────┬─────────────────────────────────┘
                         │ x402 verify + settle
┌────────────────────────▼─────────────────────────────────┐
│          SOLANA DEVNET + CDP FACILITATOR                 │
│                                                          │
│  Transacción USDC-SPL verificada onchain                 │
│  TX Hash público visible en Solscan Devnet               │
└──────────────────────────────────────────────────────────┘
```

### Tipos clave (packages/types/index.ts)

```typescript
// Compute Market
interface Provider {
  id: string
  priceUsdc: number
  latencyMs: number
  confidence: number
  live: boolean
}

interface Capability {
  id: string
  name: string
  providers: Provider[]
}

// Agent Response
interface AgentResponse {
  txHash: string
  selectedProvider: string
  selectedCapability: string
  cost: number
  rejectedProviders: Array<{
    id: string
    reason: string
    costDelta: number
    costDeltaPct: number
  }>
  savedUsdc: number
  reasoning: ReasoningLine[]
  results: string[]
}

// Reasoning Trace
type ReasoningLineType =
  'sys' | 'found' | 'market' | 'provider' |
  'eval' | 'reject' | 'decision' | 'http' |
  'settled' | 'complete'
```

---

## 11. Setup de Entorno

### Dos wallets necesarias

```
Phantom Wallet (usuario — frontend)
  → Instalar: phantom.com/download (extensión Chrome)
  → Cambiar red: Settings → Developer Settings → Devnet
  → Fondear SOL: devnetfaucet.org (20 SOL gratis)
  → Fondear USDC: faucet.circle.com → Solana Devnet

Gateway Wallet (backend — recibe pagos x402)
  → Generar con script Node.js en el proyecto:

  node -e "
    const { Keypair } = require('@solana/web3.js');
    const bs58 = require('bs58');
    const kp = Keypair.generate();
    console.log('PUBLIC_KEY=' + kp.publicKey.toString());
    console.log('PRIVATE_KEY=' + bs58.encode(kp.secretKey));
  "

  → Fondear USDC: faucet.circle.com con la PUBLIC_KEY generada
```

### API Keys necesarias

| Servicio | Variable | URL | Prioridad |
|---|---|---|---|
| OpenAI | `OPENAI_API_KEY` | platform.openai.com | 🔴 Crítica |
| Tavily | `TAVILY_API_KEY` | app.tavily.com | 🔴 Crítica |
| Helius | `NEXT_PUBLIC_SOLANA_RPC_URL` | dev.helius.xyz | 🟡 Recomendada |
| Coinbase CDP | `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET` | portal.cdp.coinbase.com | 🟢 Para x402 real |

### .env.local completo

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Tavily
TAVILY_API_KEY=tvly-...

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=...

# Gateway Wallet (backend — generado con el script)
GATEWAY_WALLET_PUBLIC_KEY=...
GATEWAY_WALLET_PRIVATE_KEY=...

# Coinbase CDP (x402 facilitator)
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Orden de prioridad para conseguir las keys

```
Ahora (bloquean el agente):
  □ OpenAI API key       → platform.openai.com
  □ Tavily API key       → app.tavily.com
  □ Phantom instalado    → phantom.com/download → cambiar a Devnet
  □ Gateway wallet       → generar con el script de Node.js
  □ Ambas wallets fondeadas con SOL y USDC Devnet

Después (para activar pago real onchain):
  □ Helius RPC key       → dev.helius.xyz
  □ Coinbase CDP keys    → portal.cdp.coinbase.com
```

Con OpenAI + Tavily + wallets se puede correr el agente completo.
CDP activa la verificación onchain real (el gate x402 está comentado
en el código hasta tener estas keys).

---

## 12. TODOs de Código (post-keys)

Tres archivos bloqueados que se desbloquean con las keys:

```
app/api/search/route.ts
  → Activar el middleware x402 con CDP credentials

lib/x402.ts
  → Reemplazar fetch normal por wrapFetch de @x402/fetch
  → Configurar con el gateway keypair

lib/agent.ts
  → Pasarle el x402Fetch con el keypair firmante
  → Emitir reasoning lines con los nuevos tipos
    (market, provider, eval, reject, decision)
  → Calcular y retornar rejectedProviders y savedUsdc
```

---

## 13. Lo que NO necesitás

```
❌ Escribir smart contracts en Rust
❌ Instalar Anchor framework
❌ Deployar programas a Solana
❌ KYC ni compliance
❌ Mainnet (todo en Devnet para el hackathon)
❌ phantom.app (URL vieja — usar phantom.com)
```

---

## 14. Deploy en Vercel

```
1. Push del repo a GitHub
2. Importar en vercel.com/new
3. Root Directory: dejar vacío (vercel.json lo maneja)
4. Agregar todas las variables de .env.local en el dashboard de Vercel
   (marcar GATEWAY_WALLET_PRIVATE_KEY como "Sensitive")
5. Click Deploy
```

El `vercel.json` en el root del monorepo ya está configurado para
apuntar a `apps/web` correctamente.

---

## 15. Recursos Clave

| Recurso | URL |
|---|---|
| x402 docs (Coinbase) | docs.cdp.coinbase.com/x402 |
| x402 repositorio + ejemplos | github.com/coinbase/x402 |
| Solana web3.js docs | solana-labs.github.io/solana-web3.js |
| Wallet Adapter React | github.com/solana-labs/wallet-adapter |
| Vercel AI SDK | sdk.vercel.ai/docs |
| Solscan Devnet | solscan.io/?cluster=devnet |
| Phantom | phantom.com/download |
| SOL Devnet faucet | devnetfaucet.org |
| USDC Devnet faucet | faucet.circle.com |
| Helius RPC | dev.helius.xyz |
| Coinbase CDP | portal.cdp.coinbase.com |

---

*Documento actualizado — Mayo 2026*