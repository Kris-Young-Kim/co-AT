import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { AppKey } from '@co-at/types'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

const VALID_ROLES = ['admin', 'manager', 'staff']

export function createAppMiddleware(appKey?: AppKey) {
  return clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return

    const { userId, sessionClaims } = await auth()

    if (!userId) {
      const url = new URL('/sign-in', req.url)
      url.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(url)
    }

    if (appKey) {
      const meta = sessionClaims?.metadata as { role?: string; apps?: string[] } | undefined
      let role = meta?.role
      let apps = meta?.apps

      // Fetch fresh metadata if role is missing, or if role is non-admin and apps[] is absent (stale JWT)
      if (!role || (role !== 'admin' && apps === undefined)) {
        try {
          const client = await clerkClient()
          const user = await client.users.getUser(userId)
          const freshMeta = user.publicMetadata as { role?: string; apps?: string[] }
          if (!role) role = freshMeta.role
          if (apps === undefined) apps = freshMeta.apps
        } catch {
          // non-critical: fall through to checks
        }
      }

      if (!role || !VALID_ROLES.includes(role)) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.gwatc.cloud'
        try {
          return NextResponse.redirect(new URL('/unauthorized', adminUrl))
        } catch {
          return NextResponse.redirect('https://admin.gwatc.cloud/unauthorized')
        }
      }

      // admin bypasses per-app access control
      if (role === 'admin') return

      // staff/manager: if apps[] is undefined (never configured), allow all for backward compat
      // if apps[] is an explicit array (even empty), enforce it
      if (apps !== undefined && !apps.includes(appKey)) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.gwatc.cloud'
        try {
          return NextResponse.redirect(new URL('/unauthorized', adminUrl))
        } catch {
          return NextResponse.redirect('https://admin.gwatc.cloud/unauthorized')
        }
      }
    }
  })
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest|zip)).*)',
    '/(api|trpc)(.*)',
  ],
}
