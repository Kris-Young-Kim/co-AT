'use client'

import { useState, useTransition } from 'react'
import type {
  HrTraining,
  HrEmployee,
  CreateTrainingInput,
  TrainingCategory,
  TrainingWithAttendees,
} from '@co-at/types'
import {
  createTraining,
  updateTraining,
  deleteTraining,
  upsertTrainingAttendee,
  getTrainingWithAttendees,
} from '@/actions/training-actions'

const CATEGORY_LABEL: Record<TrainingCategory, string> = {
  mandatory: '의무교육',
  voluntary: '자율교육',
  external:  '외부교육',
}
const CATEGORY_COLOR: Record<TrainingCategory, string> = {
  mandatory: 'bg-red-100 text-red-700',
  voluntary: 'bg-blue-100 text-blue-700',
  external:  'bg-green-100 text-green-700',
}

type Props = {
  initialTrainings: HrTraining[]
  employees: Pick<HrEmployee, 'id' | 'name' | 'department'>[]
}

type FormState = {
  title: string; category: TrainingCategory
  start_date: string; end_date: string
  hours: string; provider: string; description: string
}

const EMPTY_FORM: FormState = {
  title: '', category: 'voluntary', start_date: '', end_date: '',
  hours: '', provider: '', description: '',
}

export function TrainingManager({ initialTrainings, employees }: Props) {
  const [trainings, setTrainings]     = useState(initialTrainings)
  const [showForm, setShowForm]        = useState(false)
  const [editing, setEditing]          = useState<HrTraining | null>(null)
  const [form, setForm]                = useState<FormState>(EMPTY_FORM)
  const [selectedTraining, setSelected] = useState<TrainingWithAttendees | null>(null)
  const [error, setError]              = useState('')
  const [isPending, startTrans]        = useTransition()

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true)
  }
  function openEdit(t: HrTraining) {
    setEditing(t)
    setForm({
      title:       t.title,
      category:    t.category as TrainingCategory,
      start_date:  t.start_date,
      end_date:    t.end_date,
      hours:       String(t.hours),
      provider:    t.provider ?? '',
      description: t.description ?? '',
    })
    setError(''); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditing(null) }

  function handleSubmit() {
    if (!form.title || !form.start_date || !form.end_date) {
      setError('제목, 시작일, 종료일은 필수입니다.'); return
    }
    startTrans(async () => {
      const input: CreateTrainingInput = {
        title:       form.title,
        category:    form.category,
        start_date:  form.start_date,
        end_date:    form.end_date,
        hours:       Number(form.hours) || 0,
        provider:    form.provider || undefined,
        description: form.description || undefined,
      }
      if (editing) {
        const res = await updateTraining(editing.id, input)
        if (!res.success) { setError(res.error); return }
        setTrainings(prev => prev.map(t => t.id === editing.id ? res.data : t))
      } else {
        const res = await createTraining(input)
        if (!res.success) { setError(res.error); return }
        setTrainings(prev => [res.data, ...prev])
      }
      closeForm()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('교육을 삭제하시겠습니까?')) return
    startTrans(async () => {
      const res = await deleteTraining(id)
      if (res.success) {
        setTrainings(prev => prev.filter(t => t.id !== id))
        if (selectedTraining?.id === id) setSelected(null)
      }
    })
  }

  function openAttendees(t: HrTraining) {
    startTrans(async () => {
      const res = await getTrainingWithAttendees(t.id)
      if (res.success) setSelected(res.data)
    })
  }

  function handleAttendeeToggle(trainingId: string, employeeId: string, attended: boolean) {
    startTrans(async () => {
      await upsertTrainingAttendee({ training_id: trainingId, employee_id: employeeId, attended })
      // Refresh attendee list
      const res = await getTrainingWithAttendees(trainingId)
      if (res.success) setSelected(res.data)
    })
  }

  const attendeeMap = new Map(
    (selectedTraining?.attendees ?? []).map(a => [a.employee_id, a])
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
        >
          + 교육 등록
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Training List */}
        <div className="space-y-2">
          {trainings.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">등록된 교육이 없습니다.</div>
          ) : (
            trainings.map(t => (
              <div
                key={t.id}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:border-violet-300 transition-colors ${selectedTraining?.id === t.id ? 'border-violet-400 ring-1 ring-violet-300' : ''}`}
                onClick={() => openAttendees(t)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[t.category as TrainingCategory]}`}>
                        {CATEGORY_LABEL[t.category as TrainingCategory]}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.start_date} ~ {t.end_date} · {t.hours}시간
                      {t.provider && ` · ${t.provider}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(t)} className="text-xs text-violet-600 hover:underline">수정</button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Attendee Panel */}
        <div>
          {selectedTraining ? (
            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{selectedTraining.title}</p>
                  <p className="text-xs text-gray-500">참석자 관리</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xs">닫기</button>
              </div>
              <div className="divide-y max-h-80 overflow-y-auto">
                {employees.map(emp => {
                  const attendee = attendeeMap.get(emp.id)
                  const attended = attendee?.attended ?? false
                  return (
                    <div key={emp.id} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.department}</p>
                      </div>
                      <button
                        onClick={() => handleAttendeeToggle(selectedTraining.id, emp.id, !attended)}
                        disabled={isPending}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${attended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {attended ? '참석' : '미참석'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
                참석 {[...attendeeMap.values()].filter(a => a.attended).length} / {employees.length}명
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed rounded-xl flex items-center justify-center h-48 text-gray-400 text-sm">
              교육을 클릭하면 참석자를 관리할 수 있습니다
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b">
              <h2 className="font-semibold text-gray-900">{editing ? '교육 수정' : '교육 등록'}</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교육명 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="교육 제목"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as TrainingCategory }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  >
                    <option value="mandatory">의무교육</option>
                    <option value="voluntary">자율교육</option>
                    <option value="external">외부교육</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">교육시간 (h)</label>
                  <input
                    type="number" min={0} value={form.hours}
                    onChange={e => setForm(p => ({ ...p, hours: e.target.value }))}
                    placeholder="8"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
                  <input
                    type="date" value={form.start_date}
                    onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일 *</label>
                  <input
                    type="date" value={form.end_date}
                    onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교육기관</label>
                <input
                  value={form.provider}
                  onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                  placeholder="교육 주관 기관명"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  rows={3} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="교육 내용 설명"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">취소</button>
              <button
                onClick={handleSubmit} disabled={isPending}
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
