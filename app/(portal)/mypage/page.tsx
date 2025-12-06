import { ClientTimelineList } from "@/components/features/portal/ClientTimelineList"
import { ClientRentStatus } from "@/components/features/portal/ClientRentStatus"
import { getMyApplications, getMyRentals } from "@/actions/portal-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function MyPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // 데이터 페칭
  const [historyResult, rentalsResult] = await Promise.all([
    getMyServiceHistory(),
    getMyRentals(),
  ])

  const history = historyResult.success ? historyResult.history || [] : []
  const rentals = rentalsResult.success ? rentalsResult.rentals || [] : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          마이페이지
        </h1>
        <p className="text-muted-foreground">
          서비스 신청 이력과 대여 중인 기기를 확인할 수 있습니다
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 좌측: 대여 중인 기기 */}
        <div className="lg:col-span-1">
          <ClientRentStatus rentals={rentals} />
        </div>

        {/* 우측: 신청 이력 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>서비스 신청 이력</CardTitle>
                <Button asChild size="sm">
                  <Link href="/portal/apply">
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
