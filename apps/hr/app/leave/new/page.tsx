'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLeaveRequest } from '@/actions/leave-actions'
import type { LeaveType } from '@co-at/types'

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'annual',  label: '연차' },
  { value: 'sick',    label: '병가' },
  { value: 'special', label: '특별휴가' },
  { value: 'unpaid',  label: '무급휴가' },
]

export default function NewLeavePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const startDate = form.get('start_date') as string
    const endDate   = form.get('end_date') as string

    const start = new Date(startDate)
    const end   = new Date(endDate)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const result = await createLeaveRequest({
      employee_id: form.get('employee_id') as string,
      leave_type:  form.get('leave_type') as LeaveType,
      start_date:  startDate,
      end_date:    endDate,
      days_used:   diffDays,
      reason:      (form.get('reason') as string) || undefined,
    })

    if (!result) {
      setError('신청에 실패했습니다.')
      setLoading(false)
      return
    }
    router.push('/leave')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">휴가 신청</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            직원 ID <span className="text-red-500">*</span>
          </label>
          <input name="employee_id" required
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="직원 UUID" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">휴가 유형</label>
          <select name="leave_type" className="w-full border rounded-md px-3 py-2 text-sm">
            {LEAVE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
            <input name="start_date" type="date" required
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
            <input name="end_date" type="date" required
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
          <textarea name="reason" rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm resize-none" />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? '신청 중...' : '신청'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
