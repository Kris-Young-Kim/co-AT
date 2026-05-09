'use client'

import { useState, useTransition } from 'react'
import { createMaintenanceLog } from '@/actions/maintenance-actions'

export function MaintenanceLogForm({ deviceId }: { deviceId: string }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'inspection' | 'repair' | 'cleaning'>('inspection')
  const [notes, setNotes] = useState('')
  const [cost, setCost] = useState('')
  const [technician, setTechnician] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createMaintenanceLog({
        device_id: deviceId,
        type,
        notes: notes.trim() || undefined,
        cost: cost ? parseInt(cost.replace(/,/g, '')) : 0,
        technician: technician.trim() || undefined,
      })
      if (result.success) {
        setOpen(false); setNotes(''); setCost(''); setTechnician('')
      } else {
        setError(result.error ?? '저장 실패')
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-blue-600 hover:underline">
        + 이력 추가
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 space-y-3">
      <p className="font-medium text-sm">점검/수리 이력 추가</p>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">유형 *</label>
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className="w-full border rounded px-2 py-1.5 text-sm">
            <option value="inspection">점검</option>
            <option value="repair">수리</option>
            <option value="cleaning">세척</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">담당자</label>
          <input value={technician} onChange={e => setTechnician(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="홍길동" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">비용(원)</label>
          <input value={cost} onChange={e => setCost(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="0" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border rounded px-2 py-1.5 text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          {isPending ? '저장 중...' : '저장'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">취소</button>
      </div>
    </form>
  )
}
