---
name: Payable.ai
description: >
  Dark, near-black operator console for autonomous AI agents that discover and
  pay for compute on Solana. Single violet accent, terminal-grade monospace
  trace, glass-morphism chrome, mesh-gradient hero. Reads like Linear meets
  a tcpdump terminal.

mode: dark-only

colors:
  # Surface stack — five steps from page background up to elevated chrome.
  bg:           "#09090B"   # zinc-950 — page background, body
  surface:      "#18181B"   # zinc-900 — primary card / panel
  surface-2:    "#27272A"   # zinc-800 — raised surface, hover wells
  border:       "#27272A"   # zinc-800 — default 1px border
  border-hi:    "#3F3F46"   # zinc-700 — emphasized border / focus track

  # Single brand accent — violet. Used sparingly: CTAs, decision lines, focus.
  accent:       "#7C3AED"   # violet-600 — primary brand
  accent-soft:  "#A78BFA"   # violet-400 — accent text, glyphs, decision
  accent-dim:   "#4C1D95"   # violet-900 — disabled / pressed

  # Semantic — used only for status. No decorative use.
  success:      "#10B981"   # emerald-500 — settled, healthy, complete
  success-dim:  "#064E3B"
  warn:         "#F59E0B"   # amber-500 — evaluating, cost analysis
  danger:       "#EF4444"   # red-500 — rejected, failed
  info:         "#3B82F6"   # blue-500 — market enumeration, neutral net

  # Text — five-step gray ramp on dark.
  text:         "#FAFAFA"   # zinc-50  — primary copy, headlines
  text-2:       "#E4E4E7"   # zinc-200 — strong body
  text-3:       "#A1A1AA"   # zinc-400 — secondary body, providers
  text-4:       "#71717A"   # zinc-500 — labels, sys lines, captions
  text-5:       "#52525B"   # zinc-600 — http lines, line numbers, dividers
  text-6:       "#3F3F46"   # zinc-700 — disabled, deepest dim

typography:
  # Geist (variable, loaded via next/font/google). Stylistic sets cv11 ss01 ss03
  # are enabled globally — they soften lowercase 'l' / 'a' / 'g' shapes.
  font:
    sans:    "Geist, ui-sans-serif, system-ui, sans-serif"
    display: "Geist, ui-sans-serif, sans-serif"      # same family, used semantically
    mono:    "Geist Mono, ui-monospace, SFMono-Regular, monospace"

  features: "'cv11','ss01','ss03'"

  # All values reflect what's actually in primitives.tsx / agent-trace.tsx /
  # dashboard pages. Sizes are in px because the design uses fixed px throughout.
  scale:
    display-xl: { size: 56px, weight: 700, tracking: "-0.04em", lineHeight: 1.02 }   # hero
    display-lg: { size: 40px, weight: 700, tracking: "-0.035em", lineHeight: 1.05 }  # section heads
    display-md: { size: 28px, weight: 600, tracking: "-0.03em",  lineHeight: 1.1  }  # logo lg
    h1:         { size: 22px, weight: 600, tracking: "-0.02em",  lineHeight: 1.2  }
    h2:         { size: 19px, weight: 600, tracking: "-0.015em", lineHeight: 1.25 }  # logo md
    body-lg:    { size: 14px, weight: 400, tracking: "-0.005em", lineHeight: 1.5  }
    body-md:    { size: 13px, weight: 400, tracking: "-0.005em", lineHeight: 1.5  }
    body-sm:    { size: 12.5px, weight: 400, tracking: "0",      lineHeight: 1.45 }
    caption:    { size: 12px, weight: 400, tracking: "0",        lineHeight: 1.4  }

    # Mono / technical — used for everything an agent or wallet "says".
    mono-md:    { size: 13px, weight: 400, family: mono }
    mono-sm:    { size: 11px, weight: 400, family: mono }
    mono-xs:    { size: 10.5px, weight: 500, family: mono }

    # Section labels — uppercase, mono, wide tracking. The "TERMINAL" voice.
    label-caps: { size: 10px, weight: 500, tracking: "0.14em",  family: mono, transform: uppercase }
    badge-caps: { size: 10px, weight: 500, tracking: "0.06em",  family: mono, transform: uppercase }

