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

    const { userId, sessionClaims, redirectToSignIn } = await auth()

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }

    if (appKey) {
      let role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

      if (!role) {
        // Session JWT may be stale — fetch latest publicMetadata from Clerk
        try {
          const client = await clerkClient()
          const user = await client.users.getUser(userId)
          role = (user.publicMetadata as { role?: string })?.role
        } catch {
          // non-critical: fall through to role check
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
      // Any valid role (staff / manager / admin) may access all apps
    }
  })
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest|zip)).*)',
    '/(api|trpc)(.*)',
  ],
}
