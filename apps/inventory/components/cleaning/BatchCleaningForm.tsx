'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logBatchCleaning } from '@/actions/cleaning-actions'
import type { DeviceCleaningStatus } from '@/actions/cleaning-actions'

interface BatchCleaningFormProps {
  devices: DeviceCleaningStatus[]
}

export function BatchCleaningForm({ devices }: BatchCleaningFormProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().split('T')[0])
  const [technician, setTechnician] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDevice(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === devices.length) setSelected(new Set())
    else setSelected(new Set(devices.map(d => d.device_id)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.size === 0) { setError('기기를 1개 이상 선택하세요'); return }
    if (!technician.trim()) { setError('담당자를 입력하세요'); return }
    setSaving(true)
    setError(null)
    const result = await logBatchCleaning({
      deviceIds: Array.from(selected),
      performedAt,
      technician,
      notes: notes || undefined,
    })
    setSaving(false)
    if (!result.success) { setError(result.error ?? '저장 실패'); return }
    setSelected(new Set())
    setNotes('')
    router.refresh()
  }

  const INPUT = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-5">
      <h2 className="font-semibold text-gray-900">일괄 세척 등록</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">세척일 <span className="text-red-500">*</span></label>
          <input type="date" value={performedAt} onChange={e => setPerformedAt(e.target.value)} className={INPUT} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">담당자 <span className="text-red-500">*</span></label>
          <input type="text" value={technician} onChange={e => setTechnician(e.target.value)} placeholder="이름" className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="세척 방법, 특이사항 등" className={INPUT} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600">기기 선택 ({selected.size}/{devices.length})</p>
          <button type="button" onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
            {selected.size === devices.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
          {devices.map(d => (
            <label key={d.device_id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(d.device_id)}
                onChange={() => toggleDevice(d.device_id)}
                className="rounded border-gray-300"
              />
              <span className="flex-1 text-sm text-gray-800">{d.device_name}</span>
              {d.last_cleaned_at ? (
                <span className={`text-xs ${(d.days_since_cleaning ?? 0) > 180 ? 'text-red-500' : 'text-gray-400'}`}>
                  {d.days_since_cleaning}일 경과
                </span>
              ) : (
                <span className="text-xs text-orange-500">기록 없음</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || selected.size === 0}
        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '저장 중...' : `${selected.size}개 기기 세척 기록 등록`}
      </button>
    </form>
  )
}
