'use client'

import { useTransition } from 'react'
import { updateReuseStatus } from '@/actions/reuse-actions'
import type { ReuseDispatchStatus } from '@co-at/types'

const STEPS: { status: ReuseDispatchStatus; label: string }[] = [
  { status: 'donated',    label: '기증/회수' },
  { status: 'inspecting', label: '점검' },
  { status: 'cleaning',   label: '세척' },
  { status: 'delivered',  label: '지급 완료' },
]

const NEXT: Record<ReuseDispatchStatus, ReuseDispatchStatus | null> = {
  donated: 'inspecting', inspecting: 'cleaning', cleaning: 'delivered', delivered: null,
}

export function ReuseStatusStepper({
  dispatchId,
  currentStatus,
}: {
  dispatchId: string
  currentStatus: ReuseDispatchStatus
}) {
  const [isPending, startTransition] = useTransition()
  const currentIdx = STEPS.findIndex(s => s.status === currentStatus)
  const nextStatus = NEXT[currentStatus]

  function advance() {
    if (!nextStatus) return
    startTransition(async () => { await updateReuseStatus(dispatchId, nextStatus) })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentIdx ? 'bg-green-600 text-white' :
                i === currentIdx ? 'bg-green-600 text-white ring-4 ring-green-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentIdx ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {nextStatus && (
        <button
          onClick={advance}
          disabled={isPending}
          className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? '처리 중...' : `"${STEPS[currentIdx + 1].label}"로 변경`}
        </button>
      )}
    </div>
  )
}
