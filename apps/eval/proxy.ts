import { createAppMiddleware } from '@co-at/auth'

export const middleware = createAppMiddleware('eval')
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
