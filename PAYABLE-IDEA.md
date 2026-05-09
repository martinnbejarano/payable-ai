# Payable.ai — Documento de Proyecto

> Economic Infrastructure for Autonomous AI Agents

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

Payable.ai introduce **"payable APIs"**: endpoints machine-native que los agentes pueden descubrir, evaluar y pagar en tiempo real — sin intervención humana.

### El diferenciador clave

El diferenciador **NO** es el pago en sí.

El diferenciador es:

> **Economic decision-making para agentes autónomos.**

En vez de consumir herramientas a ciegas a través de API keys hardcodeadas, los agentes pueden:

- comparar precios entre APIs
- evaluar el budget restante
- razonar sobre costo vs valor
- decidir si una request vale lo que cuesta

---

## 2. Ejemplo de Demo Flow

```
Budget inicial del agente: 0.01 USDC

APIs disponibles para search:
  API A → 0.002 USDC/request
  API B → 0.015 USDC/request

Razonamiento del agente:
  "API B excede el budget restante.
   API A es suficiente para esta tarea.
   Selecciono API A."

Flujo de ejecución:
  1. Agente selecciona API A (0.002 USDC)
  2. Servidor responde → 402 Payment Required
  3. Agente paga automáticamente en Solana USDC
  4. Servidor verifica la transacción onchain
  5. Request real a Tavily Search se ejecuta
  6. Resultados reales retornan al agente
  7. Tarea completada

Dashboard muestra:
  - TX hash verificable en Solana Devnet
  - API seleccionada y razonamiento
  - Balance restante actualizado
  - Respuesta de la API
```

---

## 3. Por qué Solana

Solana no es cosmética en este proyecto — es funcional para el modelo:

| Necesidad | Solana lo resuelve |
|---|---|
| Micropagos reales | Fees de ~$0.00025 por transacción |
| Finalidad instantánea | ~400ms de settlement |
| Wallets programáticas | Agentes firman transacciones sin humanos |
| Stablecoins | USDC nativo en Solana (SPL token) |
| Machine-to-machine | Transacciones sin cuentas ni onboarding |

Sistemas como Stripe están optimizados para subscriptions, invoices y billing mensual. Payable.ai requiere **comercio programático en tiempo real entre agentes y APIs**.

---

## 4. Protocolo Base: x402

### ¿Qué es x402?

x402 es un protocolo de pagos abierto que revive el código HTTP 402 ("Payment Required"). Fue lanzado en mayo de 2025 por Coinbase/Cloudflare y ya procesó +100M de transacciones.

Payable.ai **se construye sobre x402** en vez de reinventar el protocolo de pagos. Esto es una decisión estratégica para el hackathon: en 24-48h no se puede construir infraestructura de pagos from scratch.

### Flujo x402

```
1. Cliente hace GET /search
2. Servidor responde → HTTP 402 + {amount: 0.002, currency: USDC, wallet: "abc..."}
3. Cliente construye transacción Solana con el pago
4. Cliente reintenta GET /search con la firma de pago en el header
5. Facilitador verifica la transacción onchain
6. Si es válida → Servidor ejecuta el request y retorna 200 OK
```

### SDKs disponibles

```bash
npm install @x402/svm       # Solana Virtual Machine (core)
npm install @x402/next      # Middleware para Next.js (servidor)
npm install @x402/fetch     # Cliente que paga automáticamente
```

### Facilitador gratuito

Coinbase Developer Platform ofrece un facilitador hosteado con **1.000 transacciones/mes gratis**. No hay que levantar infraestructura blockchain propia.

---

## 5. Modelo de Negocio

### Posicionamiento

> "The payment layer for autonomous API consumption."

No es "Stripe for AI agents" — es **infrastructure for machine-native API markets**.

### Gateway / Marketplace Model

Payable.ai actúa como:

- Gateway de APIs payables
- Capa de pagos machine-to-machine
- Marketplace de APIs para agentes autónomos

