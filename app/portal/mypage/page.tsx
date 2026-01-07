import { ClientTimelineList } from "@/components/features/portal/ClientTimelineList"
import { ClientServiceHistory } from "@/components/features/portal/ClientServiceHistory"
import { getMyServiceHistory, getMyRentals, getMyCustomMakes, getMyReuseServices } from "@/actions/portal-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"

export default async function MyPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // 데이터 페칭
  const [historyResult, rentalsResult, customMakesResult, reuseServicesResult] = await Promise.all([
    getMyServiceHistory(),
    getMyRentals(),
    getMyCustomMakes(),
    getMyReuseServices(),
  ])

  const history = historyResult.success ? historyResult.history || [] : []
  const rentals = rentalsResult.success ? rentalsResult.rentals || [] : []
  const customMakes = customMakesResult.success ? customMakesResult.customMakes || [] : []
  const reuseServices = reuseServicesResult.success ? reuseServicesResult.reuseServices || [] : []

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <h1 className="text-responsive-xl font-bold text-foreground mb-2">
              마이페이지
            </h1>
            <p className="text-muted-foreground">
              서비스 신청 이력과 대여 중인 기기를 확인할 수 있습니다
            </p>
          </div>

          {/* 서비스 신청 이력 (전체 너비) */}
          <div className="mb-6">
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

          {/* 서비스 이력 (대여 + 맞춤제작 + 재사용 기기 지원) */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ClientServiceHistory 
                rentals={rentals} 
                customMakes={customMakes} 
                reuseServices={reuseServices}
              />
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
