'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import {
  confirmAppointmentRequest,
  rejectAppointmentRequest,
  type AppointmentRequestWithDetails,
} from '@/actions/appointment-actions'
import { APPOINTMENT_SERVICE_LABELS } from '@/lib/constants/mappings'
import { ChevronDown, ChevronUp, CalendarDays, Clock, User, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AppointmentRequestTableProps {
  requests: AppointmentRequestWithDetails[]
}

export function AppointmentRequestTable({ requests }: AppointmentRequestTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [staffNote, setStaffNote] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function handleConfirm(id: string) {
    setLoading(`confirm-${id}`)
    const result = await confirmAppointmentRequest(id, { staffNote: staffNote || undefined })
    setLoading(null)
    if (result.success) {
      setExpandedId(null)
      setStaffNote('')
      router.refresh()
    } else {
      alert(result.error ?? '확정에 실패했습니다')
    }
  }

  async function handleReject(id: string) {
    setLoading(`reject-${id}`)
    const result = await rejectAppointmentRequest(id, staffNote || undefined)
    setLoading(null)
    if (result.success) {
      setExpandedId(null)
      setStaffNote('')
      router.refresh()
    } else {
      alert(result.error ?? '반려에 실패했습니다')
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        예약 신청이 없습니다
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">신청일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">희망 일시</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">서비스</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">신청인</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700">상태</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {requests.map(r => (
            <>
              <tr
                key={r.id}
                className={`hover:bg-gray-50 transition-colors ${expandedId === r.id ? 'bg-blue-50/30' : ''}`}
              >
                <td className="px-4 py-3 text-gray-600">
                  {format(new Date(r.created_at), 'MM.dd', { locale: ko })}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {r.slot_date ? (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {r.slot_date}
                      {r.slot_time && (
                        <>
                          <Clock className="h-3.5 w-3.5 text-gray-400 ml-1" />
                          {r.slot_time.slice(0, 5)}
                        </>
                      )}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {APPOINTMENT_SERVICE_LABELS[r.service_type] ?? r.service_type}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    {r.client_name ?? '미연결'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AppointmentStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setExpandedId(expandedId === r.id ? null : r.id)
                      setStaffNote('')
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    aria-label="상세 보기"
                  >
                    {expandedId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </td>
              </tr>

              {expandedId === r.id && (
                <tr key={`${r.id}-detail`}>
                  <td colSpan={6} className="px-4 py-4 bg-blue-50/20 border-t">
                    <div className="space-y-3 max-w-2xl">
                      {r.notes && (
                        <div className="flex gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                          <p className="text-gray-600">{r.notes}</p>
                        </div>
                      )}
                      {r.requester_contact && (
                        <p className="text-sm text-gray-600">연락처: {r.requester_contact}</p>
                      )}

                      {r.status === 'pending_review' && (
                        <div className="space-y-2 pt-2 border-t">
                          <Textarea
                            value={staffNote}
                            onChange={e => setStaffNote(e.target.value)}
                            placeholder="담당자 메모 (선택사항) — 확정·반려 시 신청인에게 전달됩니다"
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(r.id)}
                              disabled={loading !== null}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {loading === `confirm-${r.id}` ? '처리 중...' : '확정'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(r.id)}
                              disabled={loading !== null}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {loading === `reject-${r.id}` ? '처리 중...' : '반려'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {r.staff_note && r.status !== 'pending_review' && (
                        <div className="text-sm bg-gray-100 px-3 py-2 rounded">
                          <span className="font-medium">담당자 메모:</span> {r.staff_note}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
