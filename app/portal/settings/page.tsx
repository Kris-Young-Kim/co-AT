import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { PortalHeader } from "@/components/layout/portal-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <PortalHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <h1 className="text-responsive-xl font-bold text-foreground mb-2">
              설정
            </h1>
            <p className="text-muted-foreground">
              알림 및 계정 설정을 관리할 수 있습니다
            </p>
          </div>

          <div className="space-y-6 max-w-2xl">
            {/* 알림 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>
                  받고 싶은 알림을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="email-notifications" className="text-base">
                      이메일 알림
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      신청 상태 변경 및 중요 공지사항을 이메일로 받습니다
                    </p>
                  </div>
                  <Checkbox id="email-notifications" defaultChecked className="ml-4" />
                </div>

                <hr className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="sms-notifications" className="text-base">
                      SMS 알림
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      긴급한 알림을 문자 메시지로 받습니다
                    </p>
                  </div>
                  <Checkbox id="sms-notifications" className="ml-4" />
                </div>

                <hr className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="application-updates" className="text-base">
                      신청 상태 업데이트
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      서비스 신청 상태 변경 시 알림을 받습니다
                    </p>
                  </div>
                  <Checkbox id="application-updates" defaultChecked className="ml-4" />
                </div>

                <hr className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="schedule-reminders" className="text-base">
                      일정 알림
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      예정된 일정 전에 알림을 받습니다
                    </p>
                  </div>
                  <Checkbox id="schedule-reminders" defaultChecked className="ml-4" />
                </div>

                <hr className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor="notice-alerts" className="text-base">
                      공지사항 알림
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      새로운 공지사항이 등록되면 알림을 받습니다
                    </p>
                  </div>
                  <Checkbox id="notice-alerts" defaultChecked className="ml-4" />
                </div>
              </CardContent>
            </Card>

            {/* 계정 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>계정 설정</CardTitle>
                <CardDescription>
                  계정 정보를 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <p className="text-sm text-muted-foreground">
                    계정 이메일은 Clerk에서 관리됩니다
                  </p>
                </div>
                <hr className="my-4" />
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <p className="text-sm text-muted-foreground">
                    서비스 신청 시 입력한 연락처가 사용됩니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
