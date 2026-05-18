import { getMonthlyStats } from '@/actions/stats-actions'
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

  const [statsResult, prevStatsResult, callResult] = await Promise.all([
    getMonthlyStats(year),
    getMonthlyStats(year - 1),
    getCallLogMonthlyCount(year),
  ])

  const stats = statsResult.success ? statsResult.stats ?? [] : []
  const prevStats = prevStatsResult.success ? prevStatsResult.stats ?? [] : []
  const callCenter = callResult.success ? callResult.monthly ?? [] : []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 현황</h1>
        <YearSelector currentYear={year} />
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
