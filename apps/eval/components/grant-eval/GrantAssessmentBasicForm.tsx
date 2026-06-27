'use client'

import { useState, useTransition } from 'react'
import { updateGrantAssessment, type GrantAssessmentDetail } from '@/actions/grant-assessment-actions'
import { Plus, Trash2 } from 'lucide-react'

interface Props {
  assessmentId: string
  assessment: GrantAssessmentDetail
}

interface PriorRecord {
  year: string
  agency: string
  item: string
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()

function parsePriorRecords(raw: unknown): PriorRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((r: { year?: number | string; agency?: string; item?: string }) => ({
    year: String(r.year ?? ''),
    agency: r.agency ?? '',
    item: r.item ?? '',
  }))
}

export function GrantAssessmentBasicForm({ assessmentId, assessment }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    evaluation_date: assessment.evaluation_date ?? '',
    assessment_month: assessment.assessment_month ? String(assessment.assessment_month) : '',
    referral_org: assessment.referral_org ?? '',
    evaluator_name: assessment.evaluator_name ?? '',
  })

  const [priorRecords, setPriorRecords] = useState<PriorRecord[]>(
    parsePriorRecords(assessment.prior_grant_records)
  )

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function addPriorRecord() {
    setPriorRecords((prev) => [...prev, { year: String(CURRENT_YEAR - 1), agency: '', item: '' }])
    setSaved(false)
  }

  function updatePriorRecord(index: number, key: keyof PriorRecord, value: string) {
    setPriorRecords((prev) => prev.map((r, i) => i === index ? { ...r, [key]: value } : r))
    setSaved(false)
  }

  function removePriorRecord(index: number) {
    setPriorRecords((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const prior = priorRecords
        .filter((r) => r.agency || r.item)
        .map((r) => ({ year: parseInt(r.year) || CURRENT_YEAR - 1, agency: r.agency, item: r.item }))

      const result = await updateGrantAssessment(assessmentId, {
        evaluation_date: form.evaluation_date || null,
        assessment_month: form.assessment_month ? parseInt(form.assessment_month) : null,
        referral_org: form.referral_org || null,
        evaluator_name: form.evaluator_name || null,
        prior_grant_records: prior.length > 0 ? prior : null,
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
            onChange={(e) => setField('evaluation_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">평가월</label>
          <select
            value={form.assessment_month}
            onChange={(e) => setField('assessment_month', e.target.value)}
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
          onChange={(e) => setField('referral_org', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">평가자</label>
        <input
          value={form.evaluator_name}
          onChange={(e) => setField('evaluator_name', e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 기교부 실적 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">기교부 실적</label>
          <button
            type="button"
            onClick={addPriorRecord}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>

        {priorRecords.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center border rounded-md bg-gray-50">
            기교부 실적이 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {priorRecords.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="number"
                  value={r.year}
                  onChange={(e) => updatePriorRecord(i, 'year', e.target.value)}
                  placeholder="연도"
                  className="w-20 px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  value={r.agency}
                  onChange={(e) => updatePriorRecord(i, 'agency', e.target.value)}
                  placeholder="교부기관"
                  className="flex-1 px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  value={r.item}
                  onChange={(e) => updatePriorRecord(i, 'item', e.target.value)}
                  placeholder="품목명"
                  className="flex-1 px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removePriorRecord(i)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
