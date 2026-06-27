'use client'

import { useState, useTransition } from 'react'
import { Pencil, Loader2, Check, X } from 'lucide-react'
import { updateDomainAssessment } from '@/actions/assessment-actions'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'
import { MultiCheck, FUTURE_PLAN_OPTIONS } from './domain-fields/shared'

const DOMAIN_COLORS: Record<string, string> = {
  WC: 'bg-blue-50 text-blue-700',
  ADL: 'bg-green-50 text-green-700',
  S: 'bg-yellow-50 text-yellow-700',
  SP: 'bg-purple-50 text-purple-700',
  EC: 'bg-orange-50 text-orange-700',
  CA: 'bg-cyan-50 text-cyan-700',
  L: 'bg-pink-50 text-pink-700',
  AAC: 'bg-indigo-50 text-indigo-700',
  AM: 'bg-red-50 text-red-700',
}

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어 및 이동',
  ADL: '일상생활동작',
  S: '감각',
  SP: '앉기 및 자세',
  EC: '주택 및 환경개조',
  CA: '컴퓨터접근',
  L: '레저',
  AAC: '보완대체의사소통',
  AM: '자동차개조',
}

interface Props {
  assessment: ConsultDomainAssessment
}

export function DomainAssessmentEditCard({ assessment: initial }: Props) {
  const [saved, setSaved] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Edit form state (initialised from saved each time edit opens)
  const [evalDate, setEvalDate] = useState(saved.evaluation_date)
  const [opinion, setOpinion] = useState(saved.evaluator_opinion ?? '')
  const [device, setDevice] = useState(saved.recommended_device ?? '')
  const [futurePlan, setFuturePlan] = useState<string[]>(
    saved.future_plan ? saved.future_plan.split(', ').filter(Boolean) : []
  )

  function openEdit() {
    setEvalDate(saved.evaluation_date)
    setOpinion(saved.evaluator_opinion ?? '')
    setDevice(saved.recommended_device ?? '')
    setFuturePlan(saved.future_plan ? saved.future_plan.split(', ').filter(Boolean) : [])
    setError(null)
    setEditing(true)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await updateDomainAssessment(saved.id, {
        evaluation_date: evalDate,
        evaluator_opinion: opinion || undefined,
        recommended_device: device || undefined,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : undefined,
      })
      if (!result.success) {
        setError(result.error ?? '저장에 실패했습니다')
        return
      }
      setSaved(prev => ({
        ...prev,
        evaluation_date: evalDate,
        evaluator_opinion: opinion || null,
        recommended_device: device || null,
        future_plan: futurePlan.length > 0 ? futurePlan.join(', ') : null,
      }))
      setEditing(false)
    })
  }

  const colorClass = DOMAIN_COLORS[saved.domain_type] ?? 'bg-gray-100 text-gray-600'
  const label = DOMAIN_LABELS[saved.domain_type] ?? saved.domain_type

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
          {saved.domain_type}
        </span>
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{saved.evaluation_date}</span>
          {!editing && (
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-white transition-colors text-gray-600"
            >
              <Pencil className="h-3 w-3" />
              수정
            </button>
          )}
        </div>
      </div>

      {/* Read mode */}
      {!editing && (
        <div className="px-4 py-3 space-y-2 text-sm">
          {saved.evaluator_opinion && (
            <div>
              <span className="text-xs font-medium text-gray-500">평가자 의견</span>
              <p className="mt-0.5 text-gray-700 whitespace-pre-wrap">{saved.evaluator_opinion}</p>
            </div>
          )}
          {saved.recommended_device && (
            <div>
              <span className="text-xs font-medium text-gray-500">추천 보조기기</span>
              <p className="mt-0.5 text-gray-700">{saved.recommended_device}</p>
            </div>
          )}
          {saved.future_plan && (
            <div>
              <span className="text-xs font-medium text-gray-500">향후 계획</span>
              <p className="mt-0.5 text-gray-700">{saved.future_plan}</p>
            </div>
          )}
          {!saved.evaluator_opinion && !saved.recommended_device && !saved.future_plan && (
            <p className="text-gray-400 text-xs py-1">세부 내용 없음 — 수정 버튼으로 입력하세요</p>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="px-4 py-4 space-y-3">
          {error && (
            <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">평가일</label>
            <input
              type="date"
              value={evalDate}
              onChange={e => setEvalDate(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">평가자 의견</label>
            <textarea
              value={opinion}
              onChange={e => setOpinion(e.target.value)}
              rows={3}
              placeholder="평가자 의견을 입력하세요"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">추천 보조기기</label>
            <input
              value={device}
              onChange={e => setDevice(e.target.value)}
              placeholder="추천 보조기기명"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <MultiCheck
            label="향후 계획"
            options={FUTURE_PLAN_OPTIONS}
            values={futurePlan}
            onChange={setFuturePlan}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
