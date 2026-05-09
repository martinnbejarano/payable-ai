'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* ── helpers ──────────────────────────────────────────────── */
export function truncAddr(addr: string | null | undefined, head = 4, tail = 4) {
  if (!addr) return ''
  if (addr.length <= head + tail + 3) return addr
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`
}

const HEX = 'abcdef0123456789'
export function randHex(len = 64) {
  let s = ''
  for (let i = 0; i < len; i++) s += HEX[Math.floor(Math.random() * HEX.length)]
  return s
}

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
export function randAddr() {
  let s = ''
  for (let i = 0; i < 44; i++) s += B58[Math.floor(Math.random() * B58.length)]
  return s
}

export function timeAgo(date: number) {
  const s = Math.max(1, Math.floor((Date.now() - date) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

/* ── Logo ─────────────────────────────────────────────────── */
type LogoSize = 'sm' | 'md' | 'lg'
export function Logo({ size = 'md', className }: { size?: LogoSize; className?: string }) {
  const fs = size === 'lg' ? 'text-[28px]' : size === 'sm' ? 'text-[15px]' : 'text-[19px]'
  return (
    <div className={cn('inline-flex items-baseline gap-0 select-none', className)}>
      <div className="relative inline-flex items-center mr-2">
        <span className="absolute inset-0 rounded-[6px] bg-accent/30 blur-sm" />
        <span className="relative h-5 w-5 rounded-[6px] bg-gradient-to-br from-accent to-accent-soft border border-accent-soft/40 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-950" />
        </span>
      </div>
      <span className={cn('font-display font-semibold tracking-tightest text-white', fs)}>
        payable
      </span>
      <span className={cn('font-mono font-medium text-accent-soft', fs)}>.ai</span>
    </div>
  )
}

/* ── Button ───────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'outline' | 'soft' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-lg',
  lg: 'h-11 px-5 text-[14px] gap-2 rounded-lg',
}

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_8px_24px_-12px_rgba(255,255,255,0.4)] disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none',
  accent:
    'bg-accent text-white hover:bg-accent/90 shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_28px_-10px_rgba(124,58,237,0.55)] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none',
  ghost:
    'bg-transparent text-zinc-200 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700',
  outline: 'bg-zinc-900/50 text-zinc-100 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700',
  soft: 'bg-zinc-900 text-zinc-100 border border-zinc-800 hover:border-zinc-700',
  success: 'bg-success text-zinc-950 hover:bg-success/90 disabled:bg-zinc-800 disabled:text-zinc-500',
}

export const PayableButton = React.forwardRef<HTMLButtonElement, ButtonProps>(function PayableButton(
  { variant = 'primary', size = 'md', className, children, leading, trailing, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium tracking-tight transition-all duration-150 active:scale-[0.98] glow-violet disabled:cursor-not-allowed disabled:active:scale-100',
        BTN_SIZES[size],
        BTN_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
})

/* ── Card ─────────────────────────────────────────────────── */
export function PayableCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-zinc-900/40 border border-zinc-800 rounded-xl', className)}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ── Badge ────────────────────────────────────────────────── */
type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'blue' | 'muted'
const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-900 border-zinc-800 text-zinc-300',
  accent: 'bg-accent/10 border-accent/30 text-accent-soft',
  success: 'bg-success/10 border-success/25 text-success',
  warn: 'bg-warn/10 border-warn/30 text-warn',
  danger: 'bg-danger/10 border-danger/30 text-danger',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  muted: 'bg-zinc-900/60 border-zinc-800/70 text-zinc-500',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
  mono = false,
  dim = false,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
  icon?: React.ReactNode
  mono?: boolean
  dim?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md text-[10.5px] font-medium border tracking-tight',
        mono && 'font-mono uppercase tracking-[0.06em] text-[10px]',
        dim && 'opacity-80',
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/* ── PulseDot ─────────────────────────────────────────────── */
type DotTone = 'success' | 'accent' | 'warn' | 'danger' | 'muted'
const DOT_COLORS: Record<DotTone, string> = {
  success: 'bg-success',
  accent: 'bg-accent-soft',
  warn: 'bg-warn',
  danger: 'bg-danger',
  muted: 'bg-zinc-500',
}

export function PulseDot({
  tone = 'success',
  size = 6,
  className,
}: {
  tone?: DotTone
  size?: number
  className?: string
}) {
  return (
    <span
      className={cn('relative inline-flex', className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cn('absolute inset-0 rounded-full opacity-60 pulse-dot', DOT_COLORS[tone])}
      />
      <span
        className={cn('relative inline-block rounded-full', DOT_COLORS[tone])}
        style={{ width: size, height: size }}
      />
    </span>
  )
}

/* ── Section label ─────────────────────────────────────────── */
export function SectionLabel({
  children,
  className,
  trailing,
}: {
  children: React.ReactNode
  className?: string
  trailing?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500',
        className,
      )}
    >
      <span>{children}</span>
      {trailing}
    </div>
  )
}

/* ── Wallet glyph (placeholder, NOT real Phantom mark) ────── */
export function WalletGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('relative inline-flex items-center justify-center rounded-lg', className)}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(140deg,#7C3AED,#A78BFA 60%,#C4B5FD)',
      }}
    >
      <span
        className="absolute inset-[2px] rounded-md"
        style={{ background: 'linear-gradient(160deg,#5B21B6,#7C3AED)' }}
      />
      <span className="relative h-[6px] w-[6px] rounded-full bg-white/95 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
    </span>
  )
}
