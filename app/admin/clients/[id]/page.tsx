import { getClientById, getClientHistory } from "@/actions/client-actions"
import { ClientProfileCard } from "@/components/features/crm/ClientProfileCard"
import { ClientHistoryTable } from "@/components/features/crm/ClientHistoryTable"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  // 권한 확인
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    console.log("[대상자 상세] 권한 없음 - 홈으로 리다이렉트")
    redirect("/")
  }

  const { id } = await params

  // 대상자 정보 조회
  const clientResult = await getClientById(id)
  if (!clientResult.success || !clientResult.client) {
    notFound()
  }

  // 서비스 이력 조회
  const historyResult = await getClientHistory(id)
  const history = historyResult.success ? historyResult.history || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/clients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          대상자 상세 정보
        </h1>
        <p className="text-muted-foreground">
          {clientResult.client.name}님의 상세 정보 및 서비스 이용 이력
        </p>
      </div>

      <div className="space-y-6">
        <ClientProfileCard client={clientResult.client} />
        <ClientHistoryTable history={history} />
      </div>
    </div>
  )
}








