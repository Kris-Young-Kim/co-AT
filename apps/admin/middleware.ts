import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { detectThreatsInRequest } from '@/lib/utils/security-detector'
import { createAdminClient } from '@/lib/supabase/admin'

// 보호가 필요한 경로 정의
const isProtectedRoute = createRouteMatcher([
  '/portal(.*)',
  '/admin(.*)',
])

// 공개 경로 (인증 없이 접근 가능)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/notices(.*)',
])

// Rate Limiting 설정
type RateEntry = { count: number; resetAt: number }
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000) // 1분
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 100) // 기본 1분 100회
const ALLOW_PREFIXES = ["/api/health", "/api/webhooks/clerk"]

// 전역 맵으로 인스턴스 내에서만 상태를 유지 (서버리스 한계 인지 필요)
const store: Map<string, RateEntry> =
  (globalThis as any).__rateLimitStore || ((globalThis as any).__rateLimitStore = new Map())

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
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

/**
 * 보안 위협 탐지 및 로깅
 */
async function detectAndLogThreats(
  req: NextRequest,
  ip: string,
  userAgent: string
): Promise<void> {
  try {
    const { pathname, search } = req.nextUrl
    const method = req.method

    // 요청 본문 읽기 (GET 요청은 본문 없음)
    let body: unknown = null
    if (method !== "GET" && method !== "HEAD") {
      try {
        const clonedReq = req.clone()
        body = await clonedReq.json().catch(() => null)
      } catch {
        // 본문 읽기 실패 시 무시
      }
    }

    // URL 쿼리 파라미터도 검사
    const fullPath = `${pathname}${search}`

    // 보안 위협 탐지
    const threats = detectThreatsInRequest(body || fullPath, fullPath, method)

    if (threats.length > 0) {
      for (const threat of threats) {
        await logSecurityEvent({
          eventType: threat.type,
          severity: threat.severity,
          ip,
          path: fullPath,
          userAgent,
          method,
          description: threat.description,
          detectedPattern: threat.pattern,
          blocked: threat.blocked,
        })

        // 차단이 필요한 경우 즉시 차단
        if (threat.blocked) {
          console.error("[Security] 위협 차단:", {
            type: threat.type,
            path: fullPath,
            ip,
          })
        }
      }
    }
  } catch (error) {
    console.error("[Security] 위협 탐지 중 오류:", error)
  }
}

/**
 * 보안 이벤트 로깅
 */
async function logSecurityEvent(data: {
  eventType: string
  severity: "low" | "medium" | "high" | "critical"
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

    await supabase.from("security_logs" as any).insert({
      event_type: data.eventType as any,
      severity: data.severity,
      ip_address: data.ip,
      request_path: data.path,
      request_method: data.method,
      user_agent: data.userAgent,
      detected_pattern: data.detectedPattern,
      threat_description: data.description,
      blocked: data.blocked || false,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    })

    // 크리티컬 이벤트는 알림 발송
    if (data.severity === "critical" || data.severity === "high") {
      const { sendSecurityAlert } = await import("@/lib/utils/security-alert")
      await sendSecurityAlert({
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        ipAddress: data.ip,
        metadata: {
          path: data.path,
          method: data.method,
          pattern: data.detectedPattern,
        },
      })
    }
  } catch (error) {
    console.error("[Security] 보안 이벤트 로깅 실패:", error)
  }
}

/**
 * 사용자의 관리자 권한 확인 (middleware용)
 * Supabase REST API를 직접 호출하여 권한 확인
 */
async function checkAdminPermission(userId: string, req: Request): Promise<boolean> {
  try {
    // Supabase REST API를 직접 호출
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // RPC 또는 직접 쿼리 대신 REST API 사용
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?clerk_user_id=eq.${userId}&select=role`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
      }
    )

    if (!response.ok) {
      console.error("[Middleware] Supabase REST API 호출 실패:", response.status)
      return false
    }

    const profiles = await response.json()
    
    if (!profiles || profiles.length === 0) {
      console.log("[Middleware] 프로필을 찾을 수 없음:", userId)
      return false
    }

    const role = profiles[0]?.role as string
    const hasPermission = role === "manager" || role === "staff" || role === "admin"
    
    console.log("[Middleware] 권한 확인:", { userId, role, hasPermission })
    return hasPermission
  } catch (error) {
    console.error("[Middleware] 권한 확인 실패:", error)
    return false
  }
}

const proxy = clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()
    const url = req.nextUrl.clone()
    const { pathname } = req.nextUrl

    // API 경로에 대한 Rate Limiting 및 보안 탐지
    if (pathname.startsWith('/api/')) {
      // 허용 경로는 무조건 통과
      if (ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
      }

      const ip = getClientIp(req as NextRequest)
      const userAgent = req.headers.get("user-agent") || "unknown"

      // 보안 위협 탐지 (비동기로 실행, 응답 지연 최소화)
      detectAndLogThreats(req as NextRequest, ip, userAgent).catch((error) => {
        console.error("[Security] 위협 탐지 중 오류:", error)
      })

      // Rate Limiting 체크
      const result = checkLimit(ip)

      if (!result.ok) {
        console.warn("[RateLimit] blocked", { ip, pathname, resetAt: result.resetAt }) // 핵심 기능 로그
        
        // Rate Limit 초과를 보안 로그에 기록
        logSecurityEvent({
          eventType: "rate_limit_exceeded",
          severity: "medium",
          ip,
          path: pathname,
          userAgent,
          description: `Rate limit 초과: ${ip}`,
        }).catch(console.error)

        return NextResponse.json(
          { message: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
            },
          }
        )
      }

      const res = NextResponse.next()
      res.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS))
      res.headers.set("X-RateLimit-Remaining", String(result.remaining))
      res.headers.set("X-RateLimit-Reset", String(result.resetAt))

      return res
    }

    // 보호된 경로 접근 시 인증 확인
    if (isProtectedRoute(req) && !userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // 관리자 전용 앱이므로 모든 경로에 대해 관리자 세션 확인 (공개 경로 제외)
    const isPublic = isPublicRoute(req) || pathname.startsWith('/_next') || pathname.startsWith('/api/') || pathname.includes('.')
    const isCreateProfilePath = pathname === '/create-profile'
    const isAdminRootPath = pathname === '/' // 루트 페이지 (대시보드)

    // 공개 경로가 아니고, 프로필 생성 중이 아니며, 세션 API가 아닌 경우
    if (!isPublic && !isCreateProfilePath && pathname !== '/api/admin/session') {
      // 로그인하지 않은 경우
      if (!userId) {
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return NextResponse.redirect(signInUrl)
      }

      // 관리자 세션 쿠키 확인
      const adminSession = req.cookies.get('admin_session')?.value

      // 관리자 세션이 없으면 권한 확인 후 자동 설정
      if (!adminSession) {
        const hasPermission = await checkAdminPermission(userId, req)

        if (hasPermission) {
          // 권한이 있으면 자동으로 관리자 세션 설정
          const response = NextResponse.next()
          response.cookies.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24시간
            path: '/',
          })
          return response
        } else {
          // 권한이 없으면 프로필 생성 페이지로 유도하거나 접근 차단
          // (여기서는 일단 메인 웹 사이트로 리다이렉트하는 것이 안전할 수 있음)
          const mainSiteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gwatc.cloud')
          return NextResponse.redirect(mainSiteUrl)
        }
      }
    }

  return NextResponse.next()
})
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

export { proxy }
export default proxy
