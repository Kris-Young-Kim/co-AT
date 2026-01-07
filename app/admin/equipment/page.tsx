import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getEquipment } from "@/actions/custom-make-actions"
import { EquipmentManager } from "@/components/features/custom-make/EquipmentManager"

export default async function EquipmentPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[장비 관리] 권한 없음 - 홈으로 리다이렉트")
        redirect("/")
      }
      console.log("[장비 관리] 권한 확인 완료 - 페이지 렌더링")
    } catch (error) {
      console.error("[장비 관리] 권한 확인 중 오류:", error)
      redirect("/")
    }
  }

  // 초기 데이터 로드
  const result = await getEquipment({})

  const initialEquipment = result.success ? result.equipment || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          장비 관리
        </h1>
        <p className="text-muted-foreground">
          3D프린터, CNC 등 제작 장비를 관리합니다
        </p>
      </div>

      <EquipmentManager initialEquipment={initialEquipment} />
    </div>
  )
}
