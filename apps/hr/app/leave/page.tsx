import { getLeaveRequests } from '@/actions/leave-actions'
import { LeaveReviewButtons } from '@/components/leave/LeaveReviewButtons'
import { getCurrentRole } from '@co-at/auth'
import Link from 'next/link'

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: '연차', sick: '병가', special: '특별', unpaid: '무급',
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:  { label: '대기',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: '승인',  className: 'bg-green-100 text-green-700' },
  rejected: { label: '반려',  className: 'bg-red-100 text-red-700' },
}

export default async function LeavePage() {
  const [allLeaves, role] = await Promise.all([
    getLeaveRequests(),
    getCurrentRole(),
  ])

  const canReview = role === 'admin' || role === 'manager'
  const pending = allLeaves.filter(l => l.status === 'pending')
  const others  = allLeaves.filter(l => l.status !== 'pending')

  function renderTable(leaves: typeof allLeaves, showReview: boolean) {
    if (leaves.length === 0) return <p className="text-sm text-gray-400 py-4">내역이 없습니다.</p>
    return (
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {['직원명', '유형', '기간', '일수', '사유', '상태', ...(showReview ? [''] : [])].map(h => (
              <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {leaves.map(l => {
            const st = STATUS_LABELS[l.status]
            return (
              <tr key={l.id}>
                <td className="px-4 py-2">{(l as any).hr_employees?.name ?? '-'}</td>
                <td className="px-4 py-2">{LEAVE_TYPE_LABELS[l.leave_type]}</td>
                <td className="px-4 py-2 text-gray-500">{l.start_date} ~ {l.end_date}</td>
                <td className="px-4 py-2">{l.days_used}일</td>
                <td className="px-4 py-2 text-gray-500">{l.reason ?? '-'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                    {st.label}
                  </span>
                </td>
                {showReview && (
                  <td className="px-4 py-2">
                    <LeaveReviewButtons leaveId={l.id} reviewerId={null} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">연차·휴가 관리</h1>
        <Link
          href="/leave/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700"
        >
          + 휴가 신청
        </Link>
      </div>

      {canReview && pending.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-base font-semibold mb-4">미처리 신청 ({pending.length})</h2>
          {renderTable(pending, true)}
        </div>
      )}

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-base font-semibold mb-4">전체 내역</h2>
        {renderTable(others, false)}
      </div>
    </div>
  )
}
