'use client'

import { useState, useTransition } from 'react'
import {
  createIPPAAssessment,
  saveIPPAPostMeasurement,
  deleteIPPAAssessment,
  type IPPAAssessment,
  type IPPAItem,
} from '@/actions/ippa-actions'

interface Props {
  initialAssessments: IPPAAssessment[]
  clientId: string
}

const SCORE_LABELS: Record<number, string> = {
  0: '0-어려움없음',
  1: '1-약간',
  2: '2-보통',
  3: '3-상당히',
  4: '4-매우심함',
  5: '5-전혀불가',
}

function ScoreBadge({ score, improved }: { score: number; improved?: boolean }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold'
  if (improved) return <span className={`${base} bg-green-100 text-green-700`}>{score}점</span>
  const colors = ['bg-gray-100 text-gray-600', 'bg-yellow-50 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-orange-200 text-orange-800', 'bg-red-100 text-red-700', 'bg-red-200 text-red-800']
  return <span className={`${base} ${colors[score] ?? colors[5]}`}>{score}점</span>
}

function OutcomeDisplay({ score }: { score: number | null }) {
  if (score === null) return null
  const positive = score > 0
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${positive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
      <span>{positive ? '▲' : score === 0 ? '─' : '▼'}</span>
      <span>성과점수 {score > 0 ? '+' : ''}{score.toFixed(2)}</span>
      {positive && <span className="text-xs font-normal text-green-600">(개선됨)</span>}
    </div>
  )
}

