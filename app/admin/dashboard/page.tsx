import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { AdminDashboardContent } from "@/components/features/dashboard/AdminDashboardContent"

export default async function AdminDashboardPage() {
  // 개발 환경에서는 권한 체크를 완전히 우회하여 페이지 렌더링
  // 프로덕션 환경에서만 권한 체크 수행
  const isDevelopment = process.env.NODE_ENV !== "production"
  
  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[대시보드] 권한 없음 - 홈으로 리다이렉트")
        redirect("/")
      }
      console.log("[대시보드] 권한 확인 완료 - 페이지 렌더링")
    } catch (error) {
      console.error("[대시보드] 권한 확인 중 오류:", error)
      redirect("/")
    }
  }
  // 개발 환경: 권한 체크를 완전히 우회하고 바로 페이지 렌더링

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          통합 대시보드
        </h1>
        <p className="text-muted-foreground">
          오늘의 실적과 신규 접수 건을 확인하실 수 있습니다
        </p>
      </div>

      <AdminDashboardContent />
    </div>
  )
}

