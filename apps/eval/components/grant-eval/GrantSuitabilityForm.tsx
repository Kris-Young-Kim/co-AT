'use client'

import { useState, useTransition } from 'react'
import { upsertGrantItem } from '@/actions/grant-item-actions'
import { ScoreSelector } from './ScoreSelector'
import type { GrantAssessmentItem } from '@/actions/grant-assessment-actions'

interface ScoreState {
  score_env: number | null
  score_operation: number | null
  score_disability: number | null
  score_use_plan: number | null
  score_effectiveness: number | null
}

function toScoreState(item: GrantAssessmentItem): ScoreState {
  return {
    score_env: item.score_env,
    score_operation: item.score_operation,
    score_disability: item.score_disability,
    score_use_plan: item.score_use_plan,
    score_effectiveness: item.score_effectiveness,
  }
}

const SCORE_LABELS: Array<{ key: keyof ScoreState; label: string }> = [
  { key: 'score_env', label: '환경 적합성' },
  { key: 'score_operation', label: '조작 능력' },
  { key: 'score_disability', label: '장애 특성' },
  { key: 'score_use_plan', label: '활용 계획' },
  { key: 'score_effectiveness', label: '기대 효과' },
]

function ItemSuitabilityCard({ assessmentId, item }: { assessmentId: string; item: GrantAssessmentItem }) {
  const [scores, setScores] = useState<ScoreState>(toScoreState(item))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = Object.values(scores).reduce<number>((sum, v) => sum + (v ?? 0), 0)

  function handleSave() {
    startTransition(async () => {
      const result = await upsertGrantItem(assessmentId, item.item_order, scores)
      if (result.success) { setSaved(true); setError(null) }
      else setError(result.error ?? '저장 실패')
    })
  }

  return (
    <div className="border rounded-lg p-5 bg-white">
      <h3 className="font-semibold text-gray-800 mb-4">
        품목 {item.item_order} — {item.item_category}
      </h3>
      <div className="space-y-3 mb-4">
        {SCORE_LABELS.map(({ key, label }) => (
          <ScoreSelector
            key={key}
            label={label}
            value={scores[key]}
            onChange={(v) => { setScores((prev) => ({ ...prev, [key]: v })); setSaved(false) }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          합계:{' '}
          <span className={total >= 40 ? 'text-green-700' : total >= 30 ? 'text-yellow-700' : 'text-red-700'}>
            {total}점 / 50점
          </span>
        </span>
        <button onClick={handleSave} disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 mt-2">저장됨</p>}
    </div>
  )
}

interface Props {
  assessmentId: string
  items: GrantAssessmentItem[]
}

export function GrantSuitabilityForm({ assessmentId, items }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-4">먼저 신청품목 탭에서 품목을 등록하세요</p>
  }
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ItemSuitabilityCard key={item.item_order} assessmentId={assessmentId} item={item} />
      ))}
    </div>
  )
}
