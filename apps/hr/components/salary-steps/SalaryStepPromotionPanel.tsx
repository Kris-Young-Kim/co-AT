'use client'

import { useState } from 'react'
import { promoteEmployeeSalaryStep } from '@/actions/salary-step-actions'
import type { HrEmployee, HrSalaryStep, HrSalaryStepHistory } from '@co-at/types'

type HistoryRow = HrSalaryStepHistory & { employee_name: string | null; to_step_number: number | null }

interface Props {
  history: HistoryRow[]
  employees: HrEmployee[]
  steps: HrSalaryStep[]
}

export function SalaryStepPromotionPanel({ history: initialHistory, employees, steps }: Props) {
  const [history, setHistory] = useState(initialHistory)
  const [form, setForm] = useState({ employee_id: '', from_step_id: '', to_step_id: '', effective_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSteps = steps.filter(s => s.is_active)
  const activeEmployees = employees.filter(e => e.is_active)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.to_step_id || !form.effective_date) return
    setSaving(true)
    const res = await promoteEmployeeSalaryStep({
      employee_id: form.employee_id,
      from_step_id: form.from_step_id || undefined,
      to_step_id: form.to_step_id,
      effective_date: form.effective_date,
      reason: form.reason || undefined,
    })
    setSaving(false)
    if (!res.success) { setError(res.error ?? '저장 실패'); return }

    const emp = activeEmployees.find(e => e.id === form.employee_id)
    const toStep = activeSteps.find(s => s.id === form.to_step_id)
    const newRow: HistoryRow = {
      id: crypto.randomUUID(),
      employee_id: form.employee_id,
      from_step_id: form.from_step_id || null,
      to_step_id: form.to_step_id,
      effective_date: form.effective_date,
      reason: form.reason || null,
      created_by: null,
      created_at: new Date().toISOString(),
      employee_name: emp?.name ?? null,
      to_step_number: toStep?.step_number ?? null,
    }
    setHistory(prev => [newRow, ...prev])
    setForm({ employee_id: '', from_step_id: '', to_step_id: '', effective_date: '', reason: '' })
    setError(null)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* 승급 입력 폼 */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">호봉 승급 처리</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">직원 *</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.employee_id}
              onChange={e => setForm(v => ({ ...v, employee_id: e.target.value }))}
              required
            >
              <option value="">직원 선택</option>
              {activeEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 호봉</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.from_step_id}
                onChange={e => setForm(v => ({ ...v, from_step_id: e.target.value }))}
              >
                <option value="">선택 (없으면 신규)</option>
                {activeSteps.map(s => (
                  <option key={s.id} value={s.id}>{s.step_number}호봉 {s.step_name ? `(${s.step_name})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">승급 후 호봉 *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.to_step_id}
                onChange={e => setForm(v => ({ ...v, to_step_id: e.target.value }))}
                required
              >
                <option value="">호봉 선택</option>
                {activeSteps.map(s => (
                  <option key={s.id} value={s.id}>{s.step_number}호봉 {s.step_name ? `(${s.step_name})` : ''} — {s.base_amount.toLocaleString('ko-KR')}원</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">발령일 *</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.effective_date}
              onChange={e => setForm(v => ({ ...v, effective_date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="정기승급, 특별승급 등"
              value={form.reason}
              onChange={e => setForm(v => ({ ...v, reason: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? '저장 중…' : '호봉 승급 처리'}
          </button>
        </form>
      </div>

      {/* 이력 테이블 */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900">호봉 승급 이력</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">직원</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">승급 호봉</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">발령일</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">사유</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{h.employee_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center text-violet-700 font-semibold">{h.to_step_number != null ? `${h.to_step_number}호봉` : '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500 text-xs">{h.effective_date}</td>
                  <td className="px-4 py-2.5 text-gray-500 truncate max-w-xs">{h.reason ?? '—'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">승급 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
