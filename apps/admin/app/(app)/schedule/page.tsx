export const dynamic = 'force-dynamic'

import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"
import { getSchedules } from "@/actions/schedule-actions"
import { getScheduleCategories } from "@/actions/schedule-category-actions"
import { ScheduleManagementContent } from "@/components/features/schedule/ScheduleManagementContent"

export default async function SchedulePage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  const now = new Date()
  const [result, categories] = await Promise.all([
    getSchedules(now.getFullYear(), now.getMonth() + 1),
    getScheduleCategories(),
  ])
  const initialSchedules = result.success ? result.data || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          일정 관리
        </h1>
        <p className="text-muted-foreground">
          방문, 상담, 평가, 배송, 수거, 견학, 교육 일정을 등록하고 관리할 수 있습니다.
          카테고리를 설정하면 캘린더에 색상으로 구분되어 표시됩니다.
        </p>
      </div>

      <ScheduleManagementContent
        initialSchedules={initialSchedules}
        initialCategories={categories}
      />
    </div>
  )
}
