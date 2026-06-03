import { HrStatsCharts } from '@/components/hr-stats/HrStatsCharts'
import { getHrStats } from '@/actions/hr-stats-actions'

export const dynamic = 'force-dynamic'

export default async function HrStatsPage() {
  const result = await getHrStats()

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{result.error}</p>
      </div>
    )
  }

  const { summary, headcountByDept, employmentTypes, monthlyTrend, tenureBuckets } = result.data

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR 통계·보고서</h1>
        <p className="text-sm text-gray-500 mt-1">인력 현황 분석 및 주요 지표</p>
      </div>

      <HrStatsCharts
        summary={summary}
        headcountByDept={headcountByDept}
        employmentTypes={employmentTypes}
        monthlyTrend={monthlyTrend}
        tenureBuckets={tenureBuckets}
      />
    </div>
  )
}
