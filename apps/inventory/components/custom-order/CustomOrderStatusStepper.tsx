'use client'

import { useTransition } from 'react'
import { updateCustomOrderStatus } from '@/actions/custom-order-actions'
import type { CustomOrderStatus } from '@co-at/types'

const STEPS: { status: CustomOrderStatus; label: string }[] = [
  { status: 'requested',   label: '제작 대기' },
  { status: 'in_progress', label: '제작 중' },
  { status: 'completed',   label: '제작 완료' },
  { status: 'delivered',   label: '지급 완료' },
]

const NEXT: Record<CustomOrderStatus, CustomOrderStatus | null> = {
  requested: 'in_progress', in_progress: 'completed', completed: 'delivered', delivered: null,
}

export function CustomOrderStatusStepper({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: CustomOrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const currentIdx = STEPS.findIndex(s => s.status === currentStatus)
  const nextStatus = NEXT[currentStatus]

  function advance() {
    if (!nextStatus) return
    startTransition(async () => {
      await updateCustomOrderStatus(orderId, nextStatus)
    })
  }

  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < currentIdx ? 'bg-blue-600 text-white' :
                i === currentIdx ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i <= currentIdx ? 'text-blue-700 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      {nextStatus && (
        <button
          onClick={advance}
          disabled={isPending}
          className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '처리 중...' : `"${STEPS[currentIdx + 1].label}"로 변경`}
        </button>
      )}
    </div>
  )
}
