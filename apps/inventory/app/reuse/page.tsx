export const dynamic = 'force-dynamic'

import { getReuseDispatches } from '@/actions/reuse-actions'
import Link from 'next/link'
import type { ReuseDispatchStatus } from '@co-at/types'

const STATUS_LABELS: Record<ReuseDispatchStatus, string> = {
  donated: '기증/회수', inspecting: '점검', cleaning: '세척', delivered: '지급 완료',
}
const STATUS_COLORS: Record<ReuseDispatchStatus, string> = {
  donated: 'bg-purple-100 text-purple-700',
  inspecting: 'bg-yellow-100 text-yellow-700',
  cleaning: 'bg-blue-100 text-blue-700',
  delivered: 'bg-gray-100 text-gray-600',
}

interface Props { searchParams: Promise<{ status?: string }> }

export default async function ReusePage({ searchParams }: Props) {
  const sp = await searchParams
  const status = sp.status as ReuseDispatchStatus | undefined
  const result = await getReuseDispatches({ status })
  const dispatches = result.success ? result.dispatches ?? [] : []

  const filterStatuses: (ReuseDispatchStatus | undefined)[] = [undefined, 'donated', 'inspecting', 'cleaning', 'delivered']

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">재사용 관리</h1>

      <div className="flex gap-2 flex-wrap">
        {filterStatuses.map(s => (
          <Link
            key={s ?? 'all'}
            href={s ? `?status=${s}` : '/reuse'}
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
              {['등록일', '기기', '대상자', '상태', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {dispatches.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{d.created_at?.slice(0, 10) ?? '—'}</td>
                <td className="px-4 py-3 font-medium">{d.device_name ?? '—'}</td>
                <td className="px-4 py-3">{d.client_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.status]}`}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/reuse/${d.id}`} className="text-blue-600 hover:underline text-xs">상세</Link>
                </td>
              </tr>
            ))}
            {dispatches.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">재사용 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
