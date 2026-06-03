export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { FileSpreadsheet } from 'lucide-react'

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

interface Props {
  searchParams: Promise<{ year?: string }>
}

type RecordWithEmp = {
  employee_id: string; income_tax: number; local_income_tax: number; gross_pay: number
  hr_employees: { name: string; department: string } | null
  deductions: { income_tax: number; local_income_tax: number }
}

export default async function WithholdingTaxPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ?? String(new Date().getFullYear())

  const monthlyData = await Promise.all(
    MONTHS.map(m => getSalaryRecordsByMonth(`${year}-${m}`))
  )

  // 직원별 연간 집계
  const byEmp = new Map<string, { name: string; dept: string; grossTotal: number; taxTotal: number; localTaxTotal: number }>()
  for (const records of monthlyData) {
    for (const r of records as RecordWithEmp[]) {
      const empName = r.hr_employees?.name ?? '—'
      const dept = r.hr_employees?.department ?? '—'
      const existing = byEmp.get(r.employee_id) ?? { name: empName, dept, grossTotal: 0, taxTotal: 0, localTaxTotal: 0 }
      existing.grossTotal += r.gross_pay
      existing.taxTotal += r.deductions.income_tax
      existing.localTaxTotal += r.deductions.local_income_tax
      byEmp.set(r.employee_id, existing)
    }
  }

  const rows = [...byEmp.values()].sort((a, b) => a.name.localeCompare(b.name))
  const grandTax = rows.reduce((s, r) => s + r.taxTotal, 0)
  const grandLocal = rows.reduce((s, r) => s + r.localTaxTotal, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">근로소득 원천징수부</h1>
        </div>
        <form method="GET">
          <select name="year" defaultValue={year}
            className="border rounded-md px-3 py-1.5 text-sm">
            {[year, String(Number(year) - 1)].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">연간 총급여</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">근로소득세</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">지방소득세</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">{r.name}</td>
                <td className="px-5 py-2.5 text-gray-600">{r.dept}</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.grossTotal.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.taxTotal.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{r.localTaxTotal.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-2.5 text-right font-semibold text-violet-700">{(r.taxTotal + r.localTaxTotal).toLocaleString('ko-KR')}원</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">{year}년 급여 데이터가 없습니다.</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-gray-700">합계</td>
                <td className="px-5 py-3 text-right text-violet-700">{grandTax.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-right text-violet-700">{grandLocal.toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-right text-violet-700">{(grandTax + grandLocal).toLocaleString('ko-KR')}원</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
