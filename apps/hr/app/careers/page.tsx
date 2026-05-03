import { getEmployees } from '@/actions/employee-actions'
import { getCareersByEmployee } from '@/actions/career-actions'
import Link from 'next/link'

export default async function CareersPage() {
  const employees = await getEmployees()
  const active = employees.filter(e => e.is_active)

  const careersByEmp = await Promise.all(
    active.map(emp =>
      getCareersByEmployee(emp.id).then(careers => ({ emp, careers }))
    )
  )

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">경력 관리</h1>
        <Link
          href="/careers/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700"
        >
          + 경력 등록
        </Link>
      </div>

      <div className="space-y-4">
        {careersByEmp.map(({ emp, careers }) => (
          <div key={emp.id} className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{emp.name}
                <span className="text-gray-400 font-normal text-sm ml-2">{emp.department}</span>
              </h2>
              <Link href={`/careers/new?employeeId=${emp.id}`} className="text-xs text-violet-600 hover:underline">
                + 추가
              </Link>
            </div>
            {careers.length === 0 ? (
              <p className="text-sm text-gray-400">경력 없음</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {careers.map(c => (
                  <li key={c.id} className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{c.organization}</span>
                      <span className="text-gray-400 ml-2">{c.position}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{c.start_date} ~ {c.end_date ?? '현재'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
