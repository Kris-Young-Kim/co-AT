import { DeviceStatusBadge } from '@/inventory/components/inventory/DeviceStatusBadge'
import type { InventoryItem } from '@/actions/inventory-actions'
import Link from 'next/link'

interface DeviceListTableProps {
  items: InventoryItem[]
}

export function DeviceListTable({ items }: DeviceListTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">등록된 기기가 없습니다.</div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">기기명</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">자산번호</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">카테고리</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">제조사/모델</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(item => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-gray-600">{item.asset_code ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">
                {[item.manufacturer, item.model].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-4 py-3">
                <DeviceStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/devices/${item.id}`} className="text-blue-600 hover:underline">
                  상세
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
