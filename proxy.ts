import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

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

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()
    const url = req.nextUrl.clone()

    // 보호된 경로 접근 시 인증 확인
    if (isProtectedRoute(req) && !userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    // 관리자 경로 접근 시 관리자 세션 확인
    const adminPaths = ['/admin', '/notices-management', '/dashboard']
    const isAdminPath = adminPaths.some(path => url.pathname.startsWith(path))
    const isCreateProfilePath = url.pathname === '/create-profile' || url.pathname === '/admin/create-profile'
    const isAdminRootPath = url.pathname === '/admin' // 관리자 로그인 페이지
    const isAdminSessionApi = url.pathname === '/api/admin/session'

    // 관리자 경로 접근 시
    if (isAdminPath && !isCreateProfilePath && !isAdminSessionApi) {
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
          // 관리자 로그인 페이지가 아닌 경우에만 리다이렉트
          if (isAdminRootPath) {
            // 관리자 로그인 페이지에서 권한이 있으면 대시보드로 리다이렉트
            const redirectUrl = url.searchParams.get('redirect_url') || '/admin/dashboard'
            const response = NextResponse.redirect(new URL(redirectUrl, req.url))
            response.cookies.set('admin_session', 'true', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24, // 24시간
              path: '/',
            })
            return response
          } else {
            // 다른 관리자 페이지인 경우 세션만 설정하고 계속 진행
            const response = NextResponse.next()
            response.cookies.set('admin_session', 'true', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24, // 24시간
              path: '/',
            })
            return response
          }
        } else {
          // 권한이 없으면 관리자 로그인 페이지로 리다이렉트 (이미 있는 경우 제외)
          if (!isAdminRootPath) {
            const adminSignInUrl = new URL('/admin', req.url)
            adminSignInUrl.searchParams.set('redirect_url', req.url)
            return NextResponse.redirect(adminSignInUrl)
          }
        }
      } else if (isAdminRootPath) {
        // 관리자 세션이 있고 관리자 로그인 페이지에 접근한 경우 대시보드로 리다이렉트
        const redirectUrl = url.searchParams.get('redirect_url') || '/admin/dashboard'
        return NextResponse.redirect(new URL(redirectUrl, req.url))
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

