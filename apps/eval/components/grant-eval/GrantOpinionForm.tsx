'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import { updateGrantAssessment, type GrantAssessmentDetail, type GrantAssessmentItem } from '@/actions/grant-assessment-actions'
import { ChecklistSection } from './ChecklistSection'
import type { ChecklistItem } from './ChecklistSection'

const ITEM_RESULTS = ['적합', '부적합', '조건부적합', '보류'] as const

function ItemOpinionCard({
  assessmentId,
  item,
  templates,
}: {
  assessmentId: string
  item: GrantAssessmentItem
  templates: ChecklistItem[]
}) {
  const [responses, setResponses] = useState<Record<string, boolean>>(item.checklist_responses ?? {})
  const [opinion, setOpinion] = useState(item.item_opinion ?? '')
  const [itemResult, setItemResult] = useState(item.item_result ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, {
        checklist_responses: responses,
        item_opinion: opinion || null,
        item_result: itemResult || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">
        품목 {item.item_order} — {item.item_category}
      </h3>

      {templates.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">기본 확인 사항</p>
          <ChecklistSection
            items={templates}
            responses={responses}
            onChange={(id, v) => { setResponses((prev) => ({ ...prev, [id]: v })); setSaved(false) }}
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">품목별 의견</label>
        <textarea rows={3} value={opinion}
          onChange={(e) => { setOpinion(e.target.value); setSaved(false) }}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">품목 결과</label>
        <select value={itemResult}
          onChange={(e) => { setItemResult(e.target.value); setSaved(false) }}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none">
          <option value="">선택</option>
          {ITEM_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

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
  checklistMap: Record<string, ChecklistItem[] | undefined>
}

export function GrantOpinionForm({ assessmentId, assessment, checklistMap }: Props) {
  const [generalOpinion, setGeneralOpinion] = useState(assessment.general_opinion ?? '')
  const [cancelReason, setCancelReason] = useState(assessment.change_cancel_reason ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSaveGeneral() {
    startTransition(async () => {
      const result = await updateGrantAssessment(assessmentId, {
        general_opinion: generalOpinion || null,
        change_cancel_reason: cancelReason || null,
      })
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="space-y-4">
      {assessment.items.map((item) => (
        <ItemOpinionCard
          key={item.item_order}
          assessmentId={assessmentId}
          item={item}
          templates={checklistMap[item.item_category] ?? []}
        />
      ))}

      <div className="border rounded-lg p-5 bg-white">
        <h3 className="font-semibold text-gray-800 mb-4">종합 의견</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">종합 의견</label>
          <textarea rows={4} value={generalOpinion}
            onChange={(e) => { setGeneralOpinion(e.target.value); setSaved(false) }}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">변경/취소 사유</label>
          <textarea rows={2} value={cancelReason}
            onChange={(e) => { setCancelReason(e.target.value); setSaved(false) }}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleSaveGeneral} disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isPending ? '저장 중...' : '저장'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">저장됨</p>}
        </div>
      </div>
    </div>
  )
}
