'use client'

import { startTransition } from 'react'
import type { useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>
type NavType = 'nav-forward' | 'nav-back'

/**
 * Navigation helper. Uses `startTransition` so that React can batch the
 * pending state and avoid blocking the click. Once `<ViewTransition>` is
 * stable in the installed React version, this is the spot to call
 * `addTransitionType(type)` for directional slide animations.
 */
export function navigateWithTransition(router: Router, href: string, _type: NavType) {
  startTransition(() => {
    router.push(href)
  })
}
