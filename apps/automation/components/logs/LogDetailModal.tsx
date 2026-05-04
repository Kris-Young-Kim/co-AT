'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@co-at/ui/dialog'

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

interface Props {
  log: Log | null
  onClose: () => void
}

export function LogDetailModal({ log, onClose }: Props) {
  if (!log) return null
  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>실행 상세 — {log.job_name}</DialogTitle>
        </DialogHeader>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2"><dt className="w-28 text-gray-500">실행 시각</dt><dd>{new Date(log.created_at).toLocaleString('ko-KR')}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">트리거</dt><dd>{log.triggered_by}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">채널</dt><dd>{log.channel}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">상태</dt><dd>{log.status}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">총 발송</dt><dd>{log.total_sent}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">성공</dt><dd>{log.success_count}</dd></div>
          <div className="flex gap-2"><dt className="w-28 text-gray-500">실패</dt><dd>{log.fail_count}</dd></div>
          {log.error_message && (
            <div><dt className="text-gray-500 mb-1">오류 메시지</dt><dd className="bg-red-50 text-red-700 rounded p-2 text-xs font-mono">{log.error_message}</dd></div>
          )}
          {log.metadata && (
            <div><dt className="text-gray-500 mb-1">메타데이터</dt><dd className="bg-gray-50 rounded p-2 text-xs font-mono whitespace-pre">{JSON.stringify(log.metadata, null, 2)}</dd></div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
