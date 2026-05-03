'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewLeaveRequest } from '@/actions/leave-actions'

interface Props {
  leaveId: string
  reviewerId: string
}

export function LeaveReviewButtons({ leaveId, reviewerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReview(status: 'approved' | 'rejected') {
    setLoading(true)
    await reviewLeaveRequest({ id: leaveId, status, reviewed_by: reviewerId })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleReview('approved')}
        disabled={loading}
        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
      >
        승인
      </button>
      <button
        onClick={() => handleReview('rejected')}
        disabled={loading}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
      >
        반려
      </button>
    </div>
  )
}
