import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// 어드민: 로그인 페이지만 공개, 나머지 전체 보호
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
])

export default clerkMiddleware(async (auth, request) => {
  // 인증 경로가 아니면 모두 보호 (직원용 시스템)
  if (!isAuthRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
