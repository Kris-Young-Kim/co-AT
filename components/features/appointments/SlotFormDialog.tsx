'use client'

import { useState, type ReactNode, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createAppointmentSlot, updateAppointmentSlot, type AppointmentSlot, type CreateSlotInput } from '@/actions/appointment-actions'

const SERVICE_OPTIONS = [
  { value: 'consult', label: '보조기기 상담' },
  { value: 'assessment', label: '보조기기 평가' },
  { value: 'exhibition', label: '체험·전시' },
  { value: 'etc', label: '기타 문의' },
]

interface SlotFormDialogProps {
  slot?: AppointmentSlot
  defaultDate?: string
  children: ReactNode
  onSuccess?: () => void
}

export function SlotFormDialog({ slot, defaultDate, children, onSuccess }: SlotFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateSlotInput>({
    slot_date: slot?.slot_date ?? defaultDate ?? '',
    slot_time: slot?.slot_time?.slice(0, 5) ?? '',
    duration_minutes: slot?.duration_minutes ?? 60,
    service_types: slot?.service_types ?? ['consult'],
    max_bookings: slot?.max_bookings ?? 1,
    notes: slot?.notes ?? '',
    is_active: slot?.is_active ?? true,
  })

  function toggleService(value: string) {
    setForm(prev => ({
      ...prev,
      service_types: prev.service_types?.includes(value)
        ? prev.service_types.filter(s => s !== value)
        : [...(prev.service_types ?? []), value],
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.slot_date || !form.slot_time) return
    if (!form.service_types?.length) { alert('서비스 유형을 하나 이상 선택하세요'); return }

    setLoading(true)
    const result = slot
      ? await updateAppointmentSlot(slot.id, form)
      : await createAppointmentSlot(form)
    setLoading(false)

    if (result.success) {
      setOpen(false)
      router.refresh()
      onSuccess?.()
    } else {
      alert(result.error ?? '저장에 실패했습니다')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{slot ? '슬롯 수정' : '예약 슬롯 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>날짜 *</Label>
              <Input
                type="date"
                value={form.slot_date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(p => ({ ...p, slot_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>시작 시간 *</Label>
              <Input
                type="time"
                value={form.slot_time}
                onChange={e => setForm(p => ({ ...p, slot_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>소요 시간</Label>
              <select
                value={form.duration_minutes}
                onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {[30, 60, 90, 120].map(m => (
                  <option key={m} value={m}>{m}분</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>최대 예약 인원</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.max_bookings}
                onChange={e => setForm(p => ({ ...p, max_bookings: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>서비스 유형 *</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SERVICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleService(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.service_types?.includes(opt.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>메모 (내부용)</Label>
            <Textarea
              value={form.notes ?? ''}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="슬롯에 대한 내부 메모..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is_active" className="cursor-pointer">예약 활성화</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit" disabled={loading}>
              {loading ? '저장 중...' : slot ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
