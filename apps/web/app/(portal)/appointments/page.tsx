export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getAvailableSlots, getMyAppointments } from '@/actions/appointment-actions'
import { AppointmentBookingContent } from './AppointmentBookingContent'

export default async function AppointmentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const now = new Date()
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const [slotsResult, myResult] = await Promise.all([
    getAvailableSlots(now.toISOString().slice(0, 10), twoWeeksLater.toISOString().slice(0, 10)),
    getMyAppointments(),
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">상담 예약</h1>
        <p className="text-muted-foreground">
          원하는 날짜와 시간을 선택하여 상담을 예약하세요
        </p>
      </div>
      <AppointmentBookingContent
        slots={slotsResult.slots ?? []}
        myAppointments={myResult.appointments ?? []}
      />
    </div>
  )
}
