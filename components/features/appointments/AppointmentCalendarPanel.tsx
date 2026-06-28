'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SlotFormDialog } from './SlotFormDialog'
import { deleteAppointmentSlot, updateAppointmentSlot, type AppointmentSlot } from '@/actions/appointment-actions'
import { Plus, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react'

function isoWeek(dateStr: string) {
  return new Date(dateStr).getDay()
}

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const days: (string | null)[] = Array(first.getDay()).fill(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return days
}

interface AppointmentCalendarPanelProps {
  slots: AppointmentSlot[]
  year: number
  month: number
}

export function AppointmentCalendarPanel({ slots, year: initYear, month: initMonth }: AppointmentCalendarPanelProps) {
  const router = useRouter()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const days = buildCalendar(year, month)
  const slotsByDate = slots.reduce<Record<string, AppointmentSlot[]>>((acc, s) => {
    if (!acc[s.slot_date]) acc[s.slot_date] = []
    acc[s.slot_date].push(s)
    return acc
  }, {})

  const selectedSlots = selectedDate ? (slotsByDate[selectedDate] ?? []) : []

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('이 슬롯을 삭제하시겠습니까?')) return
    setDeletingId(id)
    const result = await deleteAppointmentSlot(id)
    setDeletingId(null)
    if (result.success) router.refresh()
    else alert(result.error ?? '삭제에 실패했습니다')
  }

  async function handleToggleActive(slot: AppointmentSlot) {
    await updateAppointmentSlot(slot.id, { is_active: !slot.is_active })
    router.refresh()
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Mini calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {year}년 {month}월
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />
            const hasSlots = !!slotsByDate[date]
            const isToday = date === today
            const isSelected = date === selectedDate
            const isPast = date < today
            void isoWeek
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date === selectedDate ? null : date)}
                className={`text-xs py-1.5 rounded transition-colors relative ${
                  isSelected ? 'bg-primary text-primary-foreground' :
                  isToday ? 'border border-primary text-primary font-semibold' :
                  isPast ? 'text-gray-300' :
                  'hover:bg-gray-100'
                }`}
              >
                {date.slice(-2).replace(/^0/, '')}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <SlotFormDialog defaultDate={selectedDate ?? undefined}>
            <Button size="sm" className="w-full gap-1.5">
              <Plus className="h-4 w-4" />
              슬롯 추가{selectedDate && ` (${selectedDate})`}
            </Button>
          </SlotFormDialog>
        </div>
      </div>

      {/* Slot list for selected date */}
      <div>
        {!selectedDate ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            날짜를 선택하면 슬롯 목록이 표시됩니다
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold mb-3">{selectedDate} 슬롯</h3>
            {selectedSlots.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 슬롯이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {selectedSlots.map(slot => (
                  <div key={slot.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{slot.slot_time.slice(0, 5)}</span>
                          <span className="text-xs text-gray-500">{slot.duration_minutes}분</span>
                          {!slot.is_active && (
                            <span className="text-xs text-red-500">비활성</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          {slot.current_bookings}/{slot.max_bookings}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {slot.service_types.map(s => (
                            <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                              {s === 'consult' ? '상담' : s === 'assessment' ? '평가' : s === 'exhibition' ? '체험' : '기타'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleActive(slot)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded border"
                        >
                          {slot.is_active ? '비활성화' : '활성화'}
                        </button>
                        <SlotFormDialog slot={slot}>
                          <button className="p-1.5 rounded hover:bg-gray-100">
                            <Pencil className="h-3.5 w-3.5 text-gray-400" />
                          </button>
                        </SlotFormDialog>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={deletingId === slot.id || slot.current_bookings > 0}
                          className="p-1.5 rounded hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {slot.notes && (
                      <p className="text-xs text-gray-400 mt-2 border-t pt-2">{slot.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
