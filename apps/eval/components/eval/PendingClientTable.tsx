import Link from 'next/link'
import type { Client } from '@/actions/client-actions'

interface PendingClientTableProps {
  clients: Client[]
}

const SOURCE_LABELS: Record<string, string> = {
  portal: '포털신청',
  staff: '직원입력',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function PendingClientTable({ clients }: PendingClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">대기 중인 접수가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">이름</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">생년월일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">연락처</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">출처</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">접수일</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {clients.map(client => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{client.name}</td>
              <td className="px-4 py-3 text-gray-600">{client.birth_date ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{client.contact ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  client.source === 'portal'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {SOURCE_LABELS[client.source ?? 'staff'] ?? '직원입력'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {client.created_at ? formatDate(client.created_at) : '—'}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/clients/${client.id}/register`}
                  className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  등록 처리
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
