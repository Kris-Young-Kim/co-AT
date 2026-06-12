"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { submitMyIPPAPostMeasurement, type PortalIPPAAssessment } from "@/actions/portal-actions"

interface Props {
  assessments: PortalIPPAAssessment[]
}

const SCORE_LABELS: Record<number, string> = {
  0: "0 — 어려움 없음",
  1: "1 — 약간 어려움",
  2: "2 — 보통",
  3: "3 — 상당히 어려움",
  4: "4 — 매우 어려움",
  5: "5 — 전혀 할 수 없음",
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function OutcomeBadge({ score }: { score: number }) {
  const positive = score > 0
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
        positive
          ? "bg-green-100 text-green-700"
          : score === 0
          ? "bg-gray-100 text-gray-600"
          : "bg-red-50 text-red-600"
      }`}
    >
      {positive ? "▲" : score === 0 ? "─" : "▼"}
      {score > 0 ? "+" : ""}
      {score.toFixed(2)}점
    </span>
  )
}

function RadarChart({ items }: { items: PortalIPPAAssessment["items"] }) {
  const n = items.length
  if (n < 3 || items.every((it) => it.post_score === null)) return null

  const cx = 100, cy = 100, maxR = 72

  function toPoints(scores: (number | null)[]) {
    return scores
      .map((s, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2
        const r = ((s ?? 0) / 5) * maxR
        return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
      })
      .join(" ")
  }

  return (
    <div className="mt-3 flex justify-center">
      <svg width={200} height={200} viewBox="0 0 200 200">
        {[1, 2, 3, 4, 5].map((level) => (
          <circle
            key={level}
            cx={cx} cy={cy}
            r={(level / 5) * maxR}
            fill="none"
            stroke={level === 5 ? "#e5e7eb" : "#f3f4f6"}
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: n }).map((_, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={(cx + maxR * Math.cos(angle)).toFixed(1)}
              y2={(cy + maxR * Math.sin(angle)).toFixed(1)}
              stroke="#e5e7eb" strokeWidth="1"
            />
          )
        })}
        <polygon
          points={toPoints(items.map((it) => it.pre_score))}
          fill="rgba(251,146,60,0.15)" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"
        />
        <polygon
          points={toPoints(items.map((it) => it.post_score))}
          fill="rgba(34,197,94,0.2)" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"
        />
        {items.map((item, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          const label = item.problem.length > 6 ? item.problem.slice(0, 5) + "…" : item.problem
          return (
            <text
              key={i}
              x={(cx + (maxR + 15) * Math.cos(angle)).toFixed(1)}
              y={(cy + (maxR + 15) * Math.sin(angle)).toFixed(1)}
              textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#9ca3af"
            >
              {label}
            </text>
          )
        })}
        <rect x={52} y={187} width={8} height={8} fill="rgba(251,146,60,0.4)" stroke="#f97316" strokeWidth="1" />
        <text x={63} y={191} fontSize="8" fill="#6b7280" dominantBaseline="middle">지원 전</text>
        <rect x={96} y={187} width={8} height={8} fill="rgba(34,197,94,0.4)" stroke="#22c55e" strokeWidth="1" />
        <text x={107} y={191} fontSize="8" fill="#6b7280" dominantBaseline="middle">지원 후</text>
      </svg>
    </div>
  )
}

function AssessmentCard({ assessment, onComplete }: {
  assessment: PortalIPPAAssessment
  onComplete: (id: string, updated: PortalIPPAAssessment) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [postDate, setPostDate] = useState(today)
  const [postScores, setPostScores] = useState<Record<number, number>>(
    Object.fromEntries(assessment.items.map((it, i) => [i, it.pre_score]))
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitMyIPPAPostMeasurement(assessment.id, {
        post_date: postDate,
        items: assessment.items.map((it, i) => ({
          problem: it.problem,
          pre_score: it.pre_score,
          post_score: postScores[i] ?? it.pre_score,
        })),
      })
      if (result.success) {
        onComplete(assessment.id, {
          ...assessment,
          post_date: postDate,
          status: "completed",
          outcome_score: result.outcomeScore ?? null,
          items: assessment.items.map((it, i) => ({
            ...it,
            post_score: postScores[i] ?? it.pre_score,
          })),
        })
        setShowForm(false)
      } else {
        setError(result.error ?? "제출에 실패했습니다")
      }
    })
  }

  return (
    <div className="border rounded-lg p-4 bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-sm font-semibold">{assessment.assessment_year}년</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            assessment.status === "completed"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {assessment.status === "completed" ? "완료" : "사후 측정 대기"}
        </span>
        {assessment.outcome_score !== null && (
          <OutcomeBadge score={assessment.outcome_score} />
        )}
        <div className="text-xs text-muted-foreground ml-auto">
          {assessment.pre_date && <span>지원 전: {assessment.pre_date}</span>}
          {assessment.post_date && <span className="ml-2">지원 후: {assessment.post_date}</span>}
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-left py-1.5 pr-3 font-medium">활동 영역</th>
              <th className="text-center py-1.5 px-2 font-medium">지원 전</th>
              {assessment.status === "completed" && (
                <>
                  <th className="text-center py-1.5 px-2 font-medium">지원 후</th>
                  <th className="text-center py-1.5 px-2 font-medium">변화</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {assessment.items.map((item, i) => {
              const diff = item.post_score !== null ? item.pre_score - item.post_score : null
              return (
                <tr key={i} className="border-b border-muted/40">
                  <td className="py-1.5 pr-3 text-foreground">{item.problem}</td>
                  <td className="py-1.5 px-2 text-center font-medium">{item.pre_score}점</td>
                  {assessment.status === "completed" && (
                    <>
                      <td className="py-1.5 px-2 text-center font-medium">
                        {item.post_score !== null ? `${item.post_score}점` : "—"}
                      </td>
                      <td className="py-1.5 px-2 text-center font-semibold">
                        {diff !== null && (
                          <span className={diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"}>
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

      {/* Radar chart for completed */}
      {assessment.status === "completed" && <RadarChart items={assessment.items} />}

      {/* Post measurement form for pre_only */}
      {assessment.status === "pre_only" && (
        <div className="mt-3">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              + 지원 후 측정 제출하기
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-2 p-3 bg-blue-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-blue-800">
                지원 후 측정 — 보조기기 지원 후 현재 어려움 정도를 선택해 주세요
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">측정일 *</label>
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
                  <div key={i} className="space-y-1">
                    <span className="text-xs font-medium text-gray-700">{item.problem}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 shrink-0">지원 전: {item.pre_score}점</span>
                      <select
                        value={postScores[i] ?? item.pre_score}
                        onChange={(e) =>
                          setPostScores((prev) => ({ ...prev, [i]: parseInt(e.target.value) }))
                        }
                        className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none"
                      >
                        {[0, 1, 2, 3, 4, 5].map((s) => (
                          <option key={s} value={s}>{SCORE_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
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
                  {isPending ? "제출 중..." : "제출하기"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
        <p className="mt-2 text-xs text-muted-foreground italic">{assessment.notes}</p>
      )}
    </div>
  )
}

export function PortalIPPAList({ assessments: initialAssessments }: Props) {
  const [assessments, setAssessments] = useState(initialAssessments)

  function handleComplete(id: string, updated: PortalIPPAAssessment) {
    setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          기능 성과 측정 (K-IPPA)
          {assessments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({assessments.length}건)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            측정 내역이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <AssessmentCard key={a.id} assessment={a} onComplete={handleComplete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
