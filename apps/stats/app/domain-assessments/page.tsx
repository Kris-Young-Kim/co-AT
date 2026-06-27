import {
  getDomainAssessmentSummary,
  getDomainCountStats,
  getMonthlyDomainStats,
  getTopClientsByDomainCount,
} from '@/actions/domain-assessment-stats-actions'
import { DomainDistributionChart } from '@/stats/components/domain-assessments/DomainDistributionChart'
import { MonthlyDomainChart } from '@/stats/components/domain-assessments/MonthlyDomainChart'

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어 및 이동',
  ADL: '일상생활동작',
  S: '감각',
  SP: '앉기 및 자세',
  EC: '주택 및 환경개조',
  CA: '컴퓨터접근',
  L: '레저',
  AAC: '보완대체의사소통',
  AM: '자동차개조',
}

export default async function DomainAssessmentStatsPage() {
  const [summaryRes, countRes, monthlyRes, topClientsRes] = await Promise.all([
    getDomainAssessmentSummary(),
    getDomainCountStats(),
    getMonthlyDomainStats(12),
    getTopClientsByDomainCount(10),
  ])

  const summary = summaryRes.summary
  const countStats = countRes.stats ?? []
  const monthlyStats = monthlyRes.stats ?? []
  const topClients = topClientsRes.clients ?? []

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">영역별 평가 통계</h1>
        <p className="text-sm text-gray-500 mt-0.5">9개 영역 평가 도구 활용 현황</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">총 평가 건수</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total.toLocaleString()}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">이번 달 평가</p>
            <p className="text-2xl font-bold text-blue-600">{summary.thisMonth}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">가장 많은 영역</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.topDomain ? `(${summary.topDomain})` : '—'}
            </p>
            {summary.topDomain && (
              <p className="text-xs text-gray-400 mt-0.5">{DOMAIN_LABELS[summary.topDomain] ?? ''}</p>
            )}
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">평가 대상자 수</p>
            <p className="text-2xl font-bold text-gray-900">{summary.uniqueClients}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {countStats.length > 0 && <DomainDistributionChart stats={countStats} />}
        {monthlyStats.length > 0 && <MonthlyDomainChart stats={monthlyStats} />}
      </div>

      {/* Top clients table */}
      {topClients.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">평가 영역이 많은 대상자</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="px-5 py-2 text-left font-medium">대상자</th>
                <th className="px-5 py-2 text-left font-medium">생년월일</th>
                <th className="px-5 py-2 text-left font-medium">완료 영역</th>
                <th className="px-5 py-2 text-right font-medium">영역 수</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topClients.map(c => (
                <tr key={c.client_id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium text-gray-900">{c.client_name}</td>
                  <td className="px-5 py-2.5 text-gray-500">{c.birth_date ?? '—'}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {c.domains.map(d => (
                        <span key={d} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold text-blue-700">
                    {c.domain_count} / 9
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topClients.length === 0 && countStats.every(s => s.count === 0) && (
        <div className="text-center py-16 text-gray-400 border rounded-lg bg-gray-50">
          <p className="text-sm">영역 평가 데이터가 없습니다</p>
          <p className="text-xs mt-1">대상자 페이지에서 상담 및 평가 세션을 시작하세요</p>
        </div>
      )}
    </div>
  )
}
