export const dynamic = 'force-dynamic'

import {
  getDailyAbsencesByMonth,
  reviewDailyAbsence,
  deleteDailyAbsence,
} from '@/actions/daily-absence-actions'
import { LogOut, CheckCircle, XCircle, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import type { DailyAbsenceType } from '@co-at/types'

interface Props {
  searchParams: Promise<{ month?: string; status?: string }>
}

const TYPE_META: Record<DailyAbsenceType, { label: string; cls: string; desc: string }> = {
  outing:  { label: '외출',     cls: 'bg-sky-100 text-sky-700',    desc: '근무 중 외출' },
  half_am: { label: '오전반차', cls: 'bg-violet-100 text-violet-700', desc: '09:00~14:00' },
  half_pm: { label: '오후반차', cls: 'bg-purple-100 text-purple-700', desc: '14:00~18:00' },
  late:    { label: '지참',     cls: 'bg-orange-100 text-orange-700', desc: '지연 출근' },
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:  { label: '대기', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', cls: 'bg-green-100 text-green-700'  },
  rejected: { label: '반려', cls: 'bg-red-100 text-red-700'      },
}

function fmtDuration(minutes: number): string {
  if (minutes === 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

export default async function AbsencesPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth
  const statusFilter = params.status

  const allAbsences = await getDailyAbsencesByMonth(month)
  const absences = statusFilter
    ? allAbsences.filter(a => a.status === statusFilter)
    : allAbsences

  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // 요약 통계
  const approved = allAbsences.filter(a => a.status === 'approved')
  const stats = {
    outing: approved.filter(a => a.type === 'outing').length,
    half_am: approved.filter(a => a.type === 'half_am').length,
    half_pm: approved.filter(a => a.type === 'half_pm').length,
    late: approved.filter(a => a.type === 'late').length,
    pending: allAbsences.filter(a => a.status === 'pending').length,
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LogOut className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">외출·반차·지참 관리</h1>
        </div>
        <div className="flex items-center gap-3">
          <form method="GET" className="flex gap-2">
            <select name="month" defaultValue={month}
              className="border rounded-md px-3 py-1.5 text-sm">
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select name="status" defaultValue={statusFilter ?? ''}
              className="border rounded-md px-3 py-1.5 text-sm">
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </form>
          <Link href="/attendance/absences/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700">
            <Plus className="h-3.5 w-3.5" />
            신청 등록
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '외출', value: stats.outing, cls: 'text-sky-600' },
          { label: '오전반차', value: stats.half_am, cls: 'text-violet-600' },
          { label: '오후반차', value: stats.half_pm, cls: 'text-purple-600' },
          { label: '지참', value: stats.late, cls: 'text-orange-600' },
          { label: '미처리', value: stats.pending, cls: 'text-yellow-600' },
        ].map(item => (
          <div key={item.label} className="bg-white border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.cls}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">날짜</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">유형</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">시간</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">소요시간</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">사유</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {absences.map(a => {
              const tm = TYPE_META[a.type as DailyAbsenceType] ?? TYPE_META.outing
              const sm = STATUS_META[a.status] ?? STATUS_META.pending
              const timeStr = a.start_time
                ? a.end_time ? `${a.start_time}~${a.end_time}` : `${a.start_time}~`
                : '—'
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">{a.date}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {a.hr_employees?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{a.hr_employees?.department ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tm.cls}`}>
                      {tm.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{tm.desc}</p>
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-gray-600">{timeStr}</td>
                  <td className="px-4 py-2.5 text-center text-gray-700">
                    {a.type === 'half_am' || a.type === 'half_pm'
                      ? '0.5일'
                      : fmtDuration(a.duration_minutes)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[160px] truncate">
                    {a.reason ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${sm.cls}`}>
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {a.status === 'pending' && (
                      <div className="flex items-center justify-center gap-1">
                        <form action={async () => {
                          'use server'
                          await reviewDailyAbsence({ id: a.id, status: 'approved', reviewed_by: '' })
                        }}>
                          <button type="submit" title="승인"
                            className="p-1 text-green-600 hover:text-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await reviewDailyAbsence({ id: a.id, status: 'rejected', reviewed_by: '' })
                        }}>
                          <button type="submit" title="반려"
                            className="p-1 text-red-500 hover:text-red-600">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await deleteDailyAbsence(a.id)
                        }}>
                          <button type="submit" title="삭제"
                            className="p-1 text-gray-400 hover:text-gray-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {absences.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                  {month} 부재 신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
