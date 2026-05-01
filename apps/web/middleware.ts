import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// 인증 없이 접근 가능한 공개 경로 (대민용 홈페이지)
const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/services(.*)",
  "/notices(.*)",
  "/apply(.*)",
  "/community(.*)",
  "/info(.*)",
  "/privacy(.*)",
  "/email-policy(.*)",
  "/status(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/sitemap.xml",
  "/robots.txt",
])

export default clerkMiddleware(async (auth, request) => {
  // 공개 경로가 아니면 로그인 강제 (마이페이지, 포털 등)
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Next.js 내부 파일 및 정적 파일 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API 경로 항상 포함
    "/(api|trpc)(.*)",
  ],
}
