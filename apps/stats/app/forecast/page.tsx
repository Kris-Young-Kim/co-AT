import { getForecastData } from '@/actions/forecast-actions'
import { ForecastChart } from '@/stats/components/stats/ForecastChart'
import { TrendingUp, Info } from 'lucide-react'

export default async function ForecastPage() {
  const result = await getForecastData()

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">데이터 로드 실패: {result.error}</p>
      </div>
    )
  }

  const { history, forecast } = result.data

  const lastMonth = history[history.length - 1]
  const nextMonth = forecast[0]
  const rentalTrend = nextMonth && lastMonth ? nextMonth.rental - lastMonth.rental : 0
  const repairTrend = nextMonth && lastMonth ? nextMonth.repair - lastMonth.repair : 0

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          수요 예측
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          최근 12개월 실적 기반 선형 추세 예측 — 대여 · 수리 수요
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">다음 달 대여 예측</p>
          <p className="text-2xl font-bold text-gray-900">{nextMonth?.rental ?? '—'}건</p>
          {rentalTrend !== 0 && (
            <p className={`text-xs mt-1 ${rentalTrend > 0 ? 'text-red-500' : 'text-blue-500'}`}>
              이번 달 대비 {rentalTrend > 0 ? '+' : ''}{rentalTrend}건
            </p>
          )}
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-500 mb-1">다음 달 수리 예측</p>
          <p className="text-2xl font-bold text-gray-900">{nextMonth?.repair ?? '—'}건</p>
          {repairTrend !== 0 && (
            <p className={`text-xs mt-1 ${repairTrend > 0 ? 'text-red-500' : 'text-blue-500'}`}>
              이번 달 대비 {repairTrend > 0 ? '+' : ''}{repairTrend}건
            </p>
          )}
        </div>
      </div>

      {/* 차트 */}
      <div className="grid gap-4">
        <ForecastChart
          history={history}
          forecast={forecast}
          title="대여 수요 (실적 + 3개월 예측)"
          dataKey="rental"
          color="#3b82f6"
        />
        <ForecastChart
          history={history}
          forecast={forecast}
          title="수리·점검 수요 (실적 + 3개월 예측)"
          dataKey="repair"
          color="#f59e0b"
        />
      </div>

      <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-gray-50 border text-xs text-gray-500">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          선형 회귀(최소제곱법) 기반 단순 추세 예측입니다. 계절성·이벤트 영향은 반영되지 않습니다.
          데이터가 12개월 미만이면 정확도가 낮을 수 있습니다.
        </span>
      </div>
    </div>
  )
}
