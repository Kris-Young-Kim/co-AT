import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEmployee } from '@/actions/employee-actions'
import { getCareersByEmployee } from '@/actions/career-actions'
import { getApprovedLeaveDaysInYear } from '@/actions/leave-actions'
import { calcLeaveBalance } from '@/lib/leave-calculator'
import { Pencil } from 'lucide-react'

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, careers] = await Promise.all([
    getEmployee(params.id),
    getCareersByEmployee(params.id),
  ])
  if (!employee) notFound()

  const currentYear = new Date().getFullYear()
  const usedDays = await getApprovedLeaveDaysInYear(params.id, currentYear)
  const leaveBalance = calcLeaveBalance({
    hireDate: employee.hire_date,
    year: currentYear,
    usedDays,
  })

  const EMPLOYMENT_LABELS: Record<string, string> = {
    full_time: '정규직', part_time: '파트타임', contract: '계약직', daily: '일용직',
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        <Link
          href={`/employees/${employee.id}/edit`}
          className="flex items-center gap-2 border px-3 py-1.5 rounded-md text-sm hover:bg-gray-50"
        >
          <Pencil className="w-3.5 h-3.5" />
          수정
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6 grid grid-cols-2 gap-4">
        <Info label="이메일" value={employee.email} />
        <Info label="전화번호" value={employee.phone ?? '-'} />
        <Info label="부서" value={employee.department} />
        <Info label="직책" value={employee.position} />
        <Info label="고용 유형" value={EMPLOYMENT_LABELS[employee.employment_type] ?? employee.employment_type} />
        <Info label="입사일" value={employee.hire_date} />
        {employee.leave_date && <Info label="퇴직일" value={employee.leave_date} />}
        <Info label="상태" value={employee.is_active ? '재직 중' : '퇴직'} />
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-base font-semibold mb-4">연차 현황 ({currentYear})</h2>
        <div className="flex gap-6 text-sm">
          <Stat label="부여" value={`${leaveBalance.entitlement}일`} />
          <Stat label="사용" value={`${leaveBalance.used}일`} />
          <Stat label="잔여" value={`${leaveBalance.remaining}일`} highlight />
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">경력 사항</h2>
          <Link href={`/careers/new?employeeId=${employee.id}`} className="text-sm text-violet-600 hover:underline">
            + 경력 추가
          </Link>
        </div>
        {careers.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 경력이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {careers.map(c => (
              <li key={c.id} className="flex justify-between items-start text-sm border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{c.organization}</p>
                  <p className="text-gray-500">{c.position}</p>
                  {c.description && <p className="text-gray-400 text-xs mt-0.5">{c.description}</p>}
                </div>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {c.start_date} ~ {c.end_date ?? '현재'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${highlight ? 'text-violet-600' : ''}`}>{value}</p>
    </div>
  )
}
