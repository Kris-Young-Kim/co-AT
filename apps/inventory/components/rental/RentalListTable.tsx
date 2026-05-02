import type { RentalWithDetails } from '@/actions/rental-actions'
import { RentalStatusBadge } from '@/inventory/components/rental/RentalStatusBadge'
import Link from 'next/link'

interface RentalListTableProps {
  rentals: RentalWithDetails[]
}

export function RentalListTable({ rentals }: RentalListTableProps) {
  if (rentals.length === 0) {
    return <div className="text-center py-12 text-gray-500">대여 기록이 없습니다.</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">기기명</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">이용자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">대여기간</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">반납기한</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rentals.map(r => (
            <tr
              key={r.id}
              className={`hover:bg-gray-50 ${r.is_overdue ? 'bg-red-50' : r.is_due_today ? 'bg-yellow-50' : ''}`}
            >
              <td className="px-4 py-3 font-medium">
                {r.inventory_name ?? '—'}
                {r.inventory_model && <span className="text-gray-500 ml-1 text-xs">{r.inventory_model}</span>}
              </td>
              <td className="px-4 py-3 text-gray-600">{r.client_name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">
                {r.rental_start_date} ~ {r.rental_end_date}
              </td>
              <td className="px-4 py-3">
                <RentalStatusBadge status={r.status} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {r.is_overdue && <span className="text-red-600 font-medium">연체 ({Math.abs(r.days_remaining ?? 0)}일)</span>}
                {r.is_due_today && !r.is_overdue && <span className="text-yellow-600 font-medium">오늘 반납</span>}
                {!r.is_overdue && !r.is_due_today && r.status === 'rented' && `${r.days_remaining}일 남음`}
                {r.status === 'returned' && r.return_date}
              </td>
              <td className="px-4 py-3">
                <Link href={`/rentals/${r.id}`} className="text-blue-600 hover:underline">
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
