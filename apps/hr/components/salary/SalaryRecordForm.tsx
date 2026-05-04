'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSalaryRecord } from '@/actions/salary-actions'
import { getSalaryGrades } from '@/actions/salary-grade-actions'
import { getAllowanceTypes } from '@/actions/allowance-type-actions'
import type { HrSalaryGrade, HrAllowanceType, SalaryAllowance, CreateSalaryRecordInput } from '@co-at/types'

interface Props {
  employeeId: string
  employeeName: string
  yearMonth: string
}

export function SalaryRecordForm({ employeeId, employeeName, yearMonth }: Props) {
  const router = useRouter()
  const [grades, setGrades] = useState<HrSalaryGrade[]>([])
  const [allowanceTypes, setAllowanceTypes] = useState<HrAllowanceType[]>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [allowances, setAllowances] = useState<SalaryAllowance[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getSalaryGrades(), getAllowanceTypes()]).then(([g, a]) => {
      setGrades(g)
      setAllowanceTypes(a)
    })
  }, [])

  function handleGradeChange(gradeId: string) {
    setSelectedGradeId(gradeId)
    const grade = grades.find(g => g.id === gradeId)
    if (grade) setBaseSalary(String(grade.base_salary))
  }

  function setAllowanceAmount(typeId: string, typeName: string, amount: string) {
    const numAmount = parseInt(amount, 10) || 0
    setAllowances(prev => {
      const existing = prev.find(a => a.type_id === typeId)
      if (numAmount === 0) return prev.filter(a => a.type_id !== typeId)
      if (existing) return prev.map(a => a.type_id === typeId ? { ...a, amount: numAmount } : a)
      return [...prev, { type_id: typeId, name: typeName, amount: numAmount }]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const input: CreateSalaryRecordInput = {
      employee_id:     employeeId,
      year_month:      yearMonth,
      salary_grade_id: selectedGradeId || undefined,
      base_salary:     parseInt(baseSalary, 10),
      allowances,
      note:            note || undefined,
    }
    const result = await createSalaryRecord(input)
    if (!result) { setError('저장에 실패했습니다.'); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <p className="text-sm font-medium">{employeeName}</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">호봉</label>
        <select value={selectedGradeId} onChange={e => handleGradeChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm">
          <option value="">직접 입력</option>
          {grades.filter(g => g.is_active).map(g => (
            <option key={g.id} value={g.id}>{g.grade_name} ({g.base_salary.toLocaleString()}원)</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">기본급 (원) *</label>
        <input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} required min="0"
          className="w-full border rounded-md px-3 py-2 text-sm" />
      </div>

      {allowanceTypes.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs text-gray-500">수당</label>
          {allowanceTypes.map(t => (
            <div key={t.id} className="flex items-center gap-3">
              <span className="text-sm w-24">{t.name}</span>
              <input type="number" min="0" placeholder="0"
                onChange={e => setAllowanceAmount(t.id, t.name, e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm w-36" />
              <span className="text-xs text-gray-400">원</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)}
          className="w-full border rounded-md px-3 py-2 text-sm" />
      </div>

      <button type="submit" disabled={loading}
        className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50">
        {loading ? '저장 중...' : '급여 등록'}
      </button>
    </form>
  )
}
