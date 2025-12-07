import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const url = req.nextUrl.clone()

  // 보호된 경로 접근 시 인증 확인
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // 관리자 경로 접근 시 인증 확인 (권한은 페이지 레벨에서 체크)
  // /admin/* 또는 /notices-management, /dashboard 등 관리자 전용 경로
  // 단, /create-profile는 프로필 생성용이므로 예외 처리
  const adminPaths = ['/admin', '/notices-management', '/dashboard']
  const isAdminPath = adminPaths.some(path => url.pathname.startsWith(path))
  const isCreateProfilePath = url.pathname === '/create-profile'
  
  if (isAdminPath && !isCreateProfilePath && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
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

