export const dynamic = 'force-dynamic'

import { getDistinctSalaryMonths, getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { BarChart3 } from 'lucide-react'
import { totalDeductions } from '@/lib/salary-calculator'
import type { HrSalaryRecord } from '@co-at/types'

export default async function PaymentStatusPage() {
  const months = await getDistinctSalaryMonths()

  const allData = await Promise.all(
    months.slice(0, 12).map(async m => {
      const records = await getSalaryRecordsByMonth(m)
      return { month: m, records: records as HrSalaryRecord[] }
    })
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-violet-600" />
        <h1 className="text-2xl font-bold text-gray-900">급여지급현황</h1>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">지급월</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">인원</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">지급총액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">공제총액</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">실지급액</th>
              <th className="px-5 py-3 text-center font-medium text-gray-600">확정</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allData.map(({ month, records }) => {
              const gross = records.reduce((s, r) => s + r.gross_pay, 0)
              const ded = records.reduce((s, r) => s + totalDeductions(r.deductions), 0)
              const net = records.reduce((s, r) => s + r.net_pay, 0)
              const confirmedCount = records.filter(r => r.confirmed_at).length
              return (
                <tr key={month} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{month}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{records.length}명</td>
                  <td className="px-5 py-3 text-right text-gray-800">{gross.toLocaleString('ko-KR')}원</td>
                  <td className="px-5 py-3 text-right text-red-500">{ded.toLocaleString('ko-KR')}원</td>
                  <td className="px-5 py-3 text-right font-semibold text-violet-700">{net.toLocaleString('ko-KR')}원</td>
                  <td className="px-5 py-3 text-center text-xs text-gray-500">{confirmedCount}/{records.length}</td>
                </tr>
              )
            })}
            {allData.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">급여 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
