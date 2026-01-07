import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getRentals, getOverdueRentals, getExpiringRentals } from "@/actions/rental-actions"
import { RentalManagementContent } from "@/components/features/inventory/RentalManagementContent"

export default async function RentalsPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[대여 관리] 권한 없음 - 홈으로 리다이렉트")
        redirect("/")
      }
      console.log("[대여 관리] 권한 확인 완료 - 페이지 렌더링")
    } catch (error) {
      console.error("[대여 관리] 권한 확인 중 오류:", error)
      redirect("/")
    }
  }

  // 초기 데이터 로드
  const [rentalsResult, overdueResult, expiringResult] = await Promise.all([
    getRentals({}),
    getOverdueRentals(),
    getExpiringRentals(7),
  ])

  const initialRentals = rentalsResult.success ? rentalsResult.rentals || [] : []
  const initialOverdue = overdueResult.success ? overdueResult.rentals || [] : []
  const initialExpiring = expiringResult.success ? expiringResult.rentals || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          대여 관리
        </h1>
        <p className="text-muted-foreground">
          보조기기 대여 승인, 반납 처리 및 기간 연장 관리
        </p>
      </div>

      <RentalManagementContent
        initialRentals={initialRentals}
        initialOverdue={initialOverdue}
        initialExpiring={initialExpiring}
      />
    </div>
  )
}
