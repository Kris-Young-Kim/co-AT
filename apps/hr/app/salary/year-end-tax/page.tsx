export const dynamic = 'force-dynamic'

import { listYearEndTaxByYear, getActiveEmployees, upsertYearEndTax } from '@/actions/year-end-tax-actions'
import { FileCheck2, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ year?: string }>
}

function w(n: number) { return n.toLocaleString('ko-KR') }
function sign(n: number) { return n >= 0 ? `+${w(n)}` : `${w(n)}` }

export default async function YearEndTaxPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ?? String(new Date().getFullYear())
  const taxYear = parseInt(year)

  const [{ records, grossByEmp }, employees] = await Promise.all([
    listYearEndTaxByYear(taxYear),
    getActiveEmployees(),
  ])

  const recordMap = new Map(records.map(r => [r.employee_id, r]))

  // 연말정산 미작성 직원 (급여데이터 있는 직원만)
  const unprocessed = employees.filter(e => grossByEmp.has(e.id) && !recordMap.has(e.id))

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">연말정산</h1>
        </div>
        <form method="GET">
          <select name="year" defaultValue={year} className="border rounded-md px-3 py-1.5 text-sm">
            {[year, String(Number(year) - 1)].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </form>
      </div>

      {/* 미처리 직원 */}
      {unprocessed.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">연말정산 미처리 직원 ({unprocessed.length}명)</p>
          <div className="flex flex-wrap gap-2">
            {unprocessed.map(e => (
              <Link
                key={e.id}
                href={`/salary/year-end-tax/${e.id}?year=${year}`}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-white border border-amber-300 rounded-full text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {e.name} ({e.department})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 처리 완료 목록 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">연간총급여</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">결정세액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">기납부세액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">환급/추납</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {records.map(r => {
              const refundTotal = r.refund_income_tax + r.refund_local_tax
              const prepaidTotal = r.prepaid_income_tax + r.prepaid_local_tax
              const finalTotal = r.final_income_tax + r.final_local_tax
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium text-gray-800">
                    {(r as { hr_employees?: { name: string } }).hr_employees?.name ?? '—'}
                  </td>
                  <td className="px-5 py-2.5 text-gray-600">
                    {(r as { hr_employees?: { department: string } }).hr_employees?.department ?? '—'}
                  </td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{w(r.gross_income)}원</td>
                  <td className="px-5 py-2.5 text-right text-gray-700">{w(finalTotal)}원</td>
                  <td className="px-5 py-2.5 text-right text-gray-500">{w(prepaidTotal)}원</td>
                  <td className={`px-5 py-2.5 text-right font-semibold ${refundTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {sign(refundTotal)}원
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/salary/year-end-tax/${r.employee_id}?year=${year}`}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-violet-600"
                    >
                      수정 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              )
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">{year}년 연말정산 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
          {records.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-gray-700">합계</td>
                <td className="px-5 py-3 text-right text-gray-800">
                  {w(records.reduce((s, r) => s + r.final_income_tax + r.final_local_tax, 0))}원
                </td>
                <td className="px-5 py-3 text-right text-gray-500">
                  {w(records.reduce((s, r) => s + r.prepaid_income_tax + r.prepaid_local_tax, 0))}원
                </td>
                <td className="px-5 py-3 text-right text-violet-700">
                  {sign(records.reduce((s, r) => s + r.refund_income_tax + r.refund_local_tax, 0))}원
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
