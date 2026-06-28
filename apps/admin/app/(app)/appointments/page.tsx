export const dynamic = 'force-dynamic'

import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { redirect } from 'next/navigation'
import { getPendingAppointmentRequests, getAllAppointmentRequests, getAppointmentSlots } from '@/actions/appointment-actions'
import { AppointmentManagementContent } from './AppointmentManagementContent'

export default async function AppointmentsManagePage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) redirect('/')

  const now = new Date()
  const [pendingResult, allResult, slotsResult] = await Promise.all([
    getPendingAppointmentRequests(),
    getAllAppointmentRequests(),
    getAppointmentSlots(now.getFullYear(), now.getMonth() + 1),
  ])

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">예약 관리</h1>
        <p className="text-sm text-gray-500">
          상담 예약 신청 확인·배정 및 예약 가능 슬롯을 관리합니다
        </p>
      </div>
      <AppointmentManagementContent
        initialPendingRequests={pendingResult.requests ?? []}
        initialAllRequests={allResult.requests ?? []}
        initialSlots={slotsResult.slots ?? []}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth() + 1}
      />
    </div>
  )
}
