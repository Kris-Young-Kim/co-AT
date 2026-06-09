import { listGrantAssessments } from '@/actions/grant-assessment-actions'

interface Props {
  searchParams: Promise<{ year?: string }>
}

const RESULT_COLORS: Record<string, string> = {
  '적합': 'bg-green-100 text-green-700',
  '부적합': 'bg-red-100 text-red-700',
  '조건부적합': 'bg-yellow-100 text-yellow-700',
  '보류': 'bg-gray-100 text-gray-600',
  '취소': 'bg-gray-100 text-gray-400',
}

export default async function GrantEvalStatisticsPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()

  const result = await listGrantAssessments({ year })
  const assessments = result.success ? result.assessments ?? [] : []

  const byResult = assessments.reduce<Record<string, number>>((acc, a) => {
    const key = a.final_result ?? '미결정'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const byOrg = assessments.reduce<Record<string, number>>((acc, a) => {
    const key = a.referral_org ?? '(미입력)'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const total = assessments.length
  const completed = assessments.filter((a) => a.status === 'completed').length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">교부사업 통계 — {year}년</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 평가', value: total, color: 'text-gray-900' },
          { label: '완료', value: completed, color: 'text-green-700' },
          { label: '적합', value: byResult['적합'] ?? 0, color: 'text-green-700' },
          { label: '부적합', value: byResult['부적합'] ?? 0, color: 'text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border rounded-lg p-5 bg-white">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-gray-800 mb-4">결과별 현황</h2>
          <div className="space-y-2">
            {Object.entries(byResult).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${RESULT_COLORS[k] ?? 'bg-gray-100 text-gray-600'}`}>{k}</span>
                <span className="text-sm font-semibold">{v}건</span>
              </div>
            ))}
            {Object.keys(byResult).length === 0 && (
              <p className="text-sm text-gray-400">데이터 없음</p>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-gray-800 mb-4">의뢰기관별 현황</h2>
          <div className="space-y-2">
            {Object.entries(byOrg).sort((a, b) => b[1] - a[1]).map(([org, count]) => (
              <div key={org} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{org}</span>
                <span className="text-sm font-semibold">{count}건</span>
              </div>
            ))}
            {Object.keys(byOrg).length === 0 && (
              <p className="text-sm text-gray-400">데이터 없음</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
