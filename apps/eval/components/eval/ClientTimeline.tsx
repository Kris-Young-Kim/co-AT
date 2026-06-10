import type { ClientHistoryItem } from '@/actions/client-actions'

interface Props {
  items: ClientHistoryItem[]
  clientId: string
}

const TYPE_CONFIG: Record<ClientHistoryItem['type'], { label: string; color: string; dot: string }> = {
  application:      { label: '신청', color: 'text-blue-700', dot: 'bg-blue-500' },
  schedule:         { label: '일정', color: 'text-purple-700', dot: 'bg-purple-500' },
  service_log:      { label: '서비스', color: 'text-green-700', dot: 'bg-green-500' },
  grant_assessment: { label: '교부평가', color: 'text-amber-700', dot: 'bg-amber-500' },
  service_record:   { label: '기록', color: 'text-teal-700', dot: 'bg-teal-500' },
}

const STATUS_COLORS: Record<string, string> = {
  '접수': 'bg-gray-100 text-gray-600',
  '배정': 'bg-blue-100 text-blue-700',
  '진행중': 'bg-yellow-100 text-yellow-700',
  '완료': 'bg-green-100 text-green-700',
  '취소': 'bg-red-100 text-red-700',
  submitted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return dateStr
  }
}

export function ClientTimeline({ items, clientId }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 border rounded-lg bg-gray-50">
        이력이 없습니다
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />
      <ul className="space-y-4">
        {items.map((item) => {
          const cfg = TYPE_CONFIG[item.type] ?? { label: item.type, color: 'text-gray-600', dot: 'bg-gray-400' }
          const statusColorClass = item.status ? (STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600') : null
          return (
            <li key={`${item.type}-${item.id}`} className="relative pl-10">
              <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full ${cfg.dot} ring-2 ring-white`} />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                    <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                    {statusColorClass && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusColorClass}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{formatDate(item.date)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
