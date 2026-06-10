import type { IPPASummary } from '@/actions/ippa-stats-actions'

interface IPPAWidgetProps {
  summary: IPPASummary | null
  year: number
}

export function IPPAWidget({ summary, year }: IPPAWidgetProps) {
  const hasData = summary && summary.total > 0
  const hasCompleted = summary && summary.completed > 0

  const outcomeColor =
    !hasCompleted || summary.avgOutcome === null
      ? 'text-gray-400'
      : summary.avgOutcome > 0
        ? 'text-green-600'
        : summary.avgOutcome < 0
          ? 'text-red-500'
          : 'text-gray-500'

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">{year}년 K-IPPA 기능성과</h2>
        <span className="text-xs text-gray-400">사전/사후 기능 측정 · 성과점수 = Σ(사전-사후)/n</span>
      </div>

      {!hasData ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          {year}년 K-IPPA 측정 데이터가 없습니다
        </p>
      ) : (
        <div className="space-y-5">
          {/* KPI 카드 4개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">전체 측정 건</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{summary.completed}</p>
              <p className="text-xs text-gray-500 mt-0.5">완료 (사전+사후)</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{summary.preOnly}</p>
              <p className="text-xs text-gray-500 mt-0.5">사전만 완료</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${outcomeColor}`}>
                {hasCompleted && summary.avgOutcome !== null
                  ? `${summary.avgOutcome > 0 ? '+' : ''}${summary.avgOutcome.toFixed(2)}`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">평균 성과점수</p>
            </div>
          </div>

          {/* 개선율 바 */}
          {hasCompleted && summary.improvedRate !== null && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="text-gray-600 font-medium">기능 개선율</span>
                <span className="font-semibold text-green-600">
                  {summary.improvedCount}명 / {summary.completed}명 ({summary.improvedRate}%)
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${summary.improvedRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                성과점수 양수(사전 &gt; 사후) = 기능 개선 · 값이 클수록 개선 효과 큼
              </p>
            </div>
          )}

          {/* 완료율 바 */}
          {summary.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="text-gray-600 font-medium">사후 측정 완료율</span>
                <span className="font-semibold text-blue-600">
                  {summary.completed}/{summary.total}건 (
                  {Math.round((summary.completed / summary.total) * 100)}%)
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.round((summary.completed / summary.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
