export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { FileText } from 'lucide-react'

const HALF_YEAR: Record<string, string[]> = {
  '상반기 (1~6월)':  ['01','02','03','04','05','06'],
  '하반기 (7~12월)': ['07','08','09','10','11','12'],
}

interface Props {
  searchParams: Promise<{ year?: string; half?: string }>
}

type SalaryRow = {
  employee_id: string
  gross_pay: number
  deductions: { income_tax: number; local_income_tax: number }
  hr_employees: { name: string; department: string } | null
}

interface EmpRow {
  name: string
  dept: string
  monthlyGross: Record<string, number>
  monthlyTax: Record<string, number>
  totalGross: number
  totalTax: number
}

function w(n: number) { return n === 0 ? '—' : n.toLocaleString('ko-KR') }

export default async function SimplifiedStatementPage({ searchParams }: Props) {
  const params = await searchParams
  const year   = params.year ?? String(new Date().getFullYear())
  const halfKey = params.half ?? '상반기 (1~6월)'
  const months  = HALF_YEAR[halfKey] ?? HALF_YEAR['상반기 (1~6월)']

  const monthlyData = await Promise.all(
    months.map(m => getSalaryRecordsByMonth(`${year}-${m}`))
  )

  const byEmp = new Map<string, EmpRow>()
  for (let mi = 0; mi < months.length; mi++) {
    const m = months[mi]
    for (const r of monthlyData[mi] as unknown as SalaryRow[]) {
      const name = r.hr_employees?.name ?? '—'
      const dept = r.hr_employees?.department ?? '—'
      const existing = byEmp.get(r.employee_id) ?? {
        name, dept,
        monthlyGross: {}, monthlyTax: {},
        totalGross: 0, totalTax: 0,
      }
      existing.monthlyGross[m] = (existing.monthlyGross[m] ?? 0) + r.gross_pay
      existing.monthlyTax[m]   = (existing.monthlyTax[m] ?? 0) + r.deductions.income_tax + r.deductions.local_income_tax
      existing.totalGross += r.gross_pay
      existing.totalTax   += r.deductions.income_tax + r.deductions.local_income_tax
      byEmp.set(r.employee_id, existing)
    }
  }

  const rows = [...byEmp.values()].sort((a, b) => a.name.localeCompare(b.name))
  const grandGross = rows.reduce((s, r) => s + r.totalGross, 0)
  const grandTax   = rows.reduce((s, r) => s + r.totalTax, 0)

  const monthLabels = months.map(m => `${parseInt(m)}월`)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">간이지급명세서 (반기)</h1>
        </div>
        <form method="GET" className="flex gap-2">
          <select name="year" defaultValue={year} className="border rounded-md px-3 py-1.5 text-sm">
            {[year, String(Number(year) - 1)].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select name="half" defaultValue={halfKey} className="border rounded-md px-3 py-1.5 text-sm">
            {Object.keys(HALF_YEAR).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button type="submit" className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700">
            조회
          </button>
        </form>
      </div>

      <p className="text-sm text-gray-500">
        {year}년 {halfKey} · 소득자 {rows.length}명 · 지급 합계 {grandGross.toLocaleString('ko-KR')}원
      </p>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap">성명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서</th>
              {monthLabels.map(ml => (
                <th key={ml} className="px-3 py-3 text-right font-medium text-gray-600 whitespace-nowrap" colSpan={2}>
                  {ml}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium text-gray-600" colSpan={2}>합계</th>
            </tr>
            <tr className="border-b">
              <th colSpan={2} />
              {months.map(m => (
                <>
                  <th key={`${m}-g`} className="px-3 py-1.5 text-right text-xs font-medium text-gray-500">지급액</th>
                  <th key={`${m}-t`} className="px-3 py-1.5 text-right text-xs font-medium text-gray-500">원천세</th>
                </>
              ))}
              <th className="px-3 py-1.5 text-right text-xs font-medium text-violet-600">지급합계</th>
              <th className="px-3 py-1.5 text-right text-xs font-medium text-violet-600">세액합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{r.dept}</td>
                {months.map(m => (
                  <>
                    <td key={`${m}-g`} className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                      {w(r.monthlyGross[m] ?? 0)}
                    </td>
                    <td key={`${m}-t`} className="px-3 py-2 text-right text-gray-500 whitespace-nowrap">
                      {w(r.monthlyTax[m] ?? 0)}
                    </td>
                  </>
                ))}
                <td className="px-3 py-2 text-right font-semibold text-violet-700 whitespace-nowrap">{r.totalGross.toLocaleString('ko-KR')}</td>
                <td className="px-3 py-2 text-right font-semibold text-violet-700 whitespace-nowrap">{r.totalTax.toLocaleString('ko-KR')}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + months.length * 2 + 2} className="px-5 py-10 text-center text-gray-400">
                  해당 기간 급여 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-gray-700">합계</td>
                {months.map(m => {
                  const mGross = rows.reduce((s, r) => s + (r.monthlyGross[m] ?? 0), 0)
                  const mTax   = rows.reduce((s, r) => s + (r.monthlyTax[m] ?? 0), 0)
                  return (
                    <>
                      <td key={`${m}-g`} className="px-3 py-3 text-right text-gray-800">{mGross.toLocaleString('ko-KR')}</td>
                      <td key={`${m}-t`} className="px-3 py-3 text-right text-gray-600">{mTax.toLocaleString('ko-KR')}</td>
                    </>
                  )
                })}
                <td className="px-3 py-3 text-right text-violet-700">{grandGross.toLocaleString('ko-KR')}</td>
                <td className="px-3 py-3 text-right text-violet-700">{grandTax.toLocaleString('ko-KR')}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-gray-400">
        * 간이지급명세서는 반기별로 제출합니다 (상반기: 7월 말, 하반기: 다음해 3월 말). 원천세 = 소득세 + 지방소득세 합산.
      </p>
    </div>
  )
}
