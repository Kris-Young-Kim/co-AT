import { getPromotionActivities, getPromotionMonthly } from '@/stats/actions/promotion-actions'
import { PromotionRecordList } from '@/stats/components/promotion/PromotionRecordList'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface PromotionPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function PromotionPage({ searchParams }: PromotionPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [activities, monthly] = await Promise.all([
    getPromotionActivities(year),
    getPromotionMonthly(year),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">홍보 실적 입력</h1>
          <p className="text-sm text-gray-500 mt-1">홍보 활동 목록(Sheet 4)과 매체 운영 기록(Sheet 4-1)을 입력합니다.</p>
        </div>
        <YearSelector currentYear={year} />
      </div>
      <PromotionRecordList year={year} activities={activities} monthly={monthly} />
    </div>
  )
}
