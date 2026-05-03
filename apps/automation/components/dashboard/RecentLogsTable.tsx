import { Badge } from '@co-at/ui'

interface Log {
  id: string
  job_name: string
  status: string
  channel: string
  success_count: number
  fail_count: number
  created_at: string
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  partial: 'secondary',
  failed:  'destructive',
}

const STATUS_LABEL: Record<string, string> = {
  success: '성공',
  partial: '부분',
  failed:  '실패',
}

const JOB_LABEL: Record<string, string> = {
  'rental-expiry':      '대여 만료',
  'schedule-reminders': '일정 리마인더',
  'manual-send':        '수동 발송',
}

export function RecentLogsTable({ logs }: { logs: Log[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">오늘 실행 내역 없음</p>
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-gray-500 text-left">
          <th className="pb-2 font-medium">Job</th>
          <th className="pb-2 font-medium">채널</th>
          <th className="pb-2 font-medium">상태</th>
          <th className="pb-2 font-medium">성공/실패</th>
          <th className="pb-2 font-medium">시간</th>
        </tr>
      </thead>
      <tbody>
        {logs.map(log => (
          <tr key={log.id} className="border-b last:border-0">
            <td className="py-2">{JOB_LABEL[log.job_name] ?? log.job_name}</td>
            <td className="py-2 text-gray-500">{log.channel}</td>
            <td className="py-2">
              <Badge variant={STATUS_BADGE[log.status] ?? 'secondary'}>
                {STATUS_LABEL[log.status] ?? log.status}
              </Badge>
            </td>
            <td className="py-2">{log.success_count} / {log.fail_count}</td>
            <td className="py-2 text-gray-400">
              {new Date(log.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
