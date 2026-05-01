import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { AppKey } from '@co-at/types'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

/**
 * Creates a Clerk middleware that:
 * 1. Allows public routes through
 * 2. Redirects unauthenticated users to sign-in
 * 3. Optionally checks app-level access via Clerk publicMetadata.apps[]
 */
export function createAppMiddleware(appKey?: AppKey) {
  return clerkMiddleware(async (auth, req) => {
    if (isPublicRoute(req)) return

    const { userId, sessionClaims, redirectToSignIn } = await auth()

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url })
    }

    if (appKey) {
      const meta = sessionClaims?.metadata as { apps?: string[] } | undefined
      const allowedApps = meta?.apps ?? []
      const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

      // ADMIN bypasses app-level access checks
      if (role !== 'admin' && !allowedApps.includes(appKey)) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.gwatc.cloud'
        return Response.redirect(new URL('/unauthorized', adminUrl))
      }
    }
  })
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