radius:
  none: 0
  xs:   "2px"     # logo inner pip
  sm:   "4px"     # tag/inline
  md:   "6px"     # buttons sm, badges, logo glyph
  lg:   "8px"     # buttons md/lg, inputs (the default --radius)
  xl:   "12px"   # cards, panels (rounded-xl)
  pill: "9999px"  # PulseDot, status chips

spacing:
  unit: "4px"        # Tailwind default scale
  page-px: "24px"    # max-w container side padding (px-6)
  page-py: "32px"    # vertical breathing room
  panel-px: "20px"   # inner panel padding
  panel-py: "16px"
  stack-xs: "4px"
  stack-sm: "8px"
  stack-md: "12px"
  stack-lg: "16px"
  stack-xl: "24px"
  stack-2xl: "32px"

  container:
    landing-max: "1200px"
    dashboard-max: "1400px"
    nav-height: "56px"     # h-14
    panel-min-height: "560px"

elevation:
  # No traditional drop shadows — depth comes from surface stack + glow + glass.
  # Two named shadow recipes used through the app:
  primary-button: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 24px -12px rgba(255,255,255,0.4)"
  accent-button:  "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 28px -10px rgba(124,58,237,0.55)"
  glow-violet:    "0 0 0 1px rgba(167,139,250,0.4), 0 8px 30px -8px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
  focus-ring:     "0 0 0 1px #18181b, 0 0 0 3px rgba(124,58,237,0.55)"

surfaces:
  glass:        { bg: "rgba(24,24,27,0.55)",  blur: "14px", saturate: "140%", border: "rgba(63,63,70,0.5)" }
  glass-strong: { bg: "rgba(9,9,11,0.75)",    blur: "18px", saturate: "160%", border: "rgba(39,39,42,0.8)" }
  mesh-hero:
    base: "#09090B"
    layers:
      - "radial 80%×60% at 20%/-10% — rgba(124,58,237,0.18) → transparent 60%"   # violet
      - "radial 60%×40% at 80%/0%   — rgba(37,99,235,0.12)  → transparent 60%"   # blue
      - "radial 90%×50% at 50%/110% — rgba(16,185,129,0.06) → transparent 60%"   # emerald
    noise: "SVG fractalNoise baseFrequency=0.9, opacity 0.06, mix-blend-mode overlay"
  dot-grid: "radial 1px rgba(255,255,255,0.025) on 22px×22px tile"

motion:
  duration:
    instant:  "120ms"
    fast:     "150ms"
    base:     "240ms"
    slow:     "320ms"
    slower:   "420ms"
  easing:
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)"   # default for everything kinetic
    spring:   "cubic-bezier(0.34, 1.56, 0.64, 1)"  # pop / arrival
    linear:   "linear"                              # shimmer, stream
  presets:
    line-in:    { name: fadeInUp,   duration: 280ms, easing: standard }
    screen-in:  { name: screenIn,   duration: 360ms, easing: standard }
    pop:        { name: pop,        duration: 320ms, easing: spring }
    pulse-dot:  { name: pulseDot,   duration: 1.6s,  iter: infinite }
    pulse-ring: { name: pulseRing,  duration: 1.8s,  iter: infinite }
    shimmer:    { name: shimmer,    duration: 1.6s,  iter: infinite, easing: linear }
    stream:     { name: stream,     duration: 1.4s,  iter: infinite, easing: standard }
    caret-blink:{ name: blink,      duration: 1s,    iter: infinite, steps: 1 }
    nav-vt:     { duration: 320ms, easing: standard, distance: "40px X-axis" }
  reduced-motion: "All animations clamped to 0.01ms; transitions 0.01ms. iter-count = 1."

iconography:
  library: "lucide-react"
  default-stroke: "1.75"
  default-size:
    inline:    "13px"
    button:    "14px"
    nav:       "16px"
    feature:   "20px"
    glyph-lg:  "22px"
  treatment: "Stroke icons only. No filled/duotone. Color inherits from text."

