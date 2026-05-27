import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { detectThreatsInRequest } from '@/lib/utils/security-detector'
import { createAdminClient } from '@/lib/supabase/admin'

const PRIMARY_SIGN_IN = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? 'https://gwatc.cloud/sign-in'
const PRIMARY_SIGN_UP = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? 'https://gwatc.cloud/sign-up'
const MAIN_SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gwatc.cloud'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
])

type RateEntry = { count: number; resetAt: number }
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 100)
const RATE_ALLOW = ['/api/health', '/api/webhooks/clerk']
const store: Map<string, RateEntry> =
  (globalThis as unknown as Record<string, unknown>).__rateLimitStore as Map<string, RateEntry> ||
  (((globalThis as unknown as Record<string, unknown>).__rateLimitStore) = new Map())

function getClientIp(req: NextRequest) {
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
  if (current.count >= MAX_REQUESTS) return { ok: false, resetAt: current.resetAt, remaining: 0 }
  current.count += 1
  return { ok: true, resetAt: current.resetAt, remaining: MAX_REQUESTS - current.count }
}

async function logSecurityEvent(data: {
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  path: string
  userAgent: string
  method?: string
  description: string
  detectedPattern?: string
  blocked?: boolean
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('security_logs').insert({
      event_type: data.eventType,
      severity: data.severity,
      ip_address: data.ip,
      request_path: data.path,
      request_method: data.method,
      user_agent: data.userAgent,
      detected_pattern: data.detectedPattern,
      threat_description: data.description,
      blocked: data.blocked || false,
      metadata: { timestamp: new Date().toISOString() },
    })
    if (data.severity === 'critical' || data.severity === 'high') {
      const { sendSecurityAlert } = await import('@/lib/utils/security-alert')
      await sendSecurityAlert({
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        ipAddress: data.ip,
        metadata: { path: data.path, method: data.method, pattern: data.detectedPattern },
      })
    }
  } catch {
    // non-critical: don't block the request
  }
}

async function detectAndLogThreats(req: NextRequest, ip: string, userAgent: string) {
  try {
    const { pathname, search } = req.nextUrl
    const method = req.method
    let body: unknown = null
    if (method !== 'GET' && method !== 'HEAD') {
      try { body = await req.clone().json().catch(() => null) } catch { /* ignore */ }
    }
    const fullPath = `${pathname}${search}`
    const threats = detectThreatsInRequest(body || fullPath, fullPath, method)
    for (const threat of threats) {
      await logSecurityEvent({
        eventType: threat.type, severity: threat.severity,
        ip, path: fullPath, userAgent, method,
        description: threat.description, detectedPattern: threat.pattern, blocked: threat.blocked,
      })
    }
  } catch { /* ignore */ }
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/')) {
    if (RATE_ALLOW.some(p => pathname.startsWith(p))) return NextResponse.next()

    const ip = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'
    detectAndLogThreats(req, ip, userAgent).catch(() => {})

    const result = checkLimit(ip)
    if (!result.ok) {
      logSecurityEvent({
        eventType: 'rate_limit_exceeded', severity: 'medium',
        ip, path: pathname, userAgent, description: `Rate limit exceeded: ${ip}`,
      }).catch(() => {})
      return NextResponse.json(
        { message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString() } },
      )
    }

    const res = NextResponse.next()
    res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
    res.headers.set('X-RateLimit-Remaining', String(result.remaining))
    res.headers.set('X-RateLimit-Reset', String(result.resetAt))
    return res
  }

  if (!isPublicRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth()

    if (!userId) return redirectToSignIn({ returnBackUrl: req.url })

    let role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
    if (!role) {
      // Session token may not include publicMetadata — fetch directly from Clerk
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        role = (user.publicMetadata as { role?: string })?.role
      } catch { /* non-critical: fall through to role check */ }
    }
    if (!role || !['admin', 'manager', 'staff'].includes(role)) {
      return NextResponse.redirect(new URL(MAIN_SITE))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
