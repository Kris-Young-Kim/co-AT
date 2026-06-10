import { getStatsSummary } from '@/actions/stats-actions'
import { getAnnualTarget } from '@/actions/annual-target-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { getSatisfactionSummary } from '@/actions/satisfaction-actions'
import { getIPPASummary } from '@/actions/ippa-stats-actions'
import { AchievementTable } from '@/stats/components/stats/AchievementTable'
import { EvalScoreWidget } from '@/stats/components/stats/EvalScoreWidget'
import { IPPAWidget } from '@/stats/components/stats/IPPAWidget'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import Link from 'next/link'

interface DashboardPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function StatsDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [summaryResult, targetResult, callResult, satisfactionResult, ippaResult] = await Promise.all([
    getStatsSummary(year),
    getAnnualTarget(year),
    getCallLogMonthlyCount(year),
    getSatisfactionSummary(year),
    getIPPASummary(year),
  ])

  const summary = summaryResult.success ? summaryResult.summary : null
  const target = targetResult.success ? targetResult.target ?? null : null
  const callTotal = callResult.success ? callResult.total ?? 0 : 0
  const satisfaction = satisfactionResult.success ? satisfactionResult.summary : null
  const ippaSummary = ippaResult.success ? ippaResult.summary : null
  const bs = summary?.businessSummary

  const actual = {
    consultation: bs?.consultation ?? 0,
    callCenter: callTotal,
    experience: bs?.experience ?? 0,
    rental: bs?.rental ?? 0,
    customMake: bs?.customMake ?? 0,
    assessment: bs?.assessment ?? 0,
    cleaning: bs?.cleaning ?? 0,
    repair: bs?.repair ?? 0,
    reuse: bs?.reuse ?? 0,
    professionalEdu: bs?.education ?? 0,
    promotion: 0,
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
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '총 서비스 기록', value: `${summary.totalRecords}건` },
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

          {/* Target vs actual + eval score */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">{year}년 목표 대비 실적</h2>
                <Link href={`/targets?year=${year}`} className="text-sm text-blue-600 hover:underline">
                  목표 수정
                </Link>
              </div>
              <AchievementTable target={target} actual={actual} />
            </div>

            {bs && (
              <EvalScoreWidget
                target={target}
                actuals={bs}
                callTotal={callTotal}
                year={year}
                satisfaction={satisfaction}
              />
            )}
          </div>

          {/* K-IPPA 기능성과 위젯 */}
          <IPPAWidget summary={ippaSummary} year={year} />
        </div>
      )}
    </div>
  )
}