components:
  button:
    sizes:
      sm: { height: "32px", px: "12px",   text: "12.5px", radius: md, gap: "6px" }
      md: { height: "36px", px: "14px",   text: "13px",   radius: lg, gap: "8px" }
      lg: { height: "44px", px: "20px",   text: "14px",   radius: lg, gap: "8px" }
    variants:
      primary: { bg: white,  fg: zinc-950, hover: zinc-200, shadow: primary-button }
      accent:  { bg: accent, fg: white,    hover: "accent/90", shadow: accent-button }
      ghost:   { bg: transparent, fg: zinc-200, border: zinc-800, hover-bg: "zinc-900/80" }
      outline: { bg: "zinc-900/50", fg: zinc-100, border: zinc-800 }
      soft:    { bg: zinc-900, fg: zinc-100, border: zinc-800 }
      success: { bg: success, fg: zinc-950 }
    behavior: "All buttons get .glow-violet hover halo + 0.98 scale on :active. Disabled clears shadow + lock-cursor."

  card:
    bg: "zinc-900/40"
    border: "zinc-800"
    radius: xl
    px: panel-px
    py: panel-py
    hover: "border-zinc-700"

  badge:
    height: "22px"
    px: "8px"
    radius: md
    text: "10.5px"
    border: 1px
    tones:
      neutral: { bg: zinc-900,        border: zinc-800,      fg: zinc-300 }
      accent:  { bg: "accent/10",     border: "accent/30",   fg: accent-soft }
      success: { bg: "success/10",    border: "success/25",  fg: success }
      warn:    { bg: "warn/10",       border: "warn/30",     fg: warn }
      danger:  { bg: "danger/10",     border: "danger/30",   fg: danger }
      blue:    { bg: "blue-500/10",   border: "blue-500/30", fg: blue-400 }
      muted:   { bg: "zinc-900/60",   border: "zinc-800/70", fg: zinc-500 }
    mono-variant: "uppercase, tracking 0.06em, text 10px — used for status chips like 'DEVNET'"

  pulse-dot:
    default-size: "6px"
    composition: "pulsing halo (opacity 60%) + solid core, both colored by tone"
    tones: [success, accent, warn, danger, muted]

  input:
    height: "36px"
    bg: "zinc-900/50"
    border: "zinc-800"
    fg: text
    placeholder: text-4
    radius: lg
    focus: focus-ring

  section-label:
    typography: label-caps
    color: text-4
    spacing-after: stack-md

  trace:
    surface: surface
    line-height: "20px"
    line-prefix: { color: text-6, width: "28px", padding-right: "12px", align: right, mono-xs }
    caret: { glyph: "▍", color: accent-soft, animation: caret-blink }
    line-types:
      sys:      { color: text-4 }
      found:    { color: text-2 }
      market:   { color: info }
      provider: { color: text-3 }
      eval:     { color: warn }
      reject:   { color: "danger/70" }
      decision: { color: text, weight: 600, size: 13px }
      http:     { color: text-5 }
      settled:  { color: success }
      complete: { color: "emerald-300", weight: 500 }
      plan:     { color: "violet-300", weight: 600, size: 13px }
    phase-pill:
      idle:       { bg: zinc-900,           border: zinc-800,           fg: text-4 }
      planning:   { bg: "fuchsia-500/10",   border: "fuchsia-500/30",   fg: "fuchsia-300" }
      evaluating: { bg: "blue-500/10",      border: "blue-500/30",      fg: info }
      deciding:   { bg: "warn/10",          border: "warn/30",          fg: warn }
      acquiring:  { bg: "violet-500/10",    border: "violet-500/30",    fg: "violet-300" }
      complete:   { bg: "success/15",       border: "success/25",       fg: success }
    footer:
      bg: "zinc-900/30"
      border-top: zinc-800
      typography: mono-xs
      stat-value-color: text-2
      stat-eval-color: warn

  logo:
    glyph: "5×5 violet rounded square (gradient accent → accent-soft, border accent-soft/40, blur halo behind), with a 1.5×1.5 zinc-950 inner pip"
    wordmark: "‘payable’ — sans-serif semibold, tracking-tightest, white"
    suffix:   "‘.ai’ — mono medium, accent-soft"
    sizes:    { sm: 15px, md: 19px, lg: 28px }
