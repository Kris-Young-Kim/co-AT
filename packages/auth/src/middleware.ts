import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { AppKey } from '@co-at/types'

const PRIMARY_SIGN_IN = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'
const PRIMARY_SIGN_UP = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export function createAppMiddleware(appKey?: AppKey, localDomain?: string) {
  const domain = process.env.NEXT_PUBLIC_CLERK_DOMAIN ?? localDomain

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
  }, {
    isSatellite: true,
    domain,
    signInUrl: PRIMARY_SIGN_IN,
    signUpUrl: PRIMARY_SIGN_UP,
  })
}

export const middlewareConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/__clerk/(.*)',
  ],
}
