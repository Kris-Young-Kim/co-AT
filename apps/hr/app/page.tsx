import { getEmployees } from '@/actions/employee-actions'
import { getLeaveRequests } from '@/actions/leave-actions'
import { Users, UserCheck, CalendarDays } from 'lucide-react'

export default async function HrDashboard() {
  const [employees, pendingLeaves] = await Promise.all([
    getEmployees(),
    getLeaveRequests({ status: 'pending' }),
  ])

  const activeEmployees = employees.filter(e => e.is_active)

  const stats = [
    {
      label: '전체 직원',
      value: activeEmployees.length,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: '재직 중',
      value: activeEmployees.filter(e => !e.leave_date).length,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: '미처리 휴가 신청',
      value: pendingLeaves.length,
      icon: CalendarDays,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">인사관리 대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-lg border p-5 flex items-center gap-4">
            <div className={`${bg} p-3 rounded-lg`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-base font-semibold mb-4">미처리 휴가 신청</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 font-medium">직원명</th>
                <th className="text-left py-2 font-medium">유형</th>
                <th className="text-left py-2 font-medium">기간</th>
                <th className="text-left py-2 font-medium">일수</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.slice(0, 10).map(req => (
                <tr key={req.id} className="border-b last:border-0">
                  <td className="py-2">{(req as any).hr_employees?.name ?? '-'}</td>
                  <td className="py-2">{leaveTypeLabel(req.leave_type)}</td>
                  <td className="py-2">{req.start_date} ~ {req.end_date}</td>
                  <td className="py-2">{req.days_used}일</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function leaveTypeLabel(type: string): string {
  const map: Record<string, string> = {
    annual: '연차',
    sick: '병가',
    special: '특별',
    unpaid: '무급',
  }
  return map[type] ?? type
}