---

# Payable.ai — Design System

> One-line: a dark operator console for autonomous agents that buy compute
> onchain. Reads like a Bloomberg terminal that grew up on Linear.

This document is the visual contract for Payable.ai. Anything new added to
the product — page, component, marketing surface — must compose from these
tokens. New tokens are added here first, then implemented.

The codebase reference points are:

- `apps/web/app/globals.css` — CSS variables, surfaces (`mesh-bg`,
  `dot-grid`, `.glass*`), all keyframes, scrollbar, focus ring.
- `apps/web/tailwind.config.ts` — color aliases (`accent`, `success`,
  `warn`, `danger`), font families, `tracking-tightest`.
- `apps/web/components/payable/primitives.tsx` — `PayableButton`,
  `PayableCard`, `Badge`, `PulseDot`, `SectionLabel`, `Logo`, `WalletGlyph`.
- `apps/web/components/payable/agent-trace.tsx` — terminal trace + phase
  pill + footer stats.

---

## 1. Brand & voice

**One product, one tone.** Payable.ai is a piece of *infrastructure* for
agents — not a SaaS for humans. The UI behaves accordingly: dense, technical,
factual, no marketing fluff in product surfaces. Marketing copy on the
landing is allowed to be louder, but never cute.

| | Use | Avoid |
|---|---|---|
| **Voice** | Engineer's notebook. "→ OPTIMAL: tavily-standard @ 0.002 USDC" | Friendly emoji, exclamation, "Let's build…" |
| **Capitalization** | UPPERCASE for terminal labels (`WEB SEARCH`, `ACQUIRING`). lowercase for identifiers (`vision-flash`). Sentence case for prose. | Title Case Everywhere. ALL CAPS HEADLINES. |
| **Numbers** | Always `font-variant-numeric: tabular-nums` (class `num-tab`). 3 decimals for USDC. Truncate hashes as `head6...tail4`. | Proportional digits in costs/addresses. |
| **Punctuation** | Em-dash `—` separates technical fragments. Middle-dot `·` separates inline metadata. | Hyphens for separators. Colons for status. |
| **Status language** | "settled", "rejected", "acquired", "402 · payment required" | "Done!", "Oops", "Loading…" |

---

## 2. Color system

### 2.1 Philosophy

The product is **dark-only** — there is no light mode planned. Hierarchy
comes from a 5-step *surface stack* (page → surface → surface-2 → border →
border-hi) and a 5-step *text ramp* (`text` → `text-5`). A single violet
accent (`#7C3AED`) carries the brand; semantic colors are reserved strictly
for status — never for decoration.

Rule of thumb: **a screen with no semantic color is normal.** Color appears
only when something is happening (`warn` while deciding) or has happened
(`success` after settling).

### 2.2 Surface stack

```
bg          #09090B   page background, body, mesh base
surface     #18181B   primary card, panel, glass fill
surface-2   #27272A   raised surface, hover well, scrollbar thumb
border      #27272A   1px default border
border-hi   #3F3F46   emphasized border, focus track
```

Cards live on `bg`. Inputs and inner wells live on `surface-2`. Hover
states elevate by raising the border one notch (`zinc-800 → zinc-700`)
rather than lightening the fill — this keeps surfaces calm.

### 2.3 Text ramp

```
text     zinc-50   #FAFAFA  headlines, decision lines, key numbers
text-2   zinc-200  #E4E4E7  body emphasis, "found" trace lines
text-3   zinc-400  #A1A1AA  secondary body, provider rows
text-4   zinc-500  #71717A  labels, captions, "sys" trace lines
text-5   zinc-600  #52525B  http trace lines, line prefix, dividers
text-6   zinc-700  #3F3F46  disabled, deepest dim
```

### 2.4 Accent (violet)

Violet is *the* brand color. Use it for:

- Primary CTAs (`accent` button variant)
- The `decision` and `plan` lines in the terminal trace
- Focus rings (`focus-ring`)
- The Logo glyph and wordmark suffix
- Hover halos (`.glow-violet`)
- The `caret` glyph in the trace

