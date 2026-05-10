'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Brain,
  Compass,
  Cpu,
  ExternalLink,
  Receipt,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import {
  Badge,
  Logo,
  PayableButton,
  PulseDot,
  SectionLabel,
} from '@/components/payable/primitives'
import { navigateWithTransition } from '@/components/payable/nav'
import { ViewTransition } from '@/components/payable/view-transition'
import {
  type LastRunSummary,
  readLastRun,
  SAMPLE_LAST_RUN,
} from '@/lib/last-run'
import { cn } from '@/lib/utils'

function LandingNav({ onLaunch }: { onLaunch: () => void }) {
  return (
    <header className="sticky top-0 z-30 glass-strong">
      <div className="max-w-[1200px] mx-auto h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden md:inline text-zinc-700">/</span>
          <nav className="hidden md:flex items-center gap-5 text-[12.5px] text-zinc-400">
            <a href="#" className="hover:text-zinc-100 transition-colors">Product</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Protocol</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Pricing</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Docs</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="muted" mono icon={<PulseDot tone="accent" size={5} />}>Solana Devnet</Badge>
          <PayableButton variant="ghost" size="sm" trailing={<ExternalLink size={13} strokeWidth={1.75} />}>
            Docs
          </PayableButton>
          <PayableButton
            variant="primary"
            size="sm"
            onClick={onLaunch}
            trailing={<ArrowRight size={13} strokeWidth={1.75} />}
          >
            Launch App
          </PayableButton>
        </div>
      </div>
    </header>
  )
}

