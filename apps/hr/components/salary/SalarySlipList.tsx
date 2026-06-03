'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { totalDeductions } from '@/lib/salary-calculator'
import type { HrEmployee, HrSalaryRecord } from '@co-at/types'

interface Props {
  employees: HrEmployee[]
  records: HrSalaryRecord[]
  months: string[]
  selectedEmpId: string
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

export function SalarySlipList({ employees, records, months, selectedEmpId }: Props) {
  const router = useRouter()
  const selectedEmp = employees.find(e => e.id === selectedEmpId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedEmpId}
          onChange={e => router.push(`/salary/slips?employeeId=${e.target.value}`)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
          ))}
        </select>
        {selectedEmp && (
          <span className="text-sm text-gray-500">{selectedEmp.position} · 입사 {selectedEmp.hire_date}</span>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">지급월</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">기본급</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">지급총액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">공제총액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">실지급액</th>
              <th className="px-5 py-3 text-center font-medium text-gray-600">명세서</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">{r.year_month}</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{fmt(r.base_salary)}</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{fmt(r.gross_pay)}</td>
                <td className="px-5 py-2.5 text-right text-red-500">{fmt(totalDeductions(r.deductions))}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-violet-700">{fmt(r.net_pay)}</td>
                <td className="px-5 py-2.5 text-center">
                  <Link
                    href={`/salary/${r.year_month}/slip/${r.employee_id}`}
                    className="text-xs text-violet-600 hover:underline"
                  >
                    보기/PDF
                  </Link>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">급여 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
