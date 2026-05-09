'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Compass, Cpu, ExternalLink, Github, Zap } from 'lucide-react'
import {
  Badge,
  Logo,
  PayableButton,
  PulseDot,
  SectionLabel,
} from '@/components/payable/primitives'
import { navigateWithTransition } from '@/components/payable/nav'
import { ViewTransition } from '@/components/payable/view-transition'

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
      <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-32 relative">
        <div className="flex justify-center mb-8">
          <div className="pop inline-flex items-center gap-2 h-7 px-3 rounded-full border border-zinc-800 bg-zinc-950/70 backdrop-blur">
            <PulseDot tone="success" size={6} />
            <span className="text-[11.5px] font-mono text-zinc-300 tracking-tight">
              Built on x402 · Solana
            </span>
            <span className="text-zinc-700">·</span>
            <span className="text-[11px] text-zinc-500">v0.1 hackathon preview</span>
          </div>
        </div>

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

        <div className="mt-10 flex items-center justify-center gap-3">
          <PayableButton
            variant="primary"
            size="lg"
            onClick={onLaunch}
            trailing={<ArrowRight size={15} strokeWidth={1.75} />}
          >
            Launch App
          </PayableButton>
          <PayableButton variant="ghost" size="lg" trailing={<ExternalLink size={14} strokeWidth={1.75} />}>
            View Docs
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
            <div className="flex md:justify-end gap-3">
              <PayableButton
                variant="accent"
                size="lg"
                onClick={onLaunch}
                trailing={<ArrowRight size={15} strokeWidth={1.75} />}
              >
                Launch App
              </PayableButton>
              <PayableButton variant="ghost" size="lg" leading={<Github size={14} strokeWidth={1.75} />}>
                GitHub
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
          Powered by Solana · x402 Protocol · Built at Hackathon 2026
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
        <Features />
        <HowItWorks />
        <CtaStrip onLaunch={onLaunch} />
        <Footer />
      </div>
    </ViewTransition>
  )
}
