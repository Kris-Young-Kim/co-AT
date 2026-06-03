'use client'

import { useState, useTransition } from 'react'
import type { EvaluationWithEmployee, HrEmployee, CreateEvaluationInput, EvalPeriod, EvalRating, EvalStatus } from '@co-at/types'
import {
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  changeEvaluationStatus,
} from '@/actions/evaluation-actions'

const PERIOD_LABEL: Record<EvalPeriod, string>  = { mid: '중간평가', year_end: '연말평가' }
const RATING_COLOR: Record<EvalRating, string>  = {
  S: 'bg-purple-100 text-purple-800',
  A: 'bg-blue-100 text-blue-800',
  B: 'bg-green-100 text-green-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-red-100 text-red-800',
}
const STATUS_COLOR: Record<EvalStatus, string> = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
}
const STATUS_LABEL: Record<EvalStatus, string> = {
  draft: '초안', submitted: '제출됨', confirmed: '확정',
}

type Props = {
  initialEvals: EvaluationWithEmployee[]
  employees: Pick<HrEmployee, 'id' | 'name' | 'department' | 'position'>[]
  year: number
}

type FormState = {
  employee_id:  string
  evaluator_id: string
  period:       EvalPeriod
  rating:       EvalRating | ''
  score:        string
  strengths:    string
  improvements: string
  comment:      string
}

const EMPTY_FORM: FormState = {
  employee_id: '', evaluator_id: '', period: 'year_end',
  rating: '', score: '', strengths: '', improvements: '', comment: '',
}

export function EvaluationManager({ initialEvals, employees, year }: Props) {
  const [evals, setEvals]       = useState(initialEvals)
  const [showForm, setShowForm]  = useState(false)
  const [editing, setEditing]    = useState<EvaluationWithEmployee | null>(null)
  const [form, setForm]          = useState<FormState>(EMPTY_FORM)
  const [error, setError]        = useState('')
  const [isPending, startTrans]  = useTransition()

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(ev: EvaluationWithEmployee) {
    setEditing(ev)
    setForm({
      employee_id:  ev.employee_id,
      evaluator_id: ev.evaluator_id ?? '',
      period:       ev.period as EvalPeriod,
      rating:       (ev.rating ?? '') as EvalRating | '',
      score:        ev.score != null ? String(ev.score) : '',
      strengths:    ev.strengths ?? '',
      improvements: ev.improvements ?? '',
      comment:      ev.comment ?? '',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null) }

  function handleSubmit() {
    if (!form.employee_id) { setError('직원을 선택해주세요.'); return }

    startTrans(async () => {
      const input: CreateEvaluationInput = {
        employee_id:  form.employee_id,
        evaluator_id: form.evaluator_id || undefined,
        year,
        period:       form.period,
        rating:       (form.rating || undefined) as EvalRating | undefined,
        score:        form.score ? Number(form.score) : undefined,
        strengths:    form.strengths || undefined,
        improvements: form.improvements || undefined,
        comment:      form.comment || undefined,
      }

      if (editing) {
        const res = await updateEvaluation(editing.id, input)
        if (!res.success) { setError(res.error); return }
        setEvals(prev => prev.map(e => e.id === editing.id ? { ...e, ...res.data } : e))
      } else {
        const res = await createEvaluation(input)
        if (!res.success) { setError(res.error); return }
        const newEval: EvaluationWithEmployee = {
          ...res.data,
          employee:  employees.find(e => e.id === form.employee_id)
            ? { name: employees.find(e => e.id === form.employee_id)!.name, department: employees.find(e => e.id === form.employee_id)!.department, position: employees.find(e => e.id === form.employee_id)!.position }
            : null,
          evaluator: null,
        }
        setEvals(prev => [newEval, ...prev])
      }
      closeForm()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    startTrans(async () => {
      const res = await deleteEvaluation(id)
      if (res.success) setEvals(prev => prev.filter(e => e.id !== id))
    })
  }

  function handleStatusChange(ev: EvaluationWithEmployee, status: EvalStatus) {
    startTrans(async () => {
      const res = await changeEvaluationStatus(ev.id, status)
      if (res.success) setEvals(prev => prev.map(e => e.id === ev.id ? { ...e, status } : e))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          + 평가 등록
        </button>
      </div>

      {evals.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">{year}년 평가 데이터가 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['직원', '부서', '평가 구분', '등급', '점수', '상태', '관리'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evals.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.employee?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{ev.employee?.department ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{PERIOD_LABEL[ev.period as EvalPeriod]}</td>
                  <td className="px-4 py-3">
                    {ev.rating ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${RATING_COLOR[ev.rating as EvalRating]}`}>
                        {ev.rating}등급
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ev.score != null ? `${ev.score}점` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[ev.status as EvalStatus]}`}>
                      {STATUS_LABEL[ev.status as EvalStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(ev)} className="text-xs text-violet-600 hover:underline">수정</button>
                      {ev.status === 'draft' && (
                        <button onClick={() => handleStatusChange(ev, 'submitted')} className="text-xs text-yellow-600 hover:underline">제출</button>
                      )}
                      {ev.status === 'submitted' && (
                        <button onClick={() => handleStatusChange(ev, 'confirmed')} className="text-xs text-green-600 hover:underline">확정</button>
                      )}
                      <button onClick={() => handleDelete(ev.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h2 className="font-semibold text-gray-900">{editing ? '평가 수정' : '평가 등록'}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">직원 *</label>
                <select
                  value={form.employee_id}
                  onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                  disabled={!!editing}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50"
                >
                  <option value="">직원 선택</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">평가 구분</label>
                  <select
                    value={form.period}
                    onChange={e => setForm(p => ({ ...p, period: e.target.value as EvalPeriod }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="mid">중간평가</option>
                    <option value="year_end">연말평가</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
                  <select
                    value={form.rating}
                    onChange={e => setForm(p => ({ ...p, rating: e.target.value as EvalRating | '' }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="">선택</option>
                    {(['S','A','B','C','D'] as EvalRating[]).map(r => (
                      <option key={r} value={r}>{r}등급</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">점수 (0~100)</label>
                <input
                  type="number" min={0} max={100}
                  value={form.score}
                  onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
                  placeholder="예: 85"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">강점</label>
                <textarea
                  rows={2} value={form.strengths}
                  onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))}
                  placeholder="주요 강점 기술"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">개선 사항</label>
                <textarea
                  rows={2} value={form.improvements}
                  onChange={e => setForm(p => ({ ...p, improvements: e.target.value }))}
                  placeholder="개선이 필요한 부분"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">평가 의견</label>
                <textarea
                  rows={3} value={form.comment}
                  onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                  placeholder="종합 평가 의견"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                {isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
