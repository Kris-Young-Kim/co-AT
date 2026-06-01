export const dynamic = 'force-dynamic'

import { getMaintenanceLogs } from '@/actions/maintenance-actions'

const TYPE_LABELS: Record<string, string> = { inspection: '점검', repair: '수리', cleaning: '세척' }
const STATUS_LABELS: Record<string, string> = { pending: '대기', in_progress: '진행중', done: '완료' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

export default async function MaintenancePage() {
  const result = await getMaintenanceLogs({ limit: 100 })
  const logs = result.success ? result.logs ?? [] : []

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">점검/수리 이력</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['일자', '기기', '유형', '상태', '담당자', '비용', '메모'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{(l.performed_at ?? l.created_at ?? '').slice(0, 10)}</td>
                <td className="px-4 py-3 font-medium">{l.device_name ?? '—'}</td>
                <td className="px-4 py-3">{TYPE_LABELS[l.type] ?? l.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[l.status]}`}>
                    {STATUS_LABELS[l.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.technician ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{(l.cost ?? 0) > 0 ? `${(l.cost ?? 0).toLocaleString()}원` : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{l.notes ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
