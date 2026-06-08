export const dynamic = 'force-dynamic'

import { getBusinessTrips, reviewBusinessTrip, deleteBusinessTrip } from '@/actions/business-trip-actions'
import { Plane, Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string; year?: string }>
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:  { label: '대기', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '승인', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '반려', cls: 'bg-red-100 text-red-700' },
}

export default async function BusinessTripPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const status = params.status

  const trips = await getBusinessTrips({ status, year })

  const years = [year, year - 1, year + 1]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">출장 관리</h1>
        </div>
        <div className="flex items-center gap-3">
          <form method="GET" className="flex gap-2">
            <select name="year" defaultValue={String(year)}
              className="border rounded-md px-3 py-1.5 text-sm">
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select name="status" defaultValue={status ?? ''}
              className="border rounded-md px-3 py-1.5 text-sm">
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </form>
          <Link href="/business-trip/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700">
            <Plus className="h-3.5 w-3.5" />
            출장 신청
          </Link>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신청자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">목적지</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">목적</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">기간</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">출장비</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trips.map(t => {
              const st = STATUS_LABELS[t.status] ?? STATUS_LABELS.pending
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{t.hr_employees?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{t.hr_employees?.department ?? '—'}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{t.destination}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{t.purpose}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600 text-xs">
                    {t.start_date} ~ {t.end_date}
                    <br />
                    <span className="text-violet-600 font-medium">{t.days}일</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {t.allowance > 0 ? `${t.allowance.toLocaleString('ko-KR')}원` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {t.status === 'pending' && (
                      <div className="flex items-center justify-center gap-1">
                        <form action={async () => {
                          'use server'
                          await reviewBusinessTrip({ id: t.id, status: 'approved', reviewed_by: '' })
                        }}>
                          <button type="submit" title="승인"
                            className="p-1 text-green-600 hover:text-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await reviewBusinessTrip({ id: t.id, status: 'rejected', reviewed_by: '' })
                        }}>
                          <button type="submit" title="반려"
                            className="p-1 text-red-500 hover:text-red-600">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={async () => {
                          'use server'
                          await deleteBusinessTrip(t.id)
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
            {trips.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  출장 신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
