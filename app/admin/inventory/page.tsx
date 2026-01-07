import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getInventoryList } from "@/actions/inventory-actions"
import { InventoryManagementContent } from "@/components/features/inventory/InventoryManagementContent"

export default async function InventoryPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[재고 관리] 권한 없음 - 홈으로 리다이렉트")
        redirect("/")
      }
      console.log("[재고 관리] 권한 확인 완료 - 페이지 렌더링")
    } catch (error) {
      console.error("[재고 관리] 권한 확인 중 오류:", error)
      redirect("/")
    }
  }

  // 초기 재고 목록 조회
  const initialInventory = await getInventoryList({})

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          재고 관리
        </h1>
        <p className="text-muted-foreground">
          대여, 재사용, 맞춤제작 지원 물품 등록 및 불출 관리
        </p>
      </div>

      <InventoryManagementContent initialInventory={initialInventory} />
    </div>
  )
}
