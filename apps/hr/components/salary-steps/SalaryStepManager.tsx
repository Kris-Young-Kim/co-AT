'use client'

import { useState } from 'react'
import { createSalaryStep, updateSalaryStep, deleteSalaryStep } from '@/actions/salary-step-actions'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import type { HrSalaryStep } from '@co-at/types'

interface Props {
  initialSteps: HrSalaryStep[]
}

export function SalaryStepManager({ initialSteps }: Props) {
  const [steps, setSteps] = useState(initialSteps)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ step_number: string; step_name: string; base_amount: string }>({ step_number: '', step_name: '', base_amount: '' })
  const [newRow, setNewRow] = useState(false)
  const [newValues, setNewValues] = useState({ step_number: '', step_name: '', base_amount: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = (s: HrSalaryStep) => {
    setEditingId(s.id)
    setEditValues({ step_number: String(s.step_number), step_name: s.step_name ?? '', base_amount: String(s.base_amount) })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await updateSalaryStep(id, { step_number: Number(editValues.step_number), step_name: editValues.step_name || undefined, base_amount: Number(editValues.base_amount) })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setSteps(prev => prev.map(s => s.id === id ? res.data : s))
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!newValues.step_number) return
    setSaving(true)
    const res = await createSalaryStep({ step_number: Number(newValues.step_number), step_name: newValues.step_name || undefined, base_amount: Number(newValues.base_amount) })
    setSaving(false)
    if (!res.success) { setError(res.error); return }
    setSteps(prev => [...prev, res.data].sort((a, b) => a.step_number - b.step_number))
    setNewRow(false)
    setNewValues({ step_number: '', step_name: '', base_amount: '' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await deleteSalaryStep(id)
    if (!res.success) { setError(res.error ?? '삭제 실패'); return }
    setSteps(prev => prev.filter(s => s.id !== id))
  }

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">호봉</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">호봉명</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">기본급</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {steps.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                {editingId === s.id ? (
                  <>
                    <td className="px-4 py-2 text-center"><input type="number" min={1} className="border rounded px-2 py-1 w-16 text-sm text-center" value={editValues.step_number} onChange={e => setEditValues(v => ({ ...v, step_number: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editValues.step_name} onChange={e => setEditValues(v => ({ ...v, step_name: e.target.value }))} /></td>
                    <td className="px-4 py-2"><input type="number" min={0} className="border rounded px-2 py-1 w-full text-sm text-right" value={editValues.base_amount} onChange={e => setEditValues(v => ({ ...v, base_amount: e.target.value }))} /></td>
                    <td className="px-4 py-2 text-center space-x-1">
                      <button onClick={() => saveEdit(s.id)} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-center font-medium text-violet-700">{s.step_number}호봉</td>
                    <td className="px-4 py-2.5 text-gray-600">{s.step_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">{fmt(s.base_amount)}</td>
                    <td className="px-4 py-2.5 text-center space-x-2">
                      <button onClick={() => startEdit(s)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {newRow && (
              <tr className="bg-violet-50/30">
                <td className="px-4 py-2 text-center"><input autoFocus type="number" min={1} className="border rounded px-2 py-1 w-16 text-sm text-center" placeholder="호봉" value={newValues.step_number} onChange={e => setNewValues(v => ({ ...v, step_number: e.target.value }))} /></td>
                <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-full text-sm" placeholder="호봉명 (선택)" value={newValues.step_name} onChange={e => setNewValues(v => ({ ...v, step_name: e.target.value }))} /></td>
                <td className="px-4 py-2"><input type="number" min={0} className="border rounded px-2 py-1 w-full text-sm text-right" placeholder="기본급" value={newValues.base_amount} onChange={e => setNewValues(v => ({ ...v, base_amount: e.target.value }))} /></td>
                <td className="px-4 py-2 text-center space-x-1">
                  <button onClick={handleCreate} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4 inline" /></button>
                  <button onClick={() => setNewRow(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            )}

            {steps.length === 0 && !newRow && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">등록된 호봉이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!newRow && (
        <button
          onClick={() => setNewRow(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" />
          호봉 추가
        </button>
      )}
    </div>
  )
}
