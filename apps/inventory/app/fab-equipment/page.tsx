export const dynamic = 'force-dynamic'

import { getFabEquipment } from '@/actions/fab-equipment-actions'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
}

export default async function FabEquipmentPage() {
  const result = await getFabEquipment()
  const equipment = result.success ? result.equipment ?? [] : []

  const inUse = equipment.filter(e => e.status === 'in_use').length
  const available = equipment.filter(e => e.status === 'available').length

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">제작 장비</h1>
        <div className="text-sm text-gray-500">
          사용중 <span className="font-bold text-blue-600">{inUse}대</span> · 유휴 <span className="font-bold text-green-600">{available}대</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {equipment.map(e => (
          <Link key={e.id} href={`/fab-equipment/${e.id}`} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-500">{TYPE_LABELS[e.type] ?? e.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}>
                {STATUS_LABELS[e.status]}
              </span>
            </div>
            <p className="font-semibold text-gray-900">{e.name}</p>
            {e.serial_number && <p className="text-xs text-gray-400 mt-1">{e.serial_number}</p>}
          </Link>
        ))}
        {equipment.length === 0 && (
          <p className="col-span-3 text-center py-12 text-gray-400">등록된 장비가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
