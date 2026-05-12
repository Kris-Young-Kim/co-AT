import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { middlewareConfig } from '@co-at/auth'

const isProtectedRoute = createRouteMatcher([
  '/mypage(.*)',
  '/settings(.*)',
  '/profile-debug(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, redirectToSignIn } = await auth()
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url })
  }
})

export const config = middlewareConfig