Do **not** use violet for:

- Body copy (use the text ramp)
- Backgrounds of multiple panels at once (mesh hero is the one exception)
- "Decorative" highlights — if it's not load-bearing, it's noise.

### 2.5 Semantic palette (status only)

| Token | Hex | When |
|---|---|---|
| `success` | `#10B981` | settled onchain, healthy live providers, COMPLETE phase |
| `warn` | `#F59E0B` | DECIDING phase, eval lines, cost-delta callouts |
| `danger` | `#EF4444` | rejected providers, failed TX, errors |
| `info` | `#3B82F6` | EVALUATING phase, market enumeration, neutral net info |
| `accent-soft` | `#A78BFA` | PLANNING / ACQUIRING phase callouts |

Tinted variants follow a fixed recipe: `bg-{tone}/10`, `border-{tone}/30`,
`text-{tone}` (or `{tone}-soft` for purple). No exceptions.

---

## 3. Typography

### 3.1 Families

- **Geist** (sans + mono) loaded via `next/font/google` with all weights.
- Stylistic features `cv11`, `ss01`, `ss03` are enabled globally — they
  give Geist its slightly humanist lowercase. Do not disable.
- **Mono is not just for code.** Mono is for any *machine speech*: TX
  hashes, wallet addresses, costs, line numbers, timestamps, network
  badges. It is the typographic signal that "an agent or chain produced
  this number."

### 3.2 Type scale

The scale is defined in the YAML frontmatter. Two opinions worth calling
out:

- **Negative tracking on display.** Headlines use `tracking-tightest`
  (`-0.04em`) to feel architectural. Body text uses `-0.005em` or `0`.
- **Section labels are tiny, uppercase, mono.** The `label-caps` token
  (`10px / mono / uppercase / 0.14em tracking`) is the quiet workhorse
  of every panel header. Do not invent a new size for these.

### 3.3 Hierarchy on a card

```
[label-caps]       ← SECTION LABEL · trailing meta
[h2 or display-md] ← Card title
[body-md text-3]   ← Description / running content
[mono-xs text-5]   ← Footer stats / attribution
```

---

## 4. Layout

### 4.1 Containers

- **Landing**: max width `1200px`, side padding `24px` (`px-6`).
- **Dashboard**: max width `1400px`, three-column grid with one collapsible
  side panel.
- **Sticky nav**: `56px` tall (`h-14`), `glass-strong` backdrop, sits at
  `z-30`.

### 4.2 Dashboard grid

Three panels, top-aligned, all sharing `min-height: 560px`:

```
┌───────────────┬─────────────────────────┬───────────────┐
│ Compute       │ Task input              │ Execution     │
│ Market        │ + AgentTrace            │ Log           │
│ (collapsible) │ (terminal)              │ + Integrate   │
│               │                         │   Snippet     │
└───────────────┴─────────────────────────┴───────────────┘
        ~280px              flex-1                ~360px
```

Gap between panels: `16px` (`gap-4`). On screens narrower than `1024px`
the panels stack vertically; the trace becomes full-width.

### 4.3 Spacing intuition

- `stack-xs` (4px) — inline gaps within a row of meta.
- `stack-sm` (8px) — between a label and its value.
- `stack-md` (12px) — between rows in a list.
- `stack-lg` (16px) — between cards.
- `stack-xl` (24px) — between major panel sections.
- `stack-2xl` (32px) — between page regions on the landing.

If you need a value that isn't here, you probably need to recompose, not
add a new spacing token.

---

## 5. Radius & elevation

Radii are deliberately small — this is a tool, not a toy. The only
"rounded-xl" surface is the `Card`, because a card is the largest single
shape on screen and needs the proportional softening.

Depth is **not** drop-shadow. It comes from:

1. **The surface stack** (changing fill from `bg` to `surface` to
   `surface-2`).
2. **`.glow-violet`** on interactive elements — a 240ms transition that
   adds a violet halo + inner highlight on hover.
3. **`.glass` and `.glass-strong`** for chrome that floats over content
   (sticky nav, modals).

The two named button shadows in `elevation` are the only "drop shadows"
in the system, and they are functional (signaling press affordance), not
decorative.

