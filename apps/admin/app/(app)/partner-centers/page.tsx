import { listPartnerCenters } from "@/actions/partner-center-actions"
import { PartnerCenterManager } from "@/components/features/admin/partner-centers/PartnerCenterManager"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { redirect } from "next/navigation"

export default async function PartnerCentersPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect("/")

  const result = await listPartnerCenters()
  const centers = result.success ? result.centers ?? [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">협력기관 연락망</h1>
        <p className="text-muted-foreground">전국 보조기기센터 연락처 및 협력 정보를 관리합니다</p>
      </div>
      <PartnerCenterManager initialCenters={centers} />
    </div>
  )
}
