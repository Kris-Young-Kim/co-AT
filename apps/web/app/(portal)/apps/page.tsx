import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  Package,
  BarChart3,
  Zap,
  Users,
  FileCheck,
  Wallet,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type AppKey = 'eval' | 'inventory' | 'stats' | 'automation' | 'hr' | 'approval' | 'finance'

interface AppConfig {
  key: AppKey
  name: string
  description: string
  href: string
  icon: LucideIcon
}

const APPS: AppConfig[] = [
  {
    key: 'eval',
    name: '상담·평가',
    description: '내담자 상담일지, 교부사업 평가, 케이스 관리',
    href: 'https://eval.gwatc.cloud',
    icon: ClipboardList,
  },
  {
    key: 'inventory',
    name: '자산·재고',
    description: '보조기기 재고 현황, 대여 관리, QR 스캔',
    href: 'https://inventory.gwatc.cloud',
    icon: Package,
  },
  {
    key: 'stats',
    name: '성과 대시보드',
    description: '사업별 실적, 목표 대비 현황, 예측 분석',
    href: 'https://stats.gwatc.cloud',
    icon: BarChart3,
  },
  {
    key: 'automation',
    name: '업무 자동화',
    description: '알림 채널 관리, 자동 발송 설정',
    href: 'https://automation.gwatc.cloud',
    icon: Zap,
  },
  {
    key: 'hr',
    name: '인사 관리',
    description: '직원 정보, 근태, 급여, 인사 평가',
    href: 'https://hr.gwatc.cloud',
    icon: Users,
  },
  {
    key: 'approval',
    name: '전자결재',
    description: '기안, 승인, 결재 워크플로우',
    href: 'https://approval.gwatc.cloud',
    icon: FileCheck,
  },
  {
    key: 'finance',
    name: '예산·재무',
    description: '예산 계획, 지출 기록, 재무 현황',
    href: 'https://finance.gwatc.cloud',
    icon: Wallet,
  },
]

export const metadata = {
  title: 'GWATC — 업무 앱',
}

export default async function AppsPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // sessionClaims.metadata may be stale up to Clerk JWT TTL (~1 min).
  // Acceptable here since actual data access is re-validated on each subdomain app.
  const meta = sessionClaims?.metadata as { role?: string; apps?: string[] } | undefined
  const role = meta?.role ?? ''
  const userApps = meta?.apps ?? []

  if (!role || role === 'user') {
    redirect('/mypage')
  }

  const isAdmin = role === 'admin'
  const accessibleApps = APPS.filter(app =>
    isAdmin || userApps.includes(app.key)
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">업무 앱</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? '관리자 권한으로 모든 앱에 접근할 수 있습니다.'
            : `접근 가능한 앱 ${accessibleApps.length}개`}
        </p>
      </div>

      {accessibleApps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            접근 가능한 앱이 없습니다.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            관리자에게 앱 접근 권한 부여를 요청해 주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleApps.map(app => {
            const Icon = app.icon
            return (
              <Link
                key={app.key}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
