import { getAllNotices } from "@/actions/notice-actions"
import { listBanners } from "@/actions/banner-actions"
import { NoticesManagementTabs } from "@/components/features/admin/notices/NoticesManagementTabs"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function AdminNoticesPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  const [noticesResult, bannersResult] = await Promise.all([
    getAllNotices(),
    listBanners(),
  ])
  const notices = noticesResult.success ? noticesResult.notices || [] : []
  const banners = bannersResult.success ? bannersResult.banners ?? [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">웹 관리</h1>
        <p className="text-muted-foreground">공지사항·게시글·배너를 관리합니다</p>
      </div>
      <NoticesManagementTabs notices={notices} banners={banners} />
    </div>
  )
}
