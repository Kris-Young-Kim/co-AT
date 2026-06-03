export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { getEmployee } from '@/actions/employee-actions'
import { SalarySlipPDFButton } from '@/components/salary/SalarySlipPDF'
import { notFound } from 'next/navigation'
import { totalDeductions } from '@/lib/salary-calculator'
import type { HrSalaryRecord } from '@co-at/types'

interface Props {
  params: Promise<{ yearMonth: string; employeeId: string }>
}

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

export default async function SalarySlipPage({ params }: Props) {
  const { yearMonth, employeeId } = await params

  const [records, employee] = await Promise.all([
    getSalaryRecordsByMonth(yearMonth),
    getEmployee(employeeId),
  ])

  const record = (records as HrSalaryRecord[]).find(r => r.employee_id === employeeId)
  if (!record || !employee) notFound()

  const ded = record.deductions
  const totalDed = totalDeductions(ded)

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">급여명세서</h1>
        <SalarySlipPDFButton record={record} employee={employee} />
      </div>

      {/* 기본 정보 */}
      <div className="bg-white border rounded-lg p-6 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between"><span className="text-gray-500">지급월</span><span className="font-medium">{record.year_month}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">성명</span><span className="font-medium">{employee.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">부서</span><span>{employee.department}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">직급</span><span>{employee.position}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 지급 내역 */}
        <div className="bg-white border rounded-lg p-5 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">지급 내역</h2>
          <div className="flex justify-between"><span className="text-gray-500">기본급</span><span>{fmt(record.base_salary)}</span></div>
          {record.allowances.map((a, i) => (
            <div key={i} className="flex justify-between"><span className="text-gray-500">{a.name}</span><span>{fmt(a.amount)}</span></div>
          ))}
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <span>지급총액</span><span className="text-gray-800">{fmt(record.gross_pay)}</span>
          </div>
        </div>

        {/* 공제 내역 */}
        <div className="bg-white border rounded-lg p-5 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">공제 내역</h2>
          <div className="flex justify-between"><span className="text-gray-500">국민연금</span><span>{fmt(ded.national_pension)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">건강보험</span><span>{fmt(ded.health_insurance)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">장기요양보험</span><span>{fmt(ded.long_term_care ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">고용보험</span><span>{fmt(ded.employment_insurance)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">근로소득세</span><span>{fmt(ded.income_tax)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">지방소득세</span><span>{fmt(ded.local_income_tax)}</span></div>
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <span>공제총액</span><span className="text-red-500">{fmt(totalDed)}</span>
          </div>
        </div>
      </div>

      {/* 실지급액 */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-6 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">실지급액</span>
        <span className="text-2xl font-bold text-violet-700">{fmt(record.net_pay)}</span>
      </div>
    </div>
  )
}
