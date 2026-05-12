import { createAppMiddleware } from '@co-at/auth'

export default createAppMiddleware('inventory')
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
