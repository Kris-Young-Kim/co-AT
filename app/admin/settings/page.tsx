import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Bell, Shield, Database, MessageSquare } from "lucide-react"
import { RegulationEmbedButton } from "@/components/features/chat/RegulationEmbedButton"

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          설정
        </h1>
        <p className="text-muted-foreground">
          시스템 설정 및 환경 구성을 관리할 수 있습니다
        </p>
      </div>

      <div className="space-y-6">
        {/* 프로필 설정 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>프로필 설정</CardTitle>
            </div>
            <CardDescription>
              사용자 프로필 정보를 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="이름을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="이메일을 입력하세요" />
            </div>
            <Button>저장</Button>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <CardDescription>
              알림 수신 방식을 설정합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>이메일 알림</Label>
                <p className="text-sm text-muted-foreground">
                  이메일로 알림을 받습니다
                </p>
              </div>
              <Button variant="outline" size="sm">
                활성화
              </Button>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>푸시 알림</Label>
                <p className="text-sm text-muted-foreground">
                  브라우저 푸시 알림을 받습니다
                </p>
              </div>
              <Button variant="outline" size="sm">
                비활성화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>보안 설정</CardTitle>
            </div>
            <CardDescription>
              계정 보안을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" placeholder="현재 비밀번호" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" placeholder="새 비밀번호" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input id="confirm-password" type="password" placeholder="비밀번호 확인" />
            </div>
            <Button>비밀번호 변경</Button>
          </CardContent>
        </Card>

        {/* 규정 챗봇 데이터 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>규정 챗봇 데이터</CardTitle>
            </div>
            <CardDescription>
              보조기기센터 운영 지침서를 벡터화하여 챗봇이 검색할 수 있게 합니다.
              챗봇에서 &quot;저장된 규정이 없습니다&quot;가 뜨면 아래 버튼을 실행하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegulationEmbedButton />
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>시스템 정보</CardTitle>
            </div>
            <CardDescription>
              시스템 상태 및 버전 정보를 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">플랫폼 버전</span>
              <span className="text-sm text-muted-foreground">v1.0.0</span>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">데이터베이스 상태</span>
              <span className="text-sm text-green-600">정상</span>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">마지막 백업</span>
              <span className="text-sm text-muted-foreground">2025-01-06 12:00:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

