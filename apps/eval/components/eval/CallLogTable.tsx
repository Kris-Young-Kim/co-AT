import type { CallLog } from '@/actions/call-log-actions'
import Link from 'next/link'

interface CallLogTableProps {
  logs: CallLog[]
}

const Q_LABELS: (keyof CallLog)[] = [
  'q_public_benefit', 'q_private_benefit', 'q_device', 'q_case_management', 'q_other'
]
const Q_NAMES = ['공적급여', '민간급여', '보조기기', '사례연계', '기타']

function getQTypes(log: CallLog): string {
  return Q_LABELS
    .map((k, i) => (log[k] ? Q_NAMES[i] : null))
    .filter(Boolean)
    .join(', ') || '—'
}

export function CallLogTable({ logs }: CallLogTableProps) {
  if (logs.length === 0) {
    return <div className="text-center py-12 text-gray-500">상담 일지가 없습니다.</div>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상담일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">의뢰인 유형</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">대상자</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">질문 유형</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">담당자</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{log.log_date}</td>
              <td className="px-4 py-3 text-gray-600">{log.requester_type ?? '—'}</td>
              <td className="px-4 py-3">
                {log.target_name ?? '—'}
                {log.target_disability_type && (
                  <span className="text-xs text-gray-400 ml-1">({log.target_disability_type})</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{getQTypes(log)}</td>
              <td className="px-4 py-3 text-gray-600">{log.staff_name ?? '—'}</td>
              <td className="px-4 py-3">
                <Link href={`/call-logs/${log.id}/edit`} className="text-blue-600 hover:underline">
                  수정
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
