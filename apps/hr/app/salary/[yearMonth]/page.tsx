import { notFound } from 'next/navigation'
import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { getEmployees } from '@/actions/employee-actions'
import { SalaryRecordForm } from '@/components/salary/SalaryRecordForm'
import { SalaryConfirmButton } from '@/components/salary/SalaryConfirmButton'
import type { HrSalaryRecord } from '@co-at/types'

interface Props {
  params: Promise<{ yearMonth: string }>
}

function isValidYearMonth(s: string) {
  return /^\d{4}-\d{2}$/.test(s)
}

export default async function SalaryDetailPage({ params }: Props) {
  const { yearMonth } = await params
  if (!isValidYearMonth(yearMonth)) notFound()

  const [records, employees] = await Promise.all([
    getSalaryRecordsByMonth(yearMonth),
    getEmployees(),
  ])

  const recordMap = new Map(records.map((r: HrSalaryRecord) => [r.employee_id, r]))
  const activeEmployees = employees.filter(e => e.is_active)

  function formatKRW(amount: number) {
    return amount.toLocaleString('ko-KR') + '원'
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">{yearMonth} 급여 대장</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['직원명', '기본급', '수당합계', '지급총액', '공제합계', '실수령액', '상태', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeEmployees.map(emp => {
              const rec = recordMap.get(emp.id)
              if (!rec) {
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{emp.name}</td>
                    <td colSpan={6} className="px-4 py-3 text-gray-400 text-xs">미등록</td>
                    <td className="px-4 py-3">
                      <details>
                        <summary className="text-xs text-violet-600 cursor-pointer">등록</summary>
                        <div className="mt-2 p-4 border rounded-lg bg-gray-50 min-w-[380px]">
                          <SalaryRecordForm
                            employeeId={emp.id}
                            employeeName={emp.name}
                            yearMonth={yearMonth}
                          />
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              }
              const allowanceTotal = rec.allowances.reduce((s: number, a: { amount: number }) => s + a.amount, 0)
              const deductionTotal =
                rec.deductions.national_pension +
                rec.deductions.health_insurance +
                rec.deductions.employment_insurance +
                rec.deductions.income_tax +
                rec.deductions.local_income_tax
              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3">{formatKRW(rec.base_salary)}</td>
                  <td className="px-4 py-3">{formatKRW(allowanceTotal)}</td>
                  <td className="px-4 py-3 font-medium">{formatKRW(rec.gross_pay)}</td>
                  <td className="px-4 py-3 text-red-600">-{formatKRW(deductionTotal)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatKRW(rec.net_pay)}</td>
                  <td className="px-4 py-3">
                    {rec.confirmed_at ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">확정</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">미확정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!rec.confirmed_at && (
                      <SalaryConfirmButton recordId={rec.id} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
