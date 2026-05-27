import { getAllNotices } from "@/actions/notice-actions"
import { NoticesManagementTabs } from "@/components/features/admin/notices/NoticesManagementTabs"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function AdminNoticesPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  const result = await getAllNotices()
  const notices = result.success ? result.notices || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">웹 관리</h1>
        <p className="text-muted-foreground">게시글을 카테고리별로 생성, 수정, 삭제할 수 있습니다</p>
      </div>
      <NoticesManagementTabs notices={notices} />
    </div>
  )
}
