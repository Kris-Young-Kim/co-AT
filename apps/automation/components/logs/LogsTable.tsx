'use client'

import { useState } from 'react'
import { Badge } from '@co-at/ui'
import { LogDetailModal } from './LogDetailModal'

interface Log {
  id: string
  job_name: string
  triggered_by: string
  status: string
  total_sent: number
  success_count: number
  fail_count: number
  channel: string
  error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default', partial: 'secondary', failed: 'destructive',
}
const STATUS_LABEL: Record<string, string> = {
  success: '성공', partial: '부분', failed: '실패',
}
const JOB_LABEL: Record<string, string> = {
  'rental-expiry': '대여 만료', 'schedule-reminders': '일정 리마인더', 'manual-send': '수동 발송',
}

export function LogsTable({ logs }: { logs: Log[] }) {
  const [selected, setSelected] = useState<Log | null>(null)

  if (logs.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">로그 없음</p>
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-gray-500 text-left">
            <th className="pb-2 font-medium">Job</th>
            <th className="pb-2 font-medium">트리거</th>
            <th className="pb-2 font-medium">채널</th>
            <th className="pb-2 font-medium">상태</th>
            <th className="pb-2 font-medium">성공/실패</th>
            <th className="pb-2 font-medium">시각</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr
              key={log.id}
              className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelected(log)}
            >
              <td className="py-2">{JOB_LABEL[log.job_name] ?? log.job_name}</td>
              <td className="py-2 text-gray-500">{log.triggered_by}</td>
              <td className="py-2 text-gray-500">{log.channel}</td>
              <td className="py-2">
                <Badge variant={STATUS_BADGE[log.status] ?? 'secondary'}>
                  {STATUS_LABEL[log.status] ?? log.status}
                </Badge>
              </td>
              <td className="py-2">{log.success_count} / {log.fail_count}</td>
              <td className="py-2 text-gray-400">
                {new Date(log.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LogDetailModal log={selected} onClose={() => setSelected(null)} />
    </>
  )
}