function IPPACard({
  assessment,
  onDelete,
  onPostSave,
}: {
  assessment: IPPAAssessment
  onDelete: (id: string) => void
  onPostSave: (id: string, updated: IPPAAssessment) => void
}) {
  const [showPost, setShowPost] = useState(false)
  const [postDate, setPostDate] = useState('')
  const [postScores, setPostScores] = useState<Record<number, number>>(
    Object.fromEntries(assessment.items.map((it, i) => [i, it.post_score ?? it.pre_score]))
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveIPPAPostMeasurement(assessment.id, assessment.client_id, {
        post_date: postDate,
        items: assessment.items.map((it, i) => ({
          problem: it.problem,
          pre_score: it.pre_score,
          post_score: postScores[i] ?? it.pre_score,
        })),
      })
      if (result.success) {
        onPostSave(assessment.id, {
          ...assessment,
          post_date: postDate,
          status: 'completed',
          outcome_score: result.outcomeScore ?? null,
          items: assessment.items.map((it, i) => ({
            ...it,
            post_score: postScores[i] ?? it.pre_score,
          })),
        })
        setShowPost(false)
      } else {
        setError(result.error ?? '사후 측정 저장 실패')
      }
    })
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{assessment.assessment_year}년</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${assessment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {assessment.status === 'completed' ? '완료' : '사전측정만'}
            </span>
            {assessment.outcome_score !== null && (
              <OutcomeDisplay score={assessment.outcome_score} />
            )}
          </div>
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            {assessment.pre_date && <span>사전: {assessment.pre_date}</span>}
            {assessment.post_date && <span>사후: {assessment.post_date}</span>}
          </div>
        </div>
        <button
          onClick={() => onDelete(assessment.id)}
          className="text-xs text-red-400 hover:text-red-600 shrink-0"
        >
          삭제
        </button>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="text-left py-1.5 pr-3 font-medium">활동 문제</th>
              <th className="text-center py-1.5 px-2 font-medium">사전</th>
              {assessment.status === 'completed' && (
                <>
                  <th className="text-center py-1.5 px-2 font-medium">사후</th>
                  <th className="text-center py-1.5 px-2 font-medium">변화</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {assessment.items.map((item, i) => {
              const diff = item.post_score !== null ? item.pre_score - item.post_score : null
              return (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1.5 pr-3 text-gray-700">{item.problem}</td>
                  <td className="py-1.5 px-2 text-center">
                    <ScoreBadge score={item.pre_score} />
                  </td>
                  {assessment.status === 'completed' && (
                    <>
                      <td className="py-1.5 px-2 text-center">
                        {item.post_score !== null
                          ? <ScoreBadge score={item.post_score} improved={diff !== null && diff > 0} />
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {diff !== null && (
                          <span className={`font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Post measurement action */}
      {assessment.status === 'pre_only' && (
        <div className="mt-3">
          {!showPost ? (
            <button
              onClick={() => setShowPost(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + 사후 측정 입력
            </button>
          ) : (
            <form onSubmit={handlePostSubmit} className="mt-2 p-3 bg-blue-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-blue-800">사후 측정 (지원 후 4~6주)</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">사후 측정일 *</label>
                <input
                  type="date"
                  required
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                  className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                {assessment.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-700 flex-1 min-w-0 truncate">{item.problem}</span>
                    <span className="text-xs text-gray-400 shrink-0">사전:{item.pre_score}</span>
                    <select
                      value={postScores[i] ?? item.pre_score}
                      onChange={(e) => setPostScores((prev) => ({ ...prev, [i]: parseInt(e.target.value) }))}
                      className="px-2 py-1 border rounded text-xs focus:outline-none"
                    >
                      {[0, 1, 2, 3, 4, 5].map((s) => (
                        <option key={s} value={s}>{SCORE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? '저장 중...' : '사후 측정 저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPost(false)}
                  className="px-3 py-1.5 text-gray-600 text-xs rounded hover:bg-gray-100"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {assessment.notes && (
        <p className="mt-2 text-xs text-gray-500 italic">{assessment.notes}</p>
      )}
    </div>
  )
}

export function ClientIPPA({ initialAssessments, clientId }: Props) {
  const [assessments, setAssessments] = useState<IPPAAssessment[]>(initialAssessments)
  const [showForm, setShowForm] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [preDate, setPreDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ problem: string; pre_score: number }>>([
    { problem: '', pre_score: 3 },
    { problem: '', pre_score: 3 },
    { problem: '', pre_score: 3 },
  ])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    if (items.length < 5) setItems((prev) => [...prev, { problem: '', pre_score: 3 }])
  }
  function removeItem(i: number) {
    if (items.length > 3) setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const validItems = items.filter((it) => it.problem.trim())
    if (validItems.length < 3) {
      setError('활동 문제를 3개 이상 입력해주세요')
      return
    }
    startTransition(async () => {
      const result = await createIPPAAssessment(clientId, {
        assessment_year: year,
        pre_date: preDate,
        items: validItems,
        notes: notes || null,
      })
      if (result.success && result.id) {
        const newAssessment: IPPAAssessment = {
          id: result.id,
          client_id: clientId,
          assessment_year: year,
          pre_date: preDate,
          post_date: null,
          items: validItems.map((it) => ({ ...it, post_score: null })),
          outcome_score: null,
          notes: notes || null,
          status: 'pre_only',
          staff_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setAssessments((prev) => [newAssessment, ...prev])
        setShowForm(false)
        setPreDate('')
        setNotes('')
        setItems([{ problem: '', pre_score: 3 }, { problem: '', pre_score: 3 }, { problem: '', pre_score: 3 }])
      } else {
        setError(result.error ?? '저장에 실패했습니다')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteIPPAAssessment(id, clientId)
      if (result.success) setAssessments((prev) => prev.filter((a) => a.id !== id))
    })
  }

  function handlePostSave(id: string, updated: IPPAAssessment) {
    setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            K-IPPA 기능성과 측정
            {assessments.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({assessments.length}건)</span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">활동 문제 3~5개 · 사전/사후 5점 척도 · 성과점수 자동 계산</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {showForm ? '취소' : '+ 사전 측정 등록'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">연도</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-2 py-1.5 border rounded text-sm focus:outline-none"
              >
                {[0, 1, 2].map((offset) => {
                  const y = new Date().getFullYear() - offset
                  return <option key={y} value={y}>{y}년</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">사전 측정일 *</label>
              <input
                type="date"
                required
                value={preDate}
                onChange={(e) => setPreDate(e.target.value)}
                className="px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">활동 문제 영역 (3~5개) *</label>
              {items.length < 5 && (
                <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800">
                  + 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <input
                    value={item.problem}
                    onChange={(e) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, problem: e.target.value } : it))}
                    placeholder="예: 외출 시 보행, 식사 준비, 개인위생..."
                    className="flex-1 px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={item.pre_score}
                    onChange={(e) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, pre_score: parseInt(e.target.value) } : it))}
                    className="px-2 py-1.5 border rounded text-xs focus:outline-none w-36"
                  >
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>{SCORE_LABELS[s]}</option>
                    ))}
                  </select>
                  {items.length > 3 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">0 = 어려움 없음 · 5 = 전혀 할 수 없음</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">비고</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-sm focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? '저장 중...' : '사전 측정 저장'}
          </button>
        </form>
      )}

      {assessments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6 border rounded-lg bg-gray-50">
          K-IPPA 측정 내역이 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <IPPACard
              key={a.id}
              assessment={a}
              onDelete={handleDelete}
              onPostSave={handlePostSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