---

## 6. Backgrounds & textures

### 6.1 Mesh hero (`.mesh-bg`)

The landing hero uses a three-layer radial gradient on top of `#09090B`,
with an SVG fractal-noise overlay at 6% opacity in `mix-blend-mode:
overlay`. The three gradients are violet (top-left), blue (top-right),
emerald (bottom). This is the **only** place where all three brand-adjacent
hues mix; treat it as a signature, not a pattern to reuse.

### 6.2 Dot grid (`.dot-grid`)

A 22px tile of `rgba(255,255,255,0.025)` 1px dots. Use it as the
background of an empty/idle state (e.g. `AgentTrace` while `phase ===
'IDLE'`). Never as a default — its job is to say "nothing is happening
yet."

### 6.3 Glass (`.glass`, `.glass-strong`)

Glass is reserved for **floating chrome**: sticky navs, popovers, modals.
Do not glass-tint a card that lives in the document flow — the backdrop
filter is expensive and visually loud when there's nothing to "filter."

---

## 7. Components

This section documents the public primitives exported by
`components/payable/primitives.tsx`. Composition rules apply across all of
them: no margins on the primitive itself (let the parent stack space),
single-purpose props, `cn(...)` for class merging.

### 7.1 `PayableButton`

Three sizes, six variants. The `glow-violet` halo and `active:scale-[0.98]`
press are baked in. **Never override the press scale** — it is the
universal "this is a button" tactile cue.

```
primary  →  white pill with subtle shadow. Reserve for the dominant page action.
accent   →  violet, with violet-tinted shadow. Reserve for "agent actions"
            (Run task, Acquire capability, Sign settlement).
ghost    →  border-only on transparent. Secondary actions.
outline  →  zinc-900/50 with a darker border. Tertiary, calmer than ghost.
soft     →  zinc-900 fill. Inline within busy panels where ghost gets lost.
success  →  emerald-on-zinc. Reserved for "settled" / "confirmed" affirmatives.
```

Trailing-icon convention: `ArrowRight` for forward navigation,
`ExternalLink` for off-product, `ChevronRight` for in-product navigation.

### 7.2 `PayableCard`

```ts
<PayableCard className="p-5">…</PayableCard>
```

Padding is **not** baked in — pass it via className. This is intentional:
half the cards in the product use the full padding, half use a tighter
header + scrolling body.

### 7.3 `Badge`

22px tall, 8px horizontal padding, `md` radius. Seven tones (see YAML).
The `mono` variant is the most-used: it's the `DEVNET` chip in the nav,
the `LIVE` / `MOCK` chips on providers, and the phase labels in run
history.

### 7.4 `PulseDot`

A tone-tinted halo that pulses opacity + scale at 1.6s. Pair it with text:

```
<PulseDot tone="success" /> Settled · 2s ago
<PulseDot tone="warn"    /> Deciding…
<PulseDot tone="muted"   /> Idle
```

Never use `PulseDot` purely decoratively. It must mean something is *live*.

### 7.5 `SectionLabel`

The terminal-grade panel header. Always paired with a trailing meta slot:

```
COMPUTE MARKET                                  · 5 capabilities
EXECUTION LOG                                   · 12 settled
```

### 7.6 `Logo`

Three sizes (sm 15px / md 19px / lg 28px). The wordmark is `payable` in
sans semibold + `.ai` in mono medium accent-soft. The glyph is a 5x5
violet gradient square with a zinc-950 inner pip and a soft accent halo
behind it. **Never recolor the glyph.** It is the one fixed-pigment mark
in the system.

### 7.7 `AgentTrace` (the terminal)

The most opinionated component. Composition:

```
┌────────────────────────────────────────────┐
│  [phase pill]  payable/v1                  │ ← header (mono-xs label-caps)
├────────────────────────────────────────────┤
│  01 → Plan: ocr → web-search               │
│  02   sys: Routing to capability planner…  │
│  …                                         │
│  12 → OPTIMAL: tavily-standard @ 0.002     │ ← decision line (white, 13px, bold)
│       caret ▍                              │ ← live caret while streaming
├────────────────────────────────────────────┤
│ steps · 12 │ evaluations · 04 │ cost · …   │ ← footer (mono-xs)
└────────────────────────────────────────────┘
```

