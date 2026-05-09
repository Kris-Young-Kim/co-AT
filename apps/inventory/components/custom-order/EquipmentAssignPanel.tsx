'use client'

import { useTransition } from 'react'
import { assignEquipmentToOrder, finishEquipmentUsage } from '@/actions/custom-order-actions'
import type { InventoryFabEquipment, InventoryFabEquipmentAssignment } from '@co-at/types'

const TYPE_LABELS: Record<string, string> = { '3d_printer': '3D프린터', cnc: 'CNC', laser: '레이저', other: '기타' }
const STATUS_LABELS: Record<string, string> = { available: '유휴', in_use: '사용중', maintenance: '점검중' }

export function EquipmentAssignPanel({
  orderId,
  currentEquipment,
  allEquipment,
}: {
  orderId: string
  currentEquipment: InventoryFabEquipmentAssignment[]
  allEquipment: InventoryFabEquipment[]
}) {
  const [isPending, startTransition] = useTransition()

  const assignedIds = new Set(currentEquipment.map(e => e.equipment_id))
  const available = allEquipment.filter(e => !assignedIds.has(e.id) && e.status !== 'maintenance')

  function assign(equipmentId: string) {
    startTransition(async () => { await assignEquipmentToOrder(orderId, equipmentId) })
  }
  function finish(equipmentId: string) {
    startTransition(async () => { await finishEquipmentUsage(orderId, equipmentId) })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-sm">장비 배정</h3>

      {currentEquipment.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">배정된 장비</p>
          {currentEquipment.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">{(e.equipment as InventoryFabEquipment | undefined)?.name ?? e.equipment_id}</p>
                <p className="text-xs text-gray-500">{e.started_at?.slice(0, 10)} ~{e.finished_at ? ` ${e.finished_at.slice(0, 10)}` : ' 진행중'}</p>
              </div>
              {!e.finished_at && (
                <button
                  onClick={() => finish(e.equipment_id)}
                  disabled={isPending}
                  className="text-xs text-gray-500 border px-2 py-1 rounded hover:bg-gray-50"
                >
                  사용 완료
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">배정 가능한 장비</p>
          {available.map(e => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs text-gray-500">{TYPE_LABELS[e.type]} · {STATUS_LABELS[e.status]}</p>
              </div>
              <button
                onClick={() => assign(e.id)}
                disabled={isPending}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                배정
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length === 0 && currentEquipment.length === 0 && (
        <p className="text-sm text-gray-400">배정 가능한 장비가 없습니다.</p>
      )}
    </div>
  )
}
