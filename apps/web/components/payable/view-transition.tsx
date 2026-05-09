'use client'

import type * as React from 'react'

type Trigger = string | Record<string, string>

type Props = {
  name?: string
  enter?: Trigger
  exit?: Trigger
  share?: Trigger
  update?: Trigger
  default?: string
  children: React.ReactNode
}

/**
 * Pass-through wrapper for React's `<ViewTransition>`. The component is only
 * exposed by the canary React bundled inside Next.js (with
 * `experimental.viewTransition: true`); the project's installed `react@19.2`
 * doesn't expose it, so importing it directly resolves to `undefined` in the
 * client bundle. Until that export stabilizes, this is a no-op and the
 * `.screen-in` CSS animation handles entry feel.
 */
export function ViewTransition({ children }: Props) {
  return <>{children}</>
}
