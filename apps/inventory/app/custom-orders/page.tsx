import { getCustomOrders } from '@/actions/custom-order-actions'
import Link from 'next/link'
import type { CustomOrderStatus } from '@co-at/types'

const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  requested: '제작 대기', in_progress: '제작 중', completed: '제작 완료', delivered: '지급 완료',
}
const STATUS_COLORS: Record<CustomOrderStatus, string> = {
  requested: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-600',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function CustomOrdersPage({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status as CustomOrderStatus | undefined
  const result = await getCustomOrders({ status })
  const orders = result.success ? result.orders ?? [] : []

  const filterStatuses: (CustomOrderStatus | undefined)[] = [undefined, 'requested', 'in_progress', 'completed', 'delivered']

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">맞춤제작 관리</h1>

      <div className="flex gap-2 flex-wrap">
        {filterStatuses.map(s => (
          <Link
            key={s ?? 'all'}
            href={s ? `?status=${s}` : '/custom-orders'}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              (status ?? undefined) === s
                ? 'bg-gray-800 text-white border-gray-800'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s ? STATUS_LABELS[s] : '전체'}
          </Link>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['신청일', '대상자', '기기', '상태', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{o.requested_at?.slice(0, 10) ?? '—'}</td>
                <td className="px-4 py-3">{o.client_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{o.device_name ?? '미배정'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/custom-orders/${o.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">맞춤제작 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