### Flujo para providers

```
Provider configura:
  endpoint: /search/tavily
  precio: 0.002 USDC/request
  rate limits: 100 req/min

Payable.ai expone:
  payable.ai/search/tavily → endpoint payable listo para agentes
```

### Revenue model

```
Provider price:      0.0020 USDC
Payable.ai price:    0.0025 USDC
Platform fee:        0.0005 USDC  (20% margin)
```

A escala con high-frequency machine commerce, el volumen de transacciones genera revenue significativo.

### Monetización adicional (largo plazo)

- Hosted wallets para agentes
- Analytics de consumo por agente
- Enterprise tooling y dashboards
- Budget management programático
- Provider dashboards con métricas

---

## 6. Potenciales Moats

### 1. Network effects de providers

Más APIs disponibles → plataforma más útil para agentes → más agentes → más providers quieren estar.

### 2. Estandarización

Payable.ai puede evolucionar como estándar de consumo de APIs para agentes, análogo a cómo OAuth estandarizó la autenticación.

### 3. Integraciones con frameworks de agentes

Integración nativa con:
- LangChain
- OpenAI Agents SDK
- Claude tools (MCP)
- Eliza, CrewAI, AutoGPT

### 4. Economic Orchestration Layer

La capa más defensible a largo plazo:
- Budget reasoning
- Provider routing inteligente
- Price comparison en tiempo real
- Autonomous economic decision-making

---

## 7. Stack Tecnológico

### Frontend

| Tecnología | Rol |
|---|---|
| **Next.js 14** (App Router) | Framework principal — frontend + backend en un repo |
| **TypeScript** | Tipado estricto para los SDKs de Solana/x402 |
| **Tailwind CSS** | Estilos rápidos |
| **shadcn/ui** | Componentes de UI listos |
| **Recharts** | Gráficos de balance y transacciones |
| **@solana/wallet-adapter-react** | Conexión con Phantom Wallet |

### Backend (dentro de Next.js API Routes)

| Tecnología | Rol |
|---|---|
| **Next.js API Routes** | Endpoints del gateway — sin servidor separado |
| **@x402/next** | Middleware de pagos para los endpoints payables |
| **@x402/fetch** | Cliente del agente para pagar automáticamente |
| **Vercel AI SDK** | Lógica del agente (streamText + tool calls) |
| **Tavily API** | La única API real integrada para el demo |

### Solana / Blockchain

| Tecnología | Rol |
|---|---|
| **@solana/web3.js** | Interacción con la blockchain desde JS |
| **@x402/svm** | Implementación x402 para Solana |
| **Solana Devnet** | Red de prueba gratuita (dinero ficticio) |
| **Phantom Wallet** | Wallet del usuario en el browser |
| **Helius** | RPC endpoint confiable (tier gratuito) |
| **CDP Facilitator** | Verificación y settlement de transacciones x402 |
| **USDC Devnet** | Stablecoin de prueba para los micropagos |

---

## 8. Arquitectura del MVP

