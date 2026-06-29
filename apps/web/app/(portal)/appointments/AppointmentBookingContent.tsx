'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { MyAppointmentList } from '@/components/features/appointments/MyAppointmentList'
import {
  requestAppointment,
  type AppointmentSlot,
  type MyAppointment,
} from '@/actions/appointment-actions'
import { APPOINTMENT_SERVICE_LABELS } from '@/lib/constants/mappings'
import { CalendarDays, Clock, Users, ChevronRight } from 'lucide-react'

interface AppointmentBookingContentProps {
  slots: AppointmentSlot[]
  myAppointments: MyAppointment[]
}

type Tab = 'book' | 'mine'

const SERVICE_OPTIONS = Object.entries(APPOINTMENT_SERVICE_LABELS)

function groupByDate(slots: AppointmentSlot[]): Record<string, AppointmentSlot[]> {
  return slots.reduce<Record<string, AppointmentSlot[]>>((acc, s) => {
    if (!acc[s.slot_date]) acc[s.slot_date] = []
    acc[s.slot_date].push(s)
    return acc
  }, {})
}

export function AppointmentBookingContent({ slots, myAppointments }: AppointmentBookingContentProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('book')
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [serviceType, setServiceType] = useState('')
  const [notes, setNotes] = useState('')
  const [requesterName, setRequesterName] = useState('')
  const [requesterContact, setRequesterContact] = useState('')
  const [loading, setLoading] = useState(false)

  const slotsByDate = groupByDate(slots)
  const dates = Object.keys(slotsByDate).sort()

  function openDialog(slot: AppointmentSlot) {
    setSelectedSlot(slot)
    setServiceType(slot.service_types[0] ?? 'consult')
    setNotes('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot || !serviceType) return
    setLoading(true)
    const result = await requestAppointment({
      slot_id: selectedSlot.id,
      service_type: serviceType,
      notes: notes || undefined,
      requester_name: requesterName || undefined,
      requester_contact: requesterContact || undefined,
    })
    setLoading(false)
    if (result.success) {
      setSelectedSlot(null)
      router.refresh()
      setTab('mine')
    } else {
      alert(result.error ?? '예약 신청에 실패했습니다')
    }
  }

  const pendingCount = myAppointments.filter(a => a.status === 'pending_review').length

  return (
    <>
      {/* 탭 */}
      <div className="flex gap-1.5 mb-8 border-b pb-4">
        {[
          { key: 'book' as Tab, label: '예약 신청' },
          { key: 'mine' as Tab, label: `내 예약${pendingCount > 0 ? ` (${myAppointments.length})` : myAppointments.length > 0 ? ` (${myAppointments.length})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 예약 신청 탭 */}
      {tab === 'book' && (
        <div>
          {dates.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>현재 예약 가능한 시간이 없습니다</p>
              <p className="text-sm mt-1">담당자에게 문의하시거나 나중에 다시 확인해 주세요</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dates.map(date => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {date}
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slotsByDate[date].map(slot => {
                      const remaining = slot.max_bookings - slot.current_bookings
                      return (
                        <button
                          key={slot.id}
                          onClick={() => openDialog(slot)}
                          className="text-left border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {slot.slot_time.slice(0, 5)}
                                <span className="text-xs font-normal text-muted-foreground">
                                  ({slot.duration_minutes}분)
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {slot.service_types.map(s => (
                                  <span key={s} className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                    {APPOINTMENT_SERVICE_LABELS[s] ?? s}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            {remaining === 1 ? '마지막 1자리' : `${remaining}자리 남음`}
                          </div>
                          {slot.notes && (
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{slot.notes}</p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 내 예약 탭 */}
      {tab === 'mine' && (
        <MyAppointmentList appointments={myAppointments} />
      )}

      {/* 예약 신청 다이얼로그 */}
      <Dialog open={!!selectedSlot} onOpenChange={open => !open && setSelectedSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>상담 예약 신청</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium">{selectedSlot.slot_date}</p>
                  <p className="text-muted-foreground">
                    {selectedSlot.slot_time.slice(0, 5)} ({selectedSlot.duration_minutes}분)
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label>서비스 유형 *</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SERVICE_OPTIONS
                    .filter(([key]) => selectedSlot.service_types.includes(key))
                    .map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setServiceType(key)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          serviceType === key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>이름</Label>
                  <Input
                    value={requesterName}
                    onChange={e => setRequesterName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-1">
                  <Label>연락처</Label>
                  <Input
                    value={requesterContact}
                    onChange={e => setRequesterContact(e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>문의 내용 (선택)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="상담 받고 싶은 내용을 간략히 적어주세요..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedSlot(null)}>
                  취소
                </Button>
                <Button type="submit" disabled={loading || !serviceType}>
                  {loading ? '신청 중...' : '예약 신청'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
