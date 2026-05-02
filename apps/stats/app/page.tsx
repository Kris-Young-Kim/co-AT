import { getStatsSummary } from '@/actions/stats-actions'
import { getAnnualTarget } from '@/actions/annual-target-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { AchievementTable } from '@/stats/components/stats/AchievementTable'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import Link from 'next/link'

interface DashboardPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function StatsDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const [summaryResult, targetResult, callResult] = await Promise.all([
    getStatsSummary(startDate, endDate),
    getAnnualTarget(year),
    getCallLogMonthlyCount(year),
  ])

  const summary = summaryResult.success ? summaryResult.summary : null
  const target = targetResult.success ? targetResult.target ?? null : null
  const callTotal = callResult.success ? callResult.total ?? 0 : 0
  const bs = summary?.businessSummary

  const actual = {
    consultation: bs?.consultation ?? 0,
    callCenter: callTotal,
    experience: bs?.experience ?? 0,
    rental: bs?.custom ?? 0,
    customMake: bs?.custom ?? 0,
    assessment: 0,
    cleaning: bs?.aftercare ?? 0,
    repair: bs?.aftercare ?? 0,
    reuse: bs?.aftercare ?? 0,
    professionalEdu: bs?.education ?? 0,
    promotion: bs?.education ?? 0,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">KPI 대시보드</h1>
        <div className="flex items-center gap-3">
          <YearSelector currentYear={year} />
          <Link
            href={`/export?year=${year}`}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
          >
            Excel 내보내기
          </Link>
        </div>
      </div>

      {!summary ? (
        <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '총 서비스', value: `${summary.totalApplications}건` },
              { label: '총 대상자', value: `${summary.totalClients}명` },
              { label: '완료율', value: `${summary.completionRate.toFixed(1)}%` },
              { label: '콜센터', value: `${callTotal}건` },
            ].map(({ label, value }) => (
              <div key={label} className="border rounded-lg p-5 bg-white">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* 목표 vs 실적 */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{year}년 목표 대비 실적</h2>
              <Link href={`/targets?year=${year}`} className="text-sm text-blue-600 hover:underline">
                목표 수정
              </Link>
            </div>
            <AchievementTable target={target} actual={actual} />
          </div>
        </div>
      )}
    </div>
  )
}
