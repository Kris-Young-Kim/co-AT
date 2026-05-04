'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyWage } from '@/actions/daily-wage-actions'
import { getEmployees } from '@/actions/employee-actions'
import type { HrEmployee, CreateDailyWageInput } from '@co-at/types'

export default function NewDailyWagePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<HrEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getEmployees().then(setEmployees)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    const input: CreateDailyWageInput = {
      employee_id:  form.get('employee_id') as string,
      work_date:    form.get('work_date') as string,
      hours_worked: parseFloat(form.get('hours_worked') as string),
      hourly_rate:  parseInt(form.get('hourly_rate') as string, 10),
      note:         (form.get('note') as string) || undefined,
    }
    const result = await createDailyWage(input)
    if (!result) { setError('저장에 실패했습니다.'); setLoading(false); return }
    router.push('/daily-wages')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">일용급여 입력</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">직원 *</label>
          <select name="employee_id" required className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">직원 선택</option>
            {employees.filter(e => e.employment_type === 'daily').map(e => (
              <option key={e.id} value={e.id}>{e.name} — {e.department}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">근무일 *</label>
          <input name="work_date" type="date" required className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">근무 시간 *</label>
            <input name="hours_worked" type="number" step="0.5" min="0.5" required
              placeholder="예: 8"
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시급 (원) *</label>
            <input name="hourly_rate" type="number" min="0" required
              placeholder="예: 10030"
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <input name="note" type="text" className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : '저장'}
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
