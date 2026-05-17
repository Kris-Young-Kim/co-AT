import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
  '/admin(.*)',
])

type RateEntry = { count: number; resetAt: number }
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 100)
const ALLOW_PREFIXES = ['/api/health', '/api/webhooks/clerk']

const store: Map<string, RateEntry> =
  (globalThis as unknown as Record<string, unknown>).__rateLimitStore as Map<string, RateEntry> ||
  (() => {
    const m = new Map<string, RateEntry>()
    ;(globalThis as unknown as Record<string, unknown>).__rateLimitStore = m
    return m
  })()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

function checkLimit(key: string) {
  const now = Date.now()
  const current = store.get(key)
  if (!current || current.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, resetAt: now + WINDOW_MS, remaining: MAX_REQUESTS - 1 }
  }
  if (current.count >= MAX_REQUESTS) {
    return { ok: false, resetAt: current.resetAt, remaining: 0 }
  }
  current.count += 1
  return { ok: true, resetAt: current.resetAt, remaining: MAX_REQUESTS - current.count }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // API rate limiting
  if (pathname.startsWith('/api/')) {
    if (ALLOW_PREFIXES.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    const ip = getClientIp(req)
    const result = checkLimit(ip)
    if (!result.ok) {
      return NextResponse.json(
        { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
    res.headers.set('X-RateLimit-Remaining', String(result.remaining))
    res.headers.set('X-RateLimit-Reset', String(result.resetAt))
    return res
  }

  // Protected route auth check
  const { userId } = await auth()
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
