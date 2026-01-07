import type { Metadata } from "next"

type HealthStatus = "ok" | "degraded" | "error"

type HealthResponse = {
  status: HealthStatus
  app: string
  db: { status: HealthStatus; latencyMs?: number; error?: string }
  auth: HealthStatus
  ai: HealthStatus
  version: string
  latencyMs: number
  timestamp: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://co-at-gw.vercel.app"

export const metadata: Metadata = {
  title: "서비스 상태",
  description: "헬스 체크 및 서비스 상태 페이지",
  openGraph: {
    title: "서비스 상태",
    description: "헬스 체크 및 서비스 상태 페이지",
    url: `${baseUrl}/status`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/status`,
  },
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  ok: "정상",
  degraded: "감소",
  error: "장애",
}

const STATUS_STYLE: Record<HealthStatus, string> = {
  ok: "text-green-600 border-green-200 bg-green-50",
  degraded: "text-amber-600 border-amber-200 bg-amber-50",
  error: "text-red-600 border-red-200 bg-red-50",
}

async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/health`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`헬스 체크 실패: ${res.status}`)
  }

  return res.json()
}

export default async function StatusPage() {
  const data = await getHealth()

  const items = [
    { label: "앱", value: "ok" as HealthStatus },
    { label: "데이터베이스", value: data.db.status },
    { label: "인증", value: data.auth },
    { label: "AI", value: data.ai },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-responsive-xl font-bold text-foreground mb-4">서비스 상태</h1>
      <p className="text-muted-foreground mb-8">현재 서비스와 주요 의존성 상태를 확인하세요.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border p-4 ${STATUS_STYLE[item.value]}`}
          >
            <p className="text-sm font-semibold mb-1">{item.label}</p>
            <p className="text-lg font-bold">{STATUS_LABEL[item.value]}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border p-4 bg-card">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>전체 상태: <span className={`font-semibold ${STATUS_STYLE[data.status].split(" ")[0]}`}>{STATUS_LABEL[data.status]}</span></span>
          <span>버전: {data.version}</span>
          <span>API 지연: {data.latencyMs}ms</span>
          <span>DB 지연: {data.db.latencyMs ?? "-"}ms</span>
          <span>갱신: {new Date(data.timestamp).toLocaleString()}</span>
        </div>
        {data.db.error && (
          <p className="mt-2 text-xs text-red-600">DB 오류: {data.db.error}</p>
        )}
      </div>
    </div>
  )
}