Line-type colors are listed in the YAML `components.trace.line-types`
block. The contract: **every line gets exactly one color**, and that
color encodes its semantic role. Do not invent intermediate colors. If
a new line type is needed, extend `ReasoningLineType` in
`packages/types` and add a row here.

The phase pill uses tinted backgrounds to show *which phase the agent is
in right now*. It is the single most visible UI element when the agent
runs — design changes to it must be reviewed against demo recordings.

---

## 8. Motion

Motion in Payable.ai is functional: it confirms causation (a thing arrived
because a thing happened). The defaults are short and snappy.

| Use | Preset | Why |
|---|---|---|
| New trace line appearing | `line-in` (280ms fadeInUp) | The trace streams; lines should land softly without flashing the eye. |
| Page entering | `screen-in` (360ms) | View transition + fade so route change feels grounded. |
| Pill / chip change | `pop` (320ms spring) | Status changes deserve a tiny celebration. |
| Idle indicator | `pulse-dot` (1.6s loop) | "Something is alive but waiting." |
| Streaming bar | `stream` (1.4s loop) | Active agent run; pairs with caret. |
| Caret in trace | `caret-blink` (1s steps) | Universal "I am typing" cue. |
| Forward nav | `vt-slide-from-right` (320ms) | Hierarchical: deeper = right. |
| Back nav | `vt-slide-from-left` (320ms) | Hierarchical: shallower = left. |

**Reduced motion is a hard requirement.** The `prefers-reduced-motion`
block in `globals.css` clamps everything to ~0ms. Never gate critical
information behind animation.

---

## 9. Iconography

- Library: **lucide-react**, exclusively.
- Stroke width: `1.75` everywhere. Do not vary per icon — consistency is
  what makes lucide work alongside Geist.
- Sizes: `13` inline / `14` button / `16` nav / `20` feature / `22` glyph.
- Color: always inherits from the surrounding text color via `currentColor`.
  Do not give an icon its own color unless it's a status icon paired with
  a status word.

---

## 10. Accessibility

- **Contrast.** All text-on-surface combinations meet WCAG AA at the
  intended size. The dimmest legitimate copy color is `text-4` (zinc-500
  ≈ 4.6:1 on `bg`); `text-5` and `text-6` are reserved for *non-essential*
  decorations like line numbers and dividers.
- **Focus.** Every interactive element gets the `focus-ring` recipe — a
  zinc-900 inner offset plus a violet outer halo. This is wired globally
  via `:focus-visible` in `globals.css`. Do not remove or shadow it.
- **Semantic landmarks.** Every page has a single `<header>`, a single
  primary `<main>`, and meaningful `aria-label`s on icon-only buttons.
- **Number readability.** `num-tab` is mandatory for any column of
  numbers (costs, latencies, addresses). Without it, dim digits will
  jitter as values change.
- **Reduced motion.** See section 8 — non-negotiable.

---

## 11. What not to add

A short list of things the system deliberately *does not* have. Adding
them requires explicit redesign:

- Light mode.
- A second brand accent (e.g. blue or teal as a co-equal).
- Shadows on cards.
- Gradient text.
- Decorative emoji or illustrations (the wallet glyph is a 22px
  pictogram, not an illustration).
- Drop-cap / serif typography.
- Animated gradient borders.
- A "compact" / "comfortable" density toggle. The system has one density.

---

## 12. Adding a new component

1. Sketch in tokens — what surface, text ramp, radius, motion?
2. If a needed value isn't in this file, add the token here first; only
   then implement.
3. Place the component in `components/payable/primitives.tsx` if it's a
   primitive, or `components/payable/<feature>.tsx` if it's
   product-specific.
4. Compose with existing primitives — never introduce a parallel
   `Button2`. Extend the variant list on `PayableButton` if needed.
5. Verify in dark; verify keyboard focus; verify `prefers-reduced-motion`;
   verify on the dashboard at `1024px` width.

The cheapest way to keep the system coherent is to make new pieces
*boring* and reuse what exists.