function Hero({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="mesh-bg relative">
      <div className="max-w-[1200px] mx-auto px-6 pt-32 pb-32 relative">
        <h1 className="text-center font-display font-semibold text-white tracking-tightest leading-[0.95] text-[64px] md:text-[88px]">
          <span className="block">Economic reasoning</span>
          <span className="block italic font-light text-transparent bg-clip-text bg-gradient-to-r from-accent-soft via-accent to-accent-soft">
            for autonomous agents
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-[620px] text-center text-[16.5px] leading-[1.55] text-zinc-400">
          AI agents can think, plan, and act — but they can&apos;t pay.
          <span className="text-zinc-200"> Payable.ai</span> gives agents the economic layer they&apos;ve been missing:
          discover APIs, evaluate cost vs value, and settle in Solana USDC.
        </p>

        <div className="mt-10 flex items-center justify-center">
          <PayableButton
            variant="primary"
            size="lg"
            onClick={onLaunch}
            trailing={<ArrowRight size={15} strokeWidth={1.75} />}
          >
            Launch App
          </PayableButton>
        </div>

        {/* Code-ish snippet preview */}
        <div className="mt-20 max-w-[860px] mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur shadow-[0_30px_80px_-20px_rgba(124,58,237,0.25)] overflow-hidden">
            <div className="flex items-center justify-between px-4 h-9 border-b border-zinc-800/80 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-3 text-[11px] font-mono text-zinc-500">agent.trace</span>
              </div>
              <Badge tone="success" mono icon={<PulseDot tone="success" size={5} />}>
                live
              </Badge>
            </div>
            <div className="p-5 font-mono text-[12.5px] leading-[1.7] space-y-1">
              <div className="text-zinc-500">
                <span className="text-zinc-700">01</span> &nbsp;Discovering payable endpoints…
              </div>
              <div className="text-blue-400 pl-6">
                <span className="text-zinc-700">02</span> &nbsp;tavily-standard&nbsp;&nbsp;&nbsp;&nbsp;0.002 USDC/req
              </div>
              <div className="text-blue-400 pl-6">
                <span className="text-zinc-700">03</span> &nbsp;serpapi-premium&nbsp;&nbsp;0.015 USDC/req
              </div>
              <div className="text-amber-400 pl-6">
                <span className="text-zinc-700">04</span> &nbsp;serpapi → exceeds budget threshold → REJECTED
              </div>
              <div className="text-amber-400 pl-6">
                <span className="text-zinc-700">05</span> &nbsp;tavily   → within budget → ELIGIBLE
              </div>
              <div className="text-white font-bold">
                <span className="text-zinc-700">06</span> &nbsp;→ DECISION: tavily-standard @ 0.002 USDC
              </div>
              <div className="text-orange-400">
                <span className="text-zinc-700">07</span> &nbsp;Signing Solana transaction…
              </div>
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="text-zinc-700">08</span> &nbsp;✓ Payment confirmed — 4nQ8…ks2P
                <span className="caret text-emerald-300">▍</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11.5px] text-zinc-500">
            <Cpu size={13} strokeWidth={1.75} />
            <span>An autonomous agent reasoning over real economic constraints — no human in the loop.</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Receipts (before/after) ──────────────────────────────── */
function fmtUsdc(n: number, frac = 3) {
  return n.toFixed(frac)
}

function timeAgoShort(ts: number) {
  if (!ts) return null
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ReceiptHeader({
  variant,
  label,
  subline,
}: {
  variant: 'naive' | 'payable'
  label: string
  subline: string
}) {
  const tone =
    variant === 'naive'
      ? 'border-rose-500/15 bg-rose-500/[0.04] text-rose-300'
      : 'border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-300'
  return (
    <div className={cn('flex items-center justify-between px-5 h-11 border-b', tone)}>
      <div className="flex items-center gap-2.5">
        {variant === 'naive' ? (
          <X size={13} strokeWidth={2.25} />
        ) : (
          <Sparkles size={13} strokeWidth={1.75} />
        )}
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <span className="font-mono text-[10.5px] text-zinc-500 tracking-[0.06em]">{subline}</span>
    </div>
  )
}

function ReceiptRow({
  capability,
  picked,
  pickedTone,
  rejected,
  withDelta,
}: {
  capability: string
  picked: { name: string; price: number }
  pickedTone: 'naive' | 'payable'
  rejected?: { name: string; price: number; deltaPct?: number }
  withDelta?: boolean
}) {
  const priceTone =
    pickedTone === 'naive' ? 'text-rose-200' : 'text-emerald-200'
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {capability}
          </div>
          <div className="mt-0.5 font-mono text-[13px] text-zinc-200 truncate">{picked.name}</div>
        </div>
        <div className={cn('font-mono text-[14px] num-tab tabular-nums', priceTone)}>
          {fmtUsdc(picked.price)}
        </div>
      </div>
      {rejected && (
        <div className="mt-1.5 flex items-baseline justify-between gap-3 pl-2 border-l border-zinc-900/80">
          <div className="font-mono text-[10.5px] text-zinc-600 truncate">
            <span className="text-zinc-700">↳ rejected · </span>
            <span className="line-through decoration-zinc-700">{rejected.name}</span>
          </div>
          <div className="font-mono text-[10.5px] text-zinc-600 num-tab tabular-nums">
            <span className="line-through decoration-zinc-700">{fmtUsdc(rejected.price)}</span>
            {withDelta && rejected.deltaPct != null && (
              <span className="ml-1.5 text-emerald-500/70">−{rejected.deltaPct}%</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptCard({
  variant,
  run,
}: {
  variant: 'naive' | 'payable'
  run: LastRunSummary
}) {
  const isNaive = variant === 'naive'
  const total = isNaive ? run.naiveWouldPayUsdc : run.payablePaidUsdc
  const cardBorder = isNaive
    ? 'border-zinc-800/80 hover:border-rose-500/20'
    : 'border-zinc-800/80 hover:border-emerald-500/30'
  const totalTone = isNaive ? 'text-rose-200' : 'text-emerald-200'

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-zinc-950/80 backdrop-blur overflow-hidden transition-colors',
        'shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]',
        cardBorder,
      )}
    >
      {/* receipt-y "thermal" notches */}
      <div
        aria-hidden
        className="absolute -top-1.5 left-0 right-0 h-3 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 6px 6px, rgb(9 9 11) 4px, transparent 4.5px)',
          backgroundSize: '12px 12px',
          backgroundRepeat: 'repeat-x',
        }}
      />

      <ReceiptHeader
        variant={variant}
        label={isNaive ? 'naive.agent' : 'payable.agent'}
        subline={isNaive ? 'no economic reasoning' : 'cost / value reasoning'}
      />

      <div className="divide-y divide-zinc-900/80">
        {run.steps.map((s) => {
          if (isNaive) {
            const premium = s.premium ?? s.selected
            return (
              <ReceiptRow
                key={s.capabilityId}
                capability={s.capabilityLabel}
                picked={{ name: premium.name, price: premium.priceUsdc }}
                pickedTone="naive"
              />
            )
          }
          const rejected = s.premium
            ? {
                name: s.premium.name,
                price: s.premium.priceUsdc,
                deltaPct: Math.round(
                  ((s.premium.priceUsdc - s.selected.priceUsdc) / s.premium.priceUsdc) * 100,
                ),
              }
            : undefined
          return (
            <ReceiptRow
              key={s.capabilityId}
              capability={s.capabilityLabel}
              picked={{ name: s.selected.name, price: s.selected.priceUsdc }}
              pickedTone="payable"
              rejected={rejected}
              withDelta
            />
          )
        })}
      </div>

      {/* dotted divider */}
      <div
        aria-hidden
        className="h-px mx-5"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(63 63 70 / 0.6) 50%, transparent 50%)',
          backgroundSize: '6px 1px',
          backgroundRepeat: 'repeat-x',
        }}
      />

      <div className="px-5 py-4 flex items-baseline justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
          Total
        </span>
        <span
          className={cn(
            'font-display font-medium tracking-tight num-tab tabular-nums text-[28px]',
            totalTone,
          )}
        >
          {fmtUsdc(total, 3)}
          <span className="ml-1.5 align-baseline font-mono text-[11px] text-zinc-500">USDC</span>
        </span>
      </div>

      <div className="px-5 pb-5 -mt-1 flex items-center gap-2 text-[10.5px] font-mono text-zinc-600">
        {isNaive ? (
          <>
            <span className="text-rose-500/60">●</span>
            <span>would-have-paid · 0 rejections</span>
          </>
        ) : (
          <>
            <PulseDot tone="success" size={5} />
            <span>verified onchain · {run.steps.length} settlement{run.steps.length === 1 ? '' : 's'}</span>
          </>
        )}
      </div>
    </div>
  )
}

