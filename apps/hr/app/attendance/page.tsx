import Link from 'next/link'
import { getEmployees } from '@/actions/employee-actions'
import { getAllAttendance } from '@/actions/attendance-actions'

interface Props {
  searchParams: { month?: string }
}

export default async function AttendancePage({ searchParams }: Props) {
  const today = new Date()
  const yearMonth = searchParams.month ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [employees, records] = await Promise.all([
    getEmployees(),
    getAllAttendance(yearMonth),
  ])

  const recordMap = new Map(records.map(r => [`${r.employee_id}-${r.date}`, r]))
  const activeEmployees = employees.filter(e => e.is_active)

  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, '0')}`
  )

  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">출퇴근 기록</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`?month=${prevMonth}`} className="border rounded px-2 py-1 hover:bg-gray-50">‹</Link>
          <span className="font-medium">{yearMonth}</span>
          <Link href={`?month=${nextMonth}`} className="border rounded px-2 py-1 hover:bg-gray-50">›</Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-auto">
        <table className="text-xs">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600 sticky left-0 bg-gray-50">직원명</th>
              {days.map(d => (
                <th key={d} className="px-1.5 py-2 font-medium text-gray-600 min-w-[32px]">
                  {d.split('-')[2]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium sticky left-0 bg-white">
                  <Link href={`/attendance/${emp.id}?month=${yearMonth}`} className="hover:text-violet-600">
                    {emp.name}
                  </Link>
                </td>
                {days.map(d => {
                  const rec = recordMap.get(`${emp.id}-${d}`)
                  return (
                    <td key={d} className="px-1 py-2 text-center">
                      {rec?.check_in ? (
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" title={`출근: ${new Date(rec.check_in).toTimeString().slice(0,5)}`} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
