'use client'

import { useState } from 'react'
import { generateMonthlySalaries } from '@/actions/salary-actions'
import type { HrEmployee } from '@co-at/types'

interface Props {
  employees: HrEmployee[]
  existingMonths: string[]
  currentMonth: string
}

export function SalaryGeneratePanel({ employees, existingMonths, currentMonth }: Props) {
  const [month, setMonth] = useState(currentMonth)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const withStep = employees.filter(e => e.salary_step_id)
  const alreadyExists = existingMonths.includes(month)

  const handleGenerate = async () => {
    if (!confirm(`${month} 급여를 일괄 생성합니까?`)) return
    setLoading(true)
    setError(null)
    const res = await generateMonthlySalaries(month)
    setLoading(false)
    if (!res.success) { setError(res.error ?? '생성 실패'); return }
    setResult({ created: res.created, skipped: res.skipped })
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* 월 선택 */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지급월</label>
          <input
            type="month"
            className="border rounded-md px-3 py-2 text-sm w-48"
            value={month}
            onChange={e => { setMonth(e.target.value); setResult(null) }}
          />
        </div>

        {/* 현황 요약 */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">재직자</p>
            <p className="text-xl font-bold text-gray-800">{employees.length}명</p>
          </div>
          <div className="bg-violet-50 rounded-lg p-3 text-center">
            <p className="text-gray-500 text-xs">호봉 등록</p>
            <p className="text-xl font-bold text-violet-700">{withStep.length}명</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${alreadyExists ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <p className="text-gray-500 text-xs">기존 데이터</p>
            <p className={`text-xl font-bold ${alreadyExists ? 'text-yellow-600' : 'text-green-600'}`}>
              {alreadyExists ? '있음' : '없음'}
            </p>
          </div>
        </div>

        {alreadyExists && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded">
            이미 {month} 급여 데이터가 있습니다. 기존 기록이 있는 직원은 건너뜁니다.
          </p>
        )}

        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</p>}

        {result && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
            생성 완료 — 신규 {result.created}명, 건너뜀 {result.skipped}명
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || withStep.length === 0}
          className="w-full py-2.5 bg-violet-600 text-white text-sm font-medium rounded-md hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? '생성 중…' : `${month} 급여 일괄 생성`}
        </button>

        {withStep.length === 0 && (
          <p className="text-xs text-gray-500 text-center">호봉이 등록된 직원이 없습니다. 먼저 호봉승급 메뉴에서 직원에게 호봉을 부여하세요.</p>
        )}
      </div>
    </div>
  )
}
