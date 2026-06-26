import { getMonthlyStats, getMonthlyConfirmedStats } from '@/actions/stats-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { MonthlyTable } from '@/stats/components/stats/MonthlyTable'
import { MonthlyComparisonChart } from '@/stats/components/stats/MonthlyComparisonChart'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface MonthlyPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function MonthlyPage({ searchParams }: MonthlyPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [statsResult, prevStatsResult, callResult, confirmedResult] = await Promise.all([
    getMonthlyStats(year),
    getMonthlyStats(year - 1),
    getCallLogMonthlyCount(year),
    getMonthlyConfirmedStats(year),
  ])

  const stats = statsResult.success ? statsResult.stats ?? [] : []
  const prevStats = prevStatsResult.success ? prevStatsResult.stats ?? [] : []
  const callCenter = callResult.success ? callResult.monthly ?? [] : []
  const confirmed = confirmedResult.success ? confirmedResult.stats : []

  const confirmedTotal = confirmed.reduce((s, r) => s + r.total_cases, 0)
  const confirmedClients = confirmed.reduce((s, r) => s + r.total_clients, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 현황</h1>
        <YearSelector currentYear={year} />
      </div>

      {/* 확정 실적 요약 카드 */}
      <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">
          {year}년 확정 실적 (record_status = 완료)
        </p>
        {!confirmedResult.success && (
          <p className="text-xs text-red-500 mb-2">확정 실적을 불러오지 못했습니다.</p>
        )}
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {[
            { label: '합계건수', value: confirmedTotal },
            { label: '연인원',   value: confirmedClients },
            { label: '상담',     value: confirmed.reduce((s, r) => s + r.consult, 0) },
            { label: '평가',     value: confirmed.reduce((s, r) => s + r.assessment, 0) },
            { label: '체험',     value: confirmed.reduce((s, r) => s + r.trial, 0) },
            { label: '대여',     value: confirmed.reduce((s, r) => s + r.rental, 0) },
            { label: '맞춤제작', value: confirmed.reduce((s, r) => s + r.custom_make, 0) },
            { label: '교부평가', value: confirmed.reduce((s, r) => s + r.grant, 0) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-green-800">{value}</p>
              <p className="text-xs text-green-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <MonthlyComparisonChart
        currentYear={year}
        currentStats={stats}
        prevStats={prevStats}
      />
      {stats.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <MonthlyTable stats={stats} callCenter={callCenter} />
      )}
    </div>
  )
}
