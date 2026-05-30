import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const PORTAL = {
  name: "공개 포털",
  description: "대민 서비스 웹사이트 — 센터 소개, 공지사항, 신청 접수",
  href: "https://gwatc.cloud",
}

const APPS = [
  {
    name: "상담·평가",
    description: "내담자 상담일지, 평가 기록 관리",
    href: "https://eval.gwatc.cloud",
    active: true,
  },
  {
    name: "자산·재고",
    description: "보조기기 재고 현황 및 대여 관리",
    href: "https://inventory.gwatc.cloud",
    active: true,
  },
  {
    name: "성과 대시보드",
    description: "업무 통계 및 성과 지표 조회",
    href: "https://stats.gwatc.cloud",
    active: true,
  },
  {
    name: "자동화·알림",
    description: "업무 자동화 및 알림 설정",
    href: "https://automation.gwatc.cloud",
    active: false,
  },
  {
    name: "인사관리",
    description: "직원 정보 및 근태 관리",
    href: "https://hr.gwatc.cloud",
    active: false,
  },
  {
    name: "전자결재",
    description: "기안·승인·결재 워크플로우",
    href: "https://approval.gwatc.cloud",
    active: false,
  },
  {
    name: "예산·재무",
    description: "예산 계획 및 재무 현황",
    href: "https://finance.gwatc.cloud",
    active: false,
  },
] as const

export default function AppLauncherPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">앱 목록</h1>
        <p className="text-muted-foreground mt-1">GWATC 업무 시스템 전체 앱에 접근합니다.</p>
      </div>

      {/* 공개 포털 히어로 카드 */}
      <div className="mb-8">
        <Link href={PORTAL.href} target="_blank" rel="noopener noreferrer">
          <Card className="hover:shadow-lg hover:border-primary/60 transition-all cursor-pointer group bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{PORTAL.name}</CardTitle>
                  <CardDescription className="mt-1.5 text-sm">{PORTAL.description}</CardDescription>
                </div>
                <ExternalLink className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors shrink-0" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">서비스 중</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.filter(a => a.active).map(app => (
            <Link key={app.name} href={app.href} target="_blank" rel="noopener noreferrer">
              <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  </div>
                  <CardDescription className="text-sm">{app.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">준비 중</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.filter(a => !a.active).map(app => (
            <Card key={app.name} className="h-full opacity-50 cursor-not-allowed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{app.name}</CardTitle>
                <CardDescription className="text-sm">{app.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
