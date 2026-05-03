import Link from 'next/link'
import { getEmployees } from '@/actions/employee-actions'
import { UserPlus } from 'lucide-react'

export default async function EmployeesPage() {
  const employees = await getEmployees()

  const EMPLOYMENT_LABELS: Record<string, string> = {
    full_time: '정규직',
    part_time: '파트타임',
    contract: '계약직',
    daily: '일용직',
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">직원 관리</h1>
        <Link
          href="/employees/new"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700"
        >
          <UserPlus className="w-4 h-4" />
          직원 등록
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['이름', '부서', '직책', '고용 유형', '입사일', '상태', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                <td className="px-4 py-3 text-gray-600">{emp.position}</td>
                <td className="px-4 py-3">{EMPLOYMENT_LABELS[emp.employment_type] ?? emp.employment_type}</td>
                <td className="px-4 py-3 text-gray-600">{emp.hire_date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {emp.is_active ? '재직' : '퇴직'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/employees/${emp.id}`} className="text-violet-600 hover:underline text-xs">
                    상세
                  </Link>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  등록된 직원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
