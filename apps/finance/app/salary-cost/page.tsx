import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getHrSalaryCost } from '@/actions/finance-actions'

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원' }

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function SalaryCostPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sp   = await searchParams
  const year = sp.year ? parseInt(sp.year) : new Date().getFullYear()
  const rows = await getHrSalaryCost(year)

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const totals = rows.reduce(
    (acc, r) => ({
      gross:       acc.gross       + r.totalGross,
      np:          acc.np          + r.totalNp,
      hi:          acc.hi          + r.totalHi,
      ei:          acc.ei          + r.totalEi,
      tax:         acc.tax         + r.totalTax,
      deductions:  acc.deductions  + r.totalDeductions,
      net:         acc.net         + r.totalNet,
    }),
    { gross: 0, np: 0, hi: 0, ei: 0, tax: 0, deductions: 0, net: 0 },
  )

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HR 인건비 현황</h1>
          <p className="text-sm text-gray-500 mt-1">직원별 연간 급여 지급 합산 (HR 급여대장 기반)</p>
        </div>
        <form>
          <select name="year" defaultValue={year} onChangeCapture={e => { const f = e.currentTarget.form; if (f) f.requestSubmit() }}
            className="border rounded-md px-3 py-1.5 text-sm">
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-400">
          <p>{year}년도 급여 데이터가 없습니다.</p>
          <p className="text-xs mt-1">HR 앱에서 급여 대장을 먼저 작성해주세요.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '총 인건비(지급총액)', value: totals.gross, color: 'bg-blue-50 border-blue-200' },
              { label: '총 공제액',           value: totals.deductions, color: 'bg-orange-50 border-orange-200' },
              { label: '총 실지급액',         value: totals.net,   color: 'bg-emerald-50 border-emerald-200' },
              { label: '4대보험 합계',        value: totals.np + totals.hi + totals.ei, color: 'bg-purple-50 border-purple-200' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`border rounded-lg p-4 ${color}`}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-lg font-bold">{fmt(value)}</p>
              </div>
            ))}
          </div>

          {/* Detail Table */}
          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">성명</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">부서</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">지급<br/>개월수</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">지급총액</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">국민연금</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">건강보험</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">고용보험</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">소득세 등</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">공제합계</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">실지급액</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(r => (
                  <tr key={r.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.department}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.months}개월</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-700">{fmt(r.totalGross)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(r.totalNp)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(r.totalHi)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(r.totalEi)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(r.totalTax)}</td>
                    <td className="px-4 py-3 text-right text-orange-700">{fmt(r.totalDeductions)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(r.totalNet)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold">합계 ({rows.length}명)</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmt(totals.gross)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(totals.np)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(totals.hi)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(totals.ei)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(totals.tax)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-700">{fmt(totals.deductions)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(totals.net)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-xs text-gray-400">* HR 급여대장에 등록된 {year}년 전체 월 합산 | 4대보험은 직원 부담분 기준</p>
        </>
      )}
    </div>
  )
}
