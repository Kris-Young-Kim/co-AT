export const dynamic = 'force-dynamic'

import { getPositions } from '@/actions/position-actions'
import { PositionManager } from '@/components/positions/PositionManager'
import { Award } from 'lucide-react'

export default async function PositionsPage() {
  const result = await getPositions()
  const positions = result.success ? result.data : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Award className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">직급 등록</h1>
      </div>
      <PositionManager initialPositions={positions} />
    </div>
  )
}
