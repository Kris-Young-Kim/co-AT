'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import {
  updateGrantAssessment,
  submitGrantAssessment,
  type GrantAssessmentDetail,
  type GrantAssessmentItem,
} from '@/actions/grant-assessment-actions'
import { useRouter } from 'next/navigation'

const FINAL_RESULTS = ['적합', '부적합', '조건부적합', '보류', '취소'] as const

function ItemResultCard({ assessmentId, item }: { assessmentId: string; item: GrantAssessmentItem }) {
  const [form, setForm] = useState({
    item_result: item.item_result ?? '',
    recommended_model: item.recommended_model ?? '',
    vendor_name: item.vendor_name ?? '',
    vendor_phone: item.vendor_phone ?? '',
    support_amount: item.support_amount ? String(item.support_amount) : '',
    has_self_pay: item.has_self_pay ?? false,
    final_item_name: item.final_item_name ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, {
        item_result: form.item_result || null,
        recommended_model: form.recommended_model || null,
        vendor_name: form.vendor_name || null,
        vendor_phone: form.vendor_phone || null,
        support_amount: form.support_amount ? parseInt(form.support_amount) : null,
        has_self_pay: form.has_self_pay,
        final_item_name: form.final_item_name || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">품목 {item.item_order} — {item.item_category}</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">품목 결과</label>
          <select value={form.item_result} onChange={(e) => set('item_result', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none">
            <option value="">선택</option>
            {['적합', '부적합', '조건부적합', '보류'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">최종 품목명</label>
          <input value={form.final_item_name} onChange={(e) => set('final_item_name', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">추천 모델</label>
          <input value={form.recommended_model} onChange={(e) => set('recommended_model', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지원 금액 (원)</label>
          <input type="number" value={form.support_amount} onChange={(e) => set('support_amount', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">공급업체</label>
          <input value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">업체 연락처</label>
          <input value={form.vendor_phone} onChange={(e) => set('vendor_phone', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
        <input type="checkbox" checked={form.has_self_pay}
          onChange={(e) => set('has_self_pay', e.target.checked)} />
        자부담 있음
      </label>
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">저장됨</p>}
      </div>
    </div>
  )
}

interface Props {
  assessmentId: string
  assessment: GrantAssessmentDetail
}

export function GrantResultForm({ assessmentId, assessment }: Props) {
  const router = useRouter()
  const [finalResult, setFinalResult] = useState(assessment.final_result ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSaveFinal() {
    startTransition(async () => {
      const result = await updateGrantAssessment(assessmentId, {
        final_result: finalResult || null,
        status: 'completed',
      })
      if (!result.success) setError(result.error ?? '저장 실패')
    })
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitGrantAssessment(assessmentId)
      if (result.success) router.refresh()
      else setError(result.error ?? '제출 실패')
    })
  }

  return (
    <div className="space-y-4">
      {assessment.items.map((item) => (
        <ItemResultCard key={item.item_order} assessmentId={assessmentId} item={item} />
      ))}

      <div className="border rounded-lg p-5 bg-white">
        <h3 className="font-semibold text-gray-800 mb-4">최종 결과</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium text-gray-700">최종 결과</label>
          <select value={finalResult} onChange={(e) => setFinalResult(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none">
            <option value="">선택</option>
            {FINAL_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleSaveFinal} disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            완료 처리
          </button>
          {assessment.status === 'draft' && (
            <button onClick={handleSubmit} disabled={isPending}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
              제출
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
