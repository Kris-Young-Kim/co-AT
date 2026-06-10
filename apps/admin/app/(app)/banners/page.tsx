import { listBanners } from "@/actions/banner-actions"
import { BannerManager } from "@/components/features/admin/banners/BannerManager"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function BannersPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await listBanners()
  const banners = result.success ? result.banners ?? [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">배너 관리</h1>
        <p className="text-muted-foreground">웹 메인 페이지에 노출되는 팝업 배너를 관리합니다</p>
      </div>
      <BannerManager initialBanners={banners} />
    </div>
  )
}
