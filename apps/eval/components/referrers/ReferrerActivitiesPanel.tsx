'use client'

import { useState, useTransition } from 'react'
import {
  createActivity, deleteActivity,
  ACTIVITY_TYPE_LABELS,
  type ReferrerActivity, type CreateActivityInput, type ActivityType,
} from '@/actions/referrer-actions'
import { Plus, Trash2, CalendarDays } from 'lucide-react'

const ACTIVITY_TYPES = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  mou:          'bg-purple-100 text-purple-700',
  education:    'bg-blue-100 text-blue-700',
  visit:        'bg-green-100 text-green-700',
  consultation: 'bg-yellow-100 text-yellow-700',
  other:        'bg-gray-100 text-gray-600',
}

interface Props {
  referrerId: string
  initialActivities: ReferrerActivity[]
}

export function ReferrerActivitiesPanel({ referrerId, initialActivities }: Props) {
  const [activities, setActivities] = useState(initialActivities)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<Omit<CreateActivityInput, 'referrer_id'>>({
    activity_type: 'visit',
    title: '',
    activity_date: new Date().toISOString().slice(0, 10),
    description: '',
  })

  function handleAdd() {
    if (!form.title.trim()) return
    startTransition(async () => {
      setError(null)
      const res = await createActivity({ referrer_id: referrerId, ...form })
      if (!res.success) { setError(res.error ?? '오류'); return }
      setActivities((prev) => [res.activity!, ...prev])
      setForm({ activity_type: 'visit', title: '', activity_date: new Date().toISOString().slice(0, 10), description: '' })
      setShowForm(false)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 활동 이력을 삭제하시겠습니까?')) return
    startTransition(async () => {
      const res = await deleteActivity(id, referrerId)
      if (!res.success) { setError(res.error ?? '오류'); return }
      setActivities((prev) => prev.filter((a) => a.id !== id))
    })
  }

  return (
    <div className="space-y-4">
      {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          활동 이력 추가
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-medium text-blue-900">협력 활동 기록</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">활동 유형</label>
              <select
                value={form.activity_type}
                onChange={(e) => setForm((p) => ({ ...p, activity_type: e.target.value as ActivityType }))}
                className="w-full px-3 py-1.5 border rounded-md text-sm bg-white"
              >
                {ACTIVITY_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">날짜</label>
              <input
                type="date"
                value={form.activity_date}
                onChange={(e) => setForm((p) => ({ ...p, activity_date: e.target.value }))}
                className="w-full px-3 py-1.5 border rounded-md text-sm bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="활동 제목"
                className="w-full px-3 py-1.5 border rounded-md text-sm bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">내용</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="활동 상세 내용"
                className="w-full px-3 py-1.5 border rounded-md text-sm bg-white resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !form.title.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              저장
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50">취소</button>
          </div>
        </div>
      )}

      {activities.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-6">기록된 협력 활동이 없습니다.</p>
      )}

      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_COLORS[a.activity_type as ActivityType]}`}>
                      {ACTIVITY_TYPE_LABELS[a.activity_type as ActivityType]}
                    </span>
                    <span className="text-xs text-gray-400">{a.activity_date}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{a.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={isPending}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
