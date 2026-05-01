import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { StatsDashboardContent } from "@/components/features/dashboard/StatsDashboardContent"

export default async function StatsPage() {
  // 권한 확인
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          통계 대시보드
        </h1>
        <p className="text-muted-foreground">
          5대 핵심 사업 실적을 한눈에 파악하고, 지자체 예산 확보 자료로 활용하세요
        </p>
      </div>

      <StatsDashboardContent />
    </div>
  )
}
