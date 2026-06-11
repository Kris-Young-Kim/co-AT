import { ClientRentStatus } from "@/components/features/portal/ClientRentStatus"
import { EvalServiceRecordList } from "@/components/features/portal/EvalServiceRecordList"
import { ClientTimelineList } from "@/components/features/portal/ClientTimelineList"
import { getMyRentals, getMyEvalServiceRecords, getMyServiceHistory } from "@/actions/portal-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Info } from "lucide-react"

export default async function MyPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const [rentalsResult, evalRecordsResult, historyResult] = await Promise.all([
    getMyRentals(),
    getMyEvalServiceRecords(),
    getMyServiceHistory(),
  ])

  const rentals = rentalsResult.success ? rentalsResult.rentals ?? [] : []
  const evalRecords = evalRecordsResult.success ? evalRecordsResult.records ?? [] : []
  const history = historyResult.success ? historyResult.history ?? [] : []
  const clientLinked = rentalsResult.clientLinked ?? evalRecordsResult.clientLinked ?? false

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">마이페이지</h1>
        <p className="text-muted-foreground">
          서비스 신청 이력과 대여 중인 기기를 확인할 수 있습니다
        </p>
      </div>

      {!clientLinked && (
        <div className="flex items-start gap-3 p-4 mb-6 rounded-lg border bg-muted/50">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            포털 계정이 아직 연결되지 않았습니다. 담당자에게 포털 연결을 요청해 주세요.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 좌측: 대여 중인 기기 */}
        <div className="lg:col-span-1 space-y-6">
          <ClientRentStatus rentals={rentals} />
          <EvalServiceRecordList records={evalRecords} />
        </div>

        {/* 우측: 신청 이력 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>서비스 신청 이력</CardTitle>
                <Button asChild size="sm">
                  <Link href="/apply">
                    <Plus className="mr-2 h-4 w-4" />
                    새 신청
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ClientTimelineList history={history} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
