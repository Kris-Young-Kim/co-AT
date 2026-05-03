import { notFound } from 'next/navigation'
import { getEmployee } from '@/actions/employee-actions'
import { getAttendanceByEmployee } from '@/actions/attendance-actions'
import { AttendanceForm } from '@/components/attendance/AttendanceForm'

interface Props {
  params: { employeeId: string }
  searchParams: { month?: string }
}

export default async function EmployeeAttendancePage({ params, searchParams }: Props) {
  const today = new Date()
  const yearMonth = searchParams.month ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [employee, records] = await Promise.all([
    getEmployee(params.employeeId),
    getAttendanceByEmployee(params.employeeId, yearMonth),
  ])
  if (!employee) notFound()

  const recordMap = new Map(records.map(r => [r.date, r]))
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, '0')}`
  )

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{employee.name} — 출퇴근 기록 ({yearMonth})</h1>

      <div className="space-y-3">
        {days.map(date => {
          const rec = recordMap.get(date)
          const dow = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })
          return (
            <div key={date} className="bg-white border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{date} ({dow})</p>
              <AttendanceForm
                employeeId={params.employeeId}
                date={date}
                initial={rec}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
