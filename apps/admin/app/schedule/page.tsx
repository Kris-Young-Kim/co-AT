import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getSchedules } from "@/actions/schedule-actions"
import { ScheduleManagementContent } from "@/components/features/schedule/ScheduleManagementContent"

export default async function SchedulePage() {
  // 권한 확인
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[일정 관리] 권한 없음 - 홈으로 리다이렉트")
    redirect("/")
  }

  console.log("[일정 관리] 권한 확인 완료 - 페이지 렌더링")

  // 현재 월의 일정 조회
  const now = new Date()
  const result = await getSchedules(now.getFullYear(), now.getMonth() + 1)
  const initialSchedules = result.success ? result.data || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          일정 관리
        </h1>
        <p className="text-muted-foreground">
          방문, 상담, 평가, 배송, 픽업, 견학, 교육 일정을 등록하고 관리할 수 있습니다.
          견학 또는 교육 일정은 메인페이지 캘린더에 자동으로 표시됩니다.
        </p>
      </div>

      <ScheduleManagementContent initialSchedules={initialSchedules} />
    </div>
  )
}
