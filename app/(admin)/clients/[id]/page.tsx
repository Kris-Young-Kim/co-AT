import { getClientById, getClientHistory } from "@/actions/client-actions"
import { ClientProfileCard } from "@/components/features/crm/ClientProfileCard"
import { ClientHistoryTable } from "@/components/features/crm/ClientHistoryTable"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import dynamic from "next/dynamic"

// 코드 스플리팅: 큰 폼 컴포넌트는 탭 활성화 시에만 로드
// Server Component에서는 ssr: false를 사용할 수 없으므로 제거
const IntakeRecordFormV2 = dynamic(
  () => import("@/components/features/intake/IntakeRecordFormV2").then((mod) => ({ default: mod.IntakeRecordFormV2 })),
  {
    loading: () => <div className="py-8 text-center text-muted-foreground">상담 기록 폼 로딩 중...</div>,
  }
)

const DomainAssessmentFormV2 = dynamic(
  () => import("@/components/features/assessment/DomainAssessmentFormV2").then((mod) => ({ default: mod.DomainAssessmentFormV2 })),
  {
    loading: () => <div className="py-8 text-center text-muted-foreground">평가 폼 로딩 중...</div>,
  }
)

const ServiceProgressDashboard = dynamic(
  () => import("@/components/features/process/ServiceProgressDashboard").then((mod) => ({ default: mod.ServiceProgressDashboard })),
  {
    loading: () => <div className="py-8 text-center text-muted-foreground">서비스 진행 기록 로딩 중...</div>,
  }
)

const SoapNoteEditor = dynamic(
  () => import("@/components/features/soap-note/SoapNoteEditor").then((mod) => ({ default: mod.SoapNoteEditor })),
  {
    loading: () => <div className="py-8 text-center text-muted-foreground">SOAP 노트 에디터 로딩 중...</div>,
  }
)

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
          <Link href="/clients">
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">기본 정보</TabsTrigger>
          <TabsTrigger value="history">서비스 이력</TabsTrigger>
          <TabsTrigger value="intake">상담 기록</TabsTrigger>
          <TabsTrigger value="soap">SOAP 노트</TabsTrigger>
          <TabsTrigger value="assessment">평가</TabsTrigger>
          <TabsTrigger value="process">서비스 진행 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ClientProfileCard client={clientResult.client} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ClientHistoryTable history={history} />
        </TabsContent>

        <TabsContent value="intake" className="space-y-6">
          <IntakeRecordFormV2
            clientId={id}
            applicationId={undefined}
            onSuccess={() => {
              // 성공 시 처리 (예: 페이지 새로고침)
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="soap" className="space-y-6">
          <SoapNoteEditor />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <DomainAssessmentFormV2
            clientId={id}
            applicationId={undefined}
            onSuccess={() => {
              // 성공 시 처리 (예: 페이지 새로고침)
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <ServiceProgressDashboard
            clientId={id}
            applicationId={undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
