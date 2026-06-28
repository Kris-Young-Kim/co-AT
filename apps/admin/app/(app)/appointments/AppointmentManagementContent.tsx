'use client'

import { useState } from 'react'
import { AppointmentRequestTable } from '@/components/features/appointments/AppointmentRequestTable'
import { AppointmentCalendarPanel } from '@/components/features/appointments/AppointmentCalendarPanel'
import { AppointmentStatusBadge } from '@/components/features/appointments/AppointmentStatusBadge'
import type { AppointmentRequestWithDetails, AppointmentSlot } from '@/actions/appointment-actions'
import { AlertTriangle } from 'lucide-react'

type Tab = 'pending' | 'all' | 'slots'

interface AppointmentManagementContentProps {
  initialPendingRequests: AppointmentRequestWithDetails[]
  initialAllRequests: AppointmentRequestWithDetails[]
  initialSlots: AppointmentSlot[]
  initialYear: number
  initialMonth: number
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'pending_review', label: '검토 중' },
  { value: 'confirmed', label: '확정' },
  { value: 'rejected', label: '반려' },
  { value: 'cancelled', label: '취소' },
]

export function AppointmentManagementContent({
  initialPendingRequests,
  initialAllRequests,
  initialSlots,
  initialYear,
  initialMonth,
}: AppointmentManagementContentProps) {
  const [tab, setTab] = useState<Tab>('pending')
  const [statusFilter, setStatusFilter] = useState('')

  const pendingCount = initialPendingRequests.length
  const filteredAll = statusFilter
    ? initialAllRequests.filter(r => r.status === statusFilter)
    : initialAllRequests

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 border-b mb-6">
        {[
          { key: 'pending' as Tab, label: `대기 중 ${pendingCount > 0 ? `(${pendingCount})` : ''}` },
          { key: 'all' as Tab, label: `전체 예약 (${initialAllRequests.length})` },
          { key: 'slots' as Tab, label: `슬롯 관리 (${initialSlots.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.key === 'pending' && pendingCount > 0 && (
              <AlertTriangle className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
            )}
            {t.label}
          </button>
        ))}
      </div>

      {/* 대기 중 */}
      {tab === 'pending' && (
        <AppointmentRequestTable requests={initialPendingRequests} />
      )}

      {/* 전체 예약 */}
      {tab === 'all' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">상태 필터:</span>
            <div className="flex gap-1.5">
              {STATUS_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.value ? (
                    <AppointmentStatusBadge status={opt.value} />
                  ) : opt.label}
                </button>
              ))}
            </div>
          </div>
          <AppointmentRequestTable requests={filteredAll} />
        </div>
      )}

      {/* 슬롯 관리 */}
      {tab === 'slots' && (
        <AppointmentCalendarPanel
          slots={initialSlots}
          year={initialYear}
          month={initialMonth}
        />
      )}
    </div>
  )
}
