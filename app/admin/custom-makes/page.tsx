import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { getCustomMakes } from "@/actions/custom-make-actions"
import { CustomMakeManagementContent } from "@/components/features/custom-make/CustomMakeManagementContent"

export default async function CustomMakesPage() {
  const isDevelopment = process.env.NODE_ENV !== "production"

  if (!isDevelopment) {
    try {
      const hasPermission = await hasAdminOrStaffPermission()
      if (!hasPermission) {
        console.log("[맞춤제작 관리] 권한 없음 - 홈으로 리다이렉트")
        redirect("/")
      }
      console.log("[맞춤제작 관리] 권한 확인 완료 - 페이지 렌더링")
    } catch (error) {
      console.error("[맞춤제작 관리] 권한 확인 중 오류:", error)
      redirect("/")
    }
  }

  // 초기 데이터 로드
  const result = await getCustomMakes({})

  const initialCustomMakes = result.success ? result.customMakes || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          맞춤제작 관리
        </h1>
        <p className="text-muted-foreground">
          3D프린터, CNC 등 장비를 활용한 맞춤제작 프로젝트 관리
        </p>
      </div>

      <CustomMakeManagementContent initialCustomMakes={initialCustomMakes} />
    </div>
  )
}
