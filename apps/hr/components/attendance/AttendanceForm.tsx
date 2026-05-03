'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertAttendance } from '@/actions/attendance-actions'
import type { UpsertAttendanceInput } from '@co-at/types'

interface Props {
  employeeId: string
  date: string
  initial?: { check_in?: string | null; check_out?: string | null; note?: string | null }
}

export function AttendanceForm({ employeeId, date, initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const input: UpsertAttendanceInput = {
      employee_id: employeeId,
      date,
      check_in:  (form.get('check_in') as string) || undefined,
      check_out: (form.get('check_out') as string) || undefined,
      note:      (form.get('note') as string) || undefined,
    }
    await upsertAttendance(input)
    router.refresh()
    setLoading(false)
  }

  const toTimeInput = (ts: string | null | undefined) =>
    ts ? new Date(ts).toTimeString().slice(0, 5) : ''

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end text-sm">
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">출근</label>
        <input
          name="check_in"
          type="time"
          defaultValue={toTimeInput(initial?.check_in)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">퇴근</label>
        <input
          name="check_out"
          type="time"
          defaultValue={toTimeInput(initial?.check_out)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-0.5">메모</label>
        <input
          name="note"
          type="text"
          defaultValue={initial?.note ?? ''}
          placeholder="메모 (선택)"
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-violet-600 text-white px-3 py-1.5 rounded text-sm hover:bg-violet-700 disabled:opacity-50"
      >
        저장
      </button>
    </form>
  )
}
