'use client'

import { useRouter } from 'next/navigation'
import { totalDeductions } from '@/lib/salary-calculator'
import type { HrSalaryRecord } from '@co-at/types'

type RecordWithEmployee = HrSalaryRecord & {
  hr_employees?: { name: string; department: string } | null
}

interface Props {
  records: RecordWithEmployee[]
  months: string[]
  selectedMonth: string
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

export function SalaryLedger({ records, months, selectedMonth }: Props) {
  const router = useRouter()

  const totalGross = records.reduce((s, r) => s + r.gross_pay, 0)
  const totalDed = records.reduce((s, r) => s + totalDeductions(r.deductions), 0)
  const totalNet = records.reduce((s, r) => s + r.net_pay, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedMonth}
          onChange={e => router.push(`/salary/ledger?month=${e.target.value}`)}
          className="border rounded-md px-3 py-1.5 text-sm"
        >
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-sm text-gray-500">{records.length}명</span>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">기본급</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">지급총액</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">공제총액</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">실지급액</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">확정</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{r.hr_employees?.name ?? '—'}</td>
                <td className="px-4 py-2.5 text-gray-600">{r.hr_employees?.department ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-gray-700">{fmt(r.base_salary)}</td>
                <td className="px-4 py-2.5 text-right text-gray-700">{fmt(r.gross_pay)}</td>
                <td className="px-4 py-2.5 text-right text-red-500">{fmt(totalDeductions(r.deductions))}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-violet-700">{fmt(r.net_pay)}</td>
                <td className="px-4 py-2.5 text-center text-xs">
                  {r.confirmed_at
                    ? <span className="text-green-600">✓</span>
                    : <span className="text-gray-400">미확정</span>}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">급여 데이터가 없습니다.</td></tr>
            )}
          </tbody>
          {records.length > 0 && (
            <tfoot className="bg-violet-50 border-t font-semibold">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-gray-700">합계</td>
                <td className="px-4 py-3 text-right text-gray-700">{fmt(totalGross)}</td>
                <td className="px-4 py-3 text-right text-red-500">{fmt(totalDed)}</td>
                <td className="px-4 py-3 text-right text-violet-700">{fmt(totalNet)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
