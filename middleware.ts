import { NextResponse, type NextRequest } from "next/server"

type RateEntry = { count: number; resetAt: number }

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000) // 1분
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 100) // 기본 1분 100회
const ALLOW_PREFIXES = ["/api/health", "/api/webhooks/clerk"]

// 전역 맵으로 인스턴스 내에서만 상태를 유지 (서버리스 한계 인지 필요)
const store: Map<string, RateEntry> =
  (globalThis as any).__rateLimitStore || ((globalThis as any).__rateLimitStore = new Map())

function getClientIp(req: NextRequest) {
  return (
    req.ip ||
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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 허용 경로는 무조건 통과
  if (ALLOW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const ip = getClientIp(req)
  const result = checkLimit(ip)

  if (!result.ok) {
    console.warn("[RateLimit] blocked", { ip, pathname, resetAt: result.resetAt }) // 핵심 기능 로그
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

// API 경로만 대상으로 적용
export const config = {
  matcher: ["/api/:path*"],
}
