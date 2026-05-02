import { getYearlyStats } from '@/actions/stats-actions'
import { YearlyTable } from '@/stats/components/stats/YearlyTable'

export default async function YearlyPage() {
  const thisYear = new Date().getFullYear()
  const result = await getYearlyStats(2023, thisYear)
  const stats = result.success ? result.stats ?? [] : []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">연도별 추이</h1>
      {stats.length === 0 ? (
        <p className="text-gray-500">데이터가 없습니다.</p>
      ) : (
        <YearlyTable stats={stats} />
      )}
    </div>
  )
}
