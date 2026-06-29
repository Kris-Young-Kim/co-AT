'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { cancelMyAppointment, type MyAppointment } from '@/actions/appointment-actions'
import { APPOINTMENT_SERVICE_LABELS } from '@/lib/constants/mappings'
import { CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'

interface MyAppointmentListProps {
  appointments: MyAppointment[]
}

export function MyAppointmentList({ appointments }: MyAppointmentListProps) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function handleCancel(id: string) {
    if (!confirm('예약을 취소하시겠습니까?')) return
    setCancellingId(id)
    const result = await cancelMyAppointment(id)
    setCancellingId(null)
    if (result.success) router.refresh()
    else alert(result.error ?? '취소에 실패했습니다')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          상담 예약 ({appointments.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">예약 신청 내역이 없습니다</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/appointments">예약 신청하기</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map(appt => (
              <div key={appt.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {APPOINTMENT_SERVICE_LABELS[appt.service_type] ?? appt.service_type}
                  </span>
                  <AppointmentStatusBadge status={appt.status} />
                </div>

                {appt.slot_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {appt.slot_date}
                    {appt.slot_time && (
                      <>
                        <Clock className="h-3.5 w-3.5 ml-1" />
                        {appt.slot_time.slice(0, 5)}
                        {appt.duration_minutes && ` (${appt.duration_minutes}분)`}
                      </>
                    )}
                  </div>
                )}

                {appt.staff_note && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    담당자 메모: {appt.staff_note}
                  </p>
                )}

                {(appt.status === 'pending_review' || appt.status === 'confirmed') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    disabled={cancellingId === appt.id}
                    onClick={() => handleCancel(appt.id)}
                  >
                    {cancellingId === appt.id ? '취소 중...' : '예약 취소'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
