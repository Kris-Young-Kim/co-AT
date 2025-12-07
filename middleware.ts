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

  // 관리자 경로 접근 시 관리자 세션 확인
  const adminPaths = ['/admin', '/notices-management', '/dashboard']
  const isAdminPath = adminPaths.some(path => url.pathname.startsWith(path))
  const isCreateProfilePath = url.pathname === '/create-profile' || url.pathname === '/admin/create-profile'
  const isAdminRootPath = url.pathname === '/admin' // 관리자 로그인 페이지
  const isAdminSessionApi = url.pathname === '/api/admin/session'
  
  // 관리자 경로 접근 시 (로그인 페이지와 API 제외)
  if (isAdminPath && !isCreateProfilePath && !isAdminRootPath && !isAdminSessionApi) {
    // 관리자 세션 쿠키 확인
    const adminSession = req.cookies.get('admin_session')?.value
    
    if (!adminSession) {
      // 관리자 세션이 없으면 관리자 로그인 페이지로 리다이렉트
      const adminSignInUrl = new URL('/admin', req.url)
      adminSignInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(adminSignInUrl)
    }
    
    // 관리자 세션이 있지만 로그인하지 않은 경우
    if (!userId) {
      const adminSignInUrl = new URL('/admin', req.url)
      adminSignInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(adminSignInUrl)
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

