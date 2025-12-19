import { searchClients } from "@/actions/client-actions"
import { ClientTable } from "@/components/features/crm/ClientTable"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"

export default async function ClientsPage() {
  // 권한 확인
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[대상자 관리] 권한 없음 - 홈으로 리다이렉트")
    redirect("/")
  }

  // 초기 데이터 로드
  const result = await searchClients({ limit: 20 })
  const initialClients = result.success ? result.clients || [] : []
  const initialTotal = result.success ? result.total || 0 : 0

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          대상자 관리
        </h1>
        <p className="text-muted-foreground">
          대상자 정보를 검색하고 관리할 수 있습니다
        </p>
      </div>

      <ClientTable initialClients={initialClients} initialTotal={initialTotal} />
    </div>
  )
}







