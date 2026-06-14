import { createAppMiddleware } from '@co-at/auth'

export default createAppMiddleware('automation')
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest|zip)).*)',
    '/(api|trpc)(.*)',
  ],
}