```
┌──────────────────────────────────────────────────────────┐
│                      BROWSER                             │
│                                                          │
│   Phantom Wallet ←→ Next.js Frontend (React)            │
│                                                          │
│   Input: "Research Cursor competitors"                   │
│   Output: Dashboard con TX, reasoning, resultados       │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼─────────────────────────────────┐
│                NEXT.JS API ROUTES                        │
│                                                          │
│  /api/discover                                           │
│    → Lista las APIs payables disponibles                 │
│    → Retorna: nombre, precio, descripción                │
│                                                          │
│  /api/agent                                              │
│    → Recibe: task + budget                               │
│    → Vercel AI SDK ejecuta el agente                     │
│    → Agente evalúa APIs disponibles                      │
│    → Selecciona la más barata dentro del budget          │
│    → @x402/fetch intenta el request                      │
│    → Recibe 402 → paga → reintenta                       │
│                                                          │
│  /api/search (protegido con @x402/next)                  │
│    → Requiere pago de 0.002 USDC                         │
│    → Si pago válido → ejecuta Tavily Search              │
│    → Retorna resultados reales                           │
└────────────────────────┬─────────────────────────────────┘
                         │ x402 verify + settle
┌────────────────────────▼─────────────────────────────────┐
│          SOLANA DEVNET + CDP FACILITATOR                 │
│                                                          │
│  - Transacción verificada onchain                        │
│  - TX Hash público (visible en Solscan)                  │
│  - Settlement en USDC                                    │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Setup de Entorno — Paso a Paso

### Cuentas y servicios a registrar (hacer ANTES de codear)

| Servicio | Para qué | URL | Tier |
|---|---|---|---|
| **Helius** | RPC endpoint Solana | helius.dev | Gratis |
| **Coinbase CDP** | x402 Facilitator | cdp.coinbase.com | 1000 tx/mes gratis |
| **Tavily** | API de search real | tavily.com | Gratis (hackathon) |
| **Phantom** | Wallet browser | phantom.app | Gratis |

### Variables de entorno necesarias

```env
# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=TU_KEY
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# x402 / Coinbase CDP
CDP_API_KEY_ID=tu_key_id
CDP_API_KEY_SECRET=tu_key_secret

# APIs externas
TAVILY_API_KEY=tvly-xxx

# Wallet del gateway (backend — recibe los pagos)
GATEWAY_WALLET_PRIVATE_KEY=xxx  # Solo en devnet, nunca en producción
GATEWAY_WALLET_PUBLIC_KEY=xxx
```

### Setup de Phantom Wallet para Devnet

1. Instalar extensión en Chrome: `phantom.app`
2. Crear nueva wallet → guardar las 12 palabras seed
3. Ir a Settings → Developer Settings → activar Devnet
4. Obtener SOL de prueba: `faucet.solana.com`
5. Obtener USDC de prueba: `faucet.circle.com`

### Lo que NO necesitás

```
❌ Escribir smart contracts en Rust
❌ Instalar Anchor framework
❌ Deployar programas a Solana
❌ Manejar wallets de usuarios
❌ KYC ni compliance
❌ Mainnet (todo en Devnet)
```

---

## 10. Checklist Pre-Hackathon

```
□ Node.js 18+ instalado
□ Cuenta en Helius → RPC URL de Devnet copiada
□ Cuenta en Coinbase CDP → API keys copiadas
□ Cuenta en Tavily → API key copiada
□ Extensión Phantom instalada y en Devnet
□ Devnet SOL airdropeado a wallet de prueba
□ Devnet USDC en wallet de prueba
□ Repositorio Next.js creado
  npx create-next-app@latest payable-ai --typescript --tailwind --app
□ SDKs instalados:
  npm install @x402/svm @x402/next @x402/fetch
  npm install @solana/web3.js @solana/wallet-adapter-react
  npm install ai @ai-sdk/openai
  npm install tavily-js
```

---

## 11. Recursos Clave

| Recurso | URL |
|---|---|
| Guía oficial x402 en Solana | solana.com/developers/guides/getstarted/intro-to-x402 |
| Docs x402 Coinbase | docs.cdp.coinbase.com/x402 |
| Repositorio x402 (ejemplos) | github.com/coinbase/x402 |
| Solana web3.js docs | solana-labs.github.io/solana-web3.js |
| Wallet Adapter React | github.com/solana-labs/wallet-adapter |
| Vercel AI SDK | sdk.vercel.ai/docs |
| Solscan (explorador Devnet) | solscan.io/?cluster=devnet |

---

## 12. One-Line Pitch

> "Payable.ai enables autonomous AI agents to discover, evaluate and consume APIs through programmable micropayments on Solana."

---

*Documento generado durante sesión de diseño de producto — Hackathon Solana 2026*