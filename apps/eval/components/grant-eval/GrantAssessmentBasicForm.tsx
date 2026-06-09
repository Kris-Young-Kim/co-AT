'use client'

import { useState, useTransition } from 'react'
import { updateGrantAssessment, type GrantAssessmentDetail } from '@/actions/grant-assessment-actions'

interface Props {
  assessmentId: string
  assessment: GrantAssessmentDetail
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export function GrantAssessmentBasicForm({ assessmentId, assessment }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    evaluation_date: assessment.evaluation_date ?? '',
    assessment_month: assessment.assessment_month ? String(assessment.assessment_month) : '',
    referral_org: assessment.referral_org ?? '',
    evaluator_name: assessment.evaluator_name ?? '',
    prior_grant_records: JSON.stringify(assessment.prior_grant_records ?? [], null, 2),
  })

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      let prior: Array<{ year: number; agency: string; item: string }> | null = null
      try { prior = JSON.parse(form.prior_grant_records) } catch { prior = null }

      const result = await updateGrantAssessment(assessmentId, {
        evaluation_date: form.evaluation_date || null,
        assessment_month: form.assessment_month ? parseInt(form.assessment_month) : null,
        referral_org: form.referral_org || null,
        evaluator_name: form.evaluator_name || null,
        prior_grant_records: prior,
      })

      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장에 실패했습니다')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가일</label>
          <input
            type="date"
            value={form.evaluation_date}
            onChange={(e) => set('evaluation_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가월</label>
          <select
            value={form.assessment_month}
            onChange={(e) => set('assessment_month', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            <option value="">선택</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">의뢰기관</label>
        <input
          value={form.referral_org}
          onChange={(e) => set('referral_org', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">평가자</label>
        <input
          value={form.evaluator_name}
          onChange={(e) => set('evaluator_name', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">기교부 실적 (JSON)</label>
        <textarea
          rows={4}
          value={form.prior_grant_records}
          onChange={(e) => set('prior_grant_records', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder='[{"year": 2024, "agency": "공단", "item": "전동휠체어"}]'
        />
        <p className="text-xs text-gray-400 mt-1">year, agency, item 키를 가진 배열 형식</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">저장되었습니다</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
