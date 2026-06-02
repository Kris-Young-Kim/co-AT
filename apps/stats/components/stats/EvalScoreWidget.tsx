import type { AnnualTarget } from '@/actions/annual-target-actions'
import type { ServiceActuals } from '@/actions/stats-actions'

interface ScoreItem {
  label: string
  maxPts: number
  actual: number
  target: number | null
}

interface EvalScoreWidgetProps {
  target: AnnualTarget | null
  actuals: ServiceActuals
  callTotal: number
  year: number
}

function calcPts(actual: number, target: number | null, maxPts: number): number {
  if (!target || target === 0) return 0
  return Math.min(Math.round((actual / target) * maxPts * 10) / 10, maxPts)
}

export function EvalScoreWidget({ target, actuals, callTotal, year }: EvalScoreWidgetProps) {
  const items: ScoreItem[] = [
    { label: '보조기기 상담', maxPts: 3, actual: actuals.consultation, target: target?.consultation ?? null },
    { label: '콜센터', maxPts: 2, actual: callTotal, target: null },
    { label: '사용체험', maxPts: 3, actual: actuals.experience, target: target?.experience ?? null },
    { label: '대여', maxPts: 8, actual: actuals.rental, target: target?.rental ?? null },
    { label: '맞춤 제작 지원', maxPts: 8, actual: actuals.customMake, target: target?.custom_make ?? null },
    { label: '교부사업 맞춤형 평가', maxPts: 2, actual: actuals.assessment, target: null },
    { label: '소독 및 세척', maxPts: 2, actual: actuals.cleaning, target: target?.cleaning ?? null },
    { label: '점검 및 수리', maxPts: 2, actual: actuals.repair, target: target?.repair ?? null },
    { label: '재사용 지원', maxPts: 2, actual: actuals.reuse, target: target?.reuse ?? null },
    { label: '교육', maxPts: 3, actual: actuals.education, target: target?.professional_edu ?? null },
    { label: '홍보', maxPts: 3, actual: 0, target: target?.promotion ?? null },
  ]

  const performanceScore = items.reduce((sum, item) => {
    if (item.target === null) {
      // 상시 항목 — 실적 > 0이면 만점 처리
      return sum + (item.actual > 0 ? item.maxPts : 0)
    }
    return sum + calcPts(item.actual, item.target, item.maxPts)
  }, 0)
  const performanceMax = 40

  // 사업운영관리, 서비스효과성은 자동 산정 불가 → 표시만
  const managementMax = 15
  const effectivenessMax = 5
  const quantitativeMax = 60

  const pct = Math.round((performanceScore / performanceMax) * 100)
  const scoreColor = pct >= 90 ? 'text-green-600' : pct >= 70 ? 'text-blue-600' : 'text-amber-600'

  return (
    <div className="bg-white border rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{year}년 정량평가 예상 점수</h2>
        <span className="text-xs text-gray-400">첨부17 기준 · 60점 만점</span>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className={`text-2xl font-bold ${scoreColor}`}>{performanceScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-0.5">사업수행실적 /{performanceMax}점</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">—</p>
          <p className="text-xs text-gray-500 mt-0.5">사업운영관리 /{managementMax}점</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">—</p>
          <p className="text-xs text-gray-500 mt-0.5">서비스효과성 /{effectivenessMax}점</p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        정량평가 합계 {quantitativeMax}점 중 자동 산정 가능: 사업수행실적 {performanceMax}점
        (운영관리·효과성은 외부 평가 항목)
      </p>

      {/* Per-item breakdown */}
      <div className="space-y-1.5">
        {items.map(item => {
          const earned = item.target === null
            ? (item.actual > 0 ? item.maxPts : 0)
            : calcPts(item.actual, item.target, item.maxPts)
          const isAlways = item.target === null
          const barPct = item.maxPts > 0 ? Math.min((earned / item.maxPts) * 100, 100) : 0
          return (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span className="w-32 shrink-0 text-gray-700 text-xs">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barPct >= 100 ? 'bg-green-500' : barPct >= 70 ? 'bg-blue-500' : 'bg-amber-400'}`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs text-gray-500">
                {isAlways
                  ? (item.actual > 0 ? `${earned}/${item.maxPts}pt` : `0/${item.maxPts}pt`)
                  : `${earned.toFixed(1)}/${item.maxPts}pt`}
              </span>
              <span className="w-20 text-right text-xs text-gray-400">
                {isAlways ? '상시' : item.target ? `${item.actual}/${item.target}건` : '목표미설정'}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-2 border-t text-sm font-semibold">
        <span className="text-gray-700">사업수행실적 소계</span>
        <span className={scoreColor}>{performanceScore.toFixed(1)} / {performanceMax}점 ({pct}%)</span>
      </div>
    </div>
  )
}