function Receipts() {
  // SSR-safe two-pass: render sample first, then hydrate from localStorage.
  const [run, setRun] = useState<LastRunSummary>(SAMPLE_LAST_RUN)
  const [isReal, setIsReal] = useState(false)

  useEffect(() => {
    const persisted = readLastRun()
    if (persisted) {
      setRun(persisted)
      setIsReal(true)
    }
  }, [])

  const savedPct =
    run.naiveWouldPayUsdc > 0
      ? Math.round((run.savedUsdc / run.naiveWouldPayUsdc) * 100)
      : 0
  const at1k = run.savedUsdc * 1_000
  const at1m = run.savedUsdc * 1_000_000

  return (
    <section className="border-t border-zinc-900 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 dot-grid opacity-50 pointer-events-none"
      />
      <div className="max-w-[1200px] mx-auto px-6 py-24 relative">
        <div className="flex items-end justify-between gap-8 mb-10 flex-wrap">
          <div className="max-w-[640px]">
            <SectionLabel className="mb-3">
              <span className="inline-flex items-center gap-2">
                <Receipt size={11} strokeWidth={1.75} />
                Receipts · proof, not pitch
              </span>
            </SectionLabel>
            <h2 className="font-display text-[36px] md:text-[46px] tracking-tightest text-white leading-[1.04]">
              Two agents. Same task.
              <br />
              <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-accent-soft via-accent to-accent-soft">
                One pays for what it doesn&apos;t need.
              </span>
            </h2>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
              {isReal ? 'Your last run' : 'Sample run'}
              {isReal && run.timestamp ? (
                <> · <span className="text-zinc-400">{timeAgoShort(run.timestamp)}</span></>
              ) : null}
            </div>
            <div className="mt-1.5 font-mono text-[12.5px] text-zinc-300 max-w-[420px] truncate">
              <span className="text-zinc-600">$ </span>
              {run.task}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-2 items-stretch">
          <ReceiptCard variant="naive" run={run} />

          {/* Center diff arrow (md+) */}
          <div className="hidden md:flex flex-col items-center justify-center px-4 select-none">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
              vs
            </div>
            <div className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-500">
              <ArrowRight size={14} strokeWidth={1.75} />
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400/70">
              −{savedPct}%
            </div>
          </div>

          <ReceiptCard variant="payable" run={run} />
        </div>

        {/* Saved callout */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900/40 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
            <div className="p-7 md:p-8">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
                Saved per task
              </div>
              <div className="mt-2 font-display font-medium tracking-tightest text-[44px] leading-none text-white num-tab tabular-nums">
                {fmtUsdc(run.savedUsdc, 3)}
                <span className="ml-2 align-baseline font-mono text-[14px] text-emerald-400">
                  USDC
                </span>
              </div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/90">
                <PulseDot tone="success" size={5} />
                {savedPct}% lower compute spend
              </div>
            </div>
            <div className="p-7 md:p-8">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
                At 1,000 tasks
              </div>
              <div className="mt-2 font-display font-medium tracking-tightest text-[36px] leading-none text-zinc-200 num-tab tabular-nums">
                ${at1k.toFixed(at1k < 100 ? 2 : 0)}
              </div>
              <div className="mt-2.5 text-[12px] text-zinc-500 leading-[1.45]">
                Per workflow run, scaled. No model retraining, no infra changes.
              </div>
            </div>
            <div className="p-7 md:p-8 relative">
              <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />
              <div className="relative">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
                  At 1M tasks / day
                </div>
                <div className="mt-2 font-display font-medium tracking-tightest text-[36px] leading-none text-white num-tab tabular-nums">
                  ${at1m.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  <span className="ml-2 align-baseline font-mono text-[12px] text-zinc-500">
                    / day
                  </span>
                </div>
                <div className="mt-2.5 text-[12px] text-zinc-400 leading-[1.45]">
                  The compounding cost of an agent that doesn&apos;t shop around.
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isReal && (
          <div className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
              <PulseDot tone="muted" size={4} />
              Run the demo — these numbers update with your own task.
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

function FeatureCard({
  idx,
  icon,
  title,
  text,
}: {
  idx: string
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.18em] text-zinc-500 uppercase">{idx}</span>
        <span className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-accent-soft group-hover:border-accent/40 transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="mt-8 font-display text-[22px] tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-[13.5px] leading-[1.55] text-zinc-400">{text}</p>
    </div>
  )
}

function Features() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <SectionLabel className="mb-3">The economic layer</SectionLabel>
            <h2 className="font-display text-[36px] md:text-[44px] tracking-tightest text-white max-w-[520px] leading-[1.05]">
              Three things agents have never been able to do.
            </h2>
          </div>
          <p className="hidden md:block max-w-[320px] text-[13px] text-zinc-500 leading-[1.55]">
            Payable.ai is the missing primitive between the model and the API. It lives below the agent runtime and above the payment rail.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FeatureCard
            idx="01"
            icon={<Compass size={16} strokeWidth={1.75} />}
            title="Dynamic discovery"
            text="Agents discover payable endpoints at runtime. No hardcoded integrations, no API keys provisioned ahead of time — the catalog is the network."
          />
          <FeatureCard
            idx="02"
            icon={<Brain size={16} strokeWidth={1.75} />}
            title="Economic reasoning"
            text="The agent compares prices, latencies and budget. It decides if a request is worth its cost — and rejects providers it can't justify."
          />
          <FeatureCard
            idx="03"
            icon={<Zap size={16} strokeWidth={1.75} />}
            title="Instant settlement"
            text="Pay in Solana USDC in ~400ms. Verifiable on-chain, no humans in the loop, no subscriptions — just programmatic micropayments."
          />
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
          {[
            ['~400ms', 'settlement finality'],
            ['$0.00025', 'median tx fee'],
            ['402', 'http response code'],
            ['1 of N', 'providers per task'],
          ].map(([n, l]) => (
            <div key={l} className="bg-zinc-950 p-6">
              <div className="font-mono text-[26px] text-white tracking-tight num-tab">{n}</div>
              <div className="mt-2 text-[11.5px] text-zinc-500 uppercase tracking-[0.12em] font-mono">
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const HOW_ROWS = [
  {
    tag: '01 / DISCOVER',
    title: 'Agent queries the catalog',
    text: 'GET payable.ai/discover?capability=search → list of payable endpoints with prices, latencies, and capability tags.',
  },
  {
    tag: '02 / REASON',
    title: 'Agent picks a provider',
    text: 'It scores options against budget and task complexity. Cheap-enough wins; premium is rejected when not justified.',
  },
  {
    tag: '03 / PAY',
    title: 'Server returns 402 Payment Required',
    text: 'x402 challenge: amount, currency, recipient. The agent signs a Solana transaction and retries with the proof.',
  },
  {
    tag: '04 / SETTLE',
    title: 'Facilitator verifies on-chain',
    text: 'Coinbase CDP facilitator validates the payment, settles in USDC, and the API returns 200 OK with real results.',
  },
]

function HowItWorks() {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-[1200px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <SectionLabel className="mb-3">Protocol</SectionLabel>
            <h2 className="font-display text-[36px] tracking-tightest text-white leading-[1.05]">
              HTTP&nbsp;402, revived for machines.
            </h2>
            <p className="mt-4 text-[13.5px] text-zinc-400 leading-[1.6]">
              Payable.ai sits on top of <span className="font-mono text-zinc-200">x402</span> — an open standard that turns the long-dormant <span className="font-mono text-zinc-200">402 Payment Required</span> response into a programmable payment handshake.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge mono>x402</Badge>
              <Badge mono>solana-devnet</Badge>
              <Badge mono>cdp facilitator</Badge>
              <Badge mono>spl-usdc</Badge>
            </div>
          </div>
          <div className="md:col-span-8 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent" />
            <ol className="space-y-7">
              {HOW_ROWS.map((r) => (
                <li key={r.tag} className="relative pl-8">
                  <span className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" />
                  </span>
                  <div className="font-mono text-[10.5px] text-zinc-500 tracking-[0.14em]">{r.tag}</div>
                  <div className="mt-1.5 text-[18px] font-display tracking-tight text-white">{r.title}</div>
                  <div className="mt-1.5 text-[13.5px] text-zinc-400 leading-[1.6] max-w-[540px]">
                    {r.text}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function CtaStrip({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-zinc-950 p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-60" />
          <div className="relative grid md:grid-cols-2 gap-8 items-end">
            <div>
              <SectionLabel className="mb-3">Try the demo</SectionLabel>
              <h3 className="font-display text-[34px] md:text-[40px] tracking-tightest text-white leading-[1.05]">
                Watch an agent spend its own money.
              </h3>
              <p className="mt-3 text-[14px] text-zinc-400 max-w-[460px]">
                Connect a Devnet wallet, fund the agent with test USDC, and give it a task. You&apos;ll see the trace stream live.
              </p>
            </div>
            <div className="flex md:justify-end">
              <PayableButton
                variant="accent"
                size="lg"
                onClick={onLaunch}
                trailing={<ArrowRight size={15} strokeWidth={1.75} />}
              >
                Launch App
              </PayableButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Logo />
        <div className="text-[12px] text-zinc-500 font-mono">
          © 2026 Payable.ai · All rights reserved
        </div>
        <div className="flex items-center gap-4 text-[12px] text-zinc-500">
          <a href="#" className="hover:text-zinc-200 transition">Privacy</a>
          <a href="#" className="hover:text-zinc-200 transition">Terms</a>
          <a href="#" className="hover:text-zinc-200 transition">Status</a>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const router = useRouter()
  const onLaunch = () => navigateWithTransition(router, '/connect', 'nav-forward')

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div className="screen-in min-h-screen flex flex-col" data-screen-label="01 Landing">
        <LandingNav onLaunch={onLaunch} />
        <Hero onLaunch={onLaunch} />
        <Receipts />
        <Features />
        <HowItWorks />
        <CtaStrip onLaunch={onLaunch} />
        <Footer />
      </div>
    </ViewTransition>
  )
}
