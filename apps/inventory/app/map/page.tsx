import { getRentalsByCity } from '@/inventory/actions/map-actions'
import { GangwonMap } from '@/inventory/components/map/GangwonMap'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const data = await getRentalsByCity()
  const totalActive = data.reduce((sum, d) => sum + d.total, 0)
  const totalOverdue = data.reduce((sum, d) => sum + d.overdue, 0)
  const activeCities = data.filter(d => d.total > 0).length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            강원도 대여 현황 맵
          </h1>
          <p className="text-sm text-gray-500 mt-1">강원특별자치도 18개 시군 · 활성 대여 실시간 분포</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-blue-50 rounded-lg px-4 py-2.5">
            <p className="text-xl font-bold text-blue-700">{totalActive}</p>
            <p className="text-xs text-gray-500">활성 대여</p>
          </div>
          {totalOverdue > 0 && (
            <div className="bg-red-50 rounded-lg px-4 py-2.5">
              <p className="text-xl font-bold text-red-600">{totalOverdue}</p>
              <p className="text-xs text-gray-500">연체</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg px-4 py-2.5">
            <p className="text-xl font-bold text-gray-700">{activeCities}</p>
            <p className="text-xs text-gray-500">대여 시군</p>
          </div>
        </div>
      </div>

      <GangwonMap initialData={data} />
    </div>
  )
}
