import {
  getGrantEvalSummary,
  getGrantEvalStatsByOrg,
  getGrantEvalStatsByMonth,
} from '@/actions/grant-eval-stats-actions'
import { GrantEvalMonthlyChart } from '@/stats/components/grant-eval/GrantEvalMonthlyChart'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function GrantEvalStatsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [summaryResult, orgResult, monthResult] = await Promise.all([
    getGrantEvalSummary(year),
    getGrantEvalStatsByOrg(year),
    getGrantEvalStatsByMonth(year),
  ])

  const summary = summaryResult.success ? summaryResult.summary : null
  const orgStats = orgResult.success ? orgResult.stats ?? [] : []
  const monthStats = monthResult.success ? monthResult.stats ?? [] : []

  const orgTotal = {
    org: '합계',
    total: orgStats.reduce((s, r) => s + r.total, 0),
    approved: orgStats.reduce((s, r) => s + r.approved, 0),
    rejected: orgStats.reduce((s, r) => s + r.rejected, 0),
    conditional: orgStats.reduce((s, r) => s + r.conditional, 0),
    pending: orgStats.reduce((s, r) => s + r.pending, 0),
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">교부사업 평가 통계</h1>
        <YearSelector currentYear={year} />
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '총 평가 건수', value: `${summary.total}건`, color: 'text-gray-900' },
            { label: '적합', value: `${summary.approved}건`, color: 'text-green-700' },
            { label: '부적합', value: `${summary.rejected}건`, color: 'text-red-700' },
            { label: '조건부적합', value: `${summary.conditional}건`, color: 'text-yellow-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="border rounded-lg p-5 bg-white">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 월별 차트 */}
      <GrantEvalMonthlyChart stats={monthStats} year={year} />

      {/* 의뢰기관별 테이블 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">의뢰기관(시군)별 현황</h2>
        </div>
        {orgStats.length === 0 ? (
          <p className="px-5 py-8 text-center text-gray-400 text-sm">{year}년 데이터가 없습니다</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">의뢰기관</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">전체</th>
                <th className="px-4 py-3 text-center font-medium text-green-700">적합</th>
                <th className="px-4 py-3 text-center font-medium text-red-700">부적합</th>
                <th className="px-4 py-3 text-center font-medium text-yellow-700">조건부적합</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">보류·미결정</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orgStats.map((row) => (
                <tr key={row.org} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.org}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                  <td className="px-4 py-3 text-center text-green-700">{row.approved || '—'}</td>
                  <td className="px-4 py-3 text-center text-red-700">{row.rejected || '—'}</td>
                  <td className="px-4 py-3 text-center text-yellow-700">{row.conditional || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.pending || '—'}</td>
                </tr>
              ))}
              {/* 합계 행 */}
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td className="px-4 py-3 text-gray-700">합계</td>
                <td className="px-4 py-3 text-center">{orgTotal.total}</td>
                <td className="px-4 py-3 text-center text-green-700">{orgTotal.approved || '—'}</td>
                <td className="px-4 py-3 text-center text-red-700">{orgTotal.rejected || '—'}</td>
                <td className="px-4 py-3 text-center text-yellow-700">{orgTotal.conditional || '—'}</td>
                <td className="px-4 py-3 text-center text-gray-500">{orgTotal.pending || '—'}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
