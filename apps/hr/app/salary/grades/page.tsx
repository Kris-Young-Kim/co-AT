'use client'

import { useState, useEffect } from 'react'
import { getSalaryGrades, createSalaryGrade, updateSalaryGrade, deleteSalaryGrade } from '@/actions/salary-grade-actions'
import type { HrSalaryGrade } from '@co-at/types'
import { Pencil, Trash2 } from 'lucide-react'

export default function SalaryGradesPage() {
  const [grades, setGrades] = useState<HrSalaryGrade[]>([])
  const [gradeName, setGradeName] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setGrades(await getSalaryGrades())
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const input = { grade_name: gradeName.trim(), base_salary: parseInt(baseSalary, 10) }
    const result = editingId
      ? await updateSalaryGrade(editingId, input)
      : await createSalaryGrade(input)
    if (!result) { setError('저장에 실패했습니다.'); setLoading(false); return }
    setGradeName(''); setBaseSalary(''); setEditingId(null)
    await load()
    setLoading(false)
  }

  function startEdit(g: HrSalaryGrade) {
    setEditingId(g.id)
    setGradeName(g.grade_name)
    setBaseSalary(String(g.base_salary))
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await deleteSalaryGrade(id)
    await load()
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">호봉표 관리</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">{editingId ? '호봉 수정' : '호봉 등록'}</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">호봉명 *</label>
            <input value={gradeName} onChange={e => setGradeName(e.target.value)} required
              placeholder="예: 1급 1호봉"
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">기본급 (원) *</label>
            <input value={baseSalary} onChange={e => setBaseSalary(e.target.value)} required type="number" min="0"
              placeholder="예: 3000000"
              className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
            {loading ? '저장 중...' : editingId ? '수정' : '등록'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setGradeName(''); setBaseSalary('') }}
              className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">
              취소
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['호봉명', '기본급', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {grades.map(g => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{g.grade_name}</td>
                <td className="px-4 py-3">{g.base_salary.toLocaleString()}원</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(g)}
                      className="text-gray-500 hover:text-violet-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(g.id)}
                      className="text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">등록된 호봉이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
