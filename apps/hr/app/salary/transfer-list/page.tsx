export const dynamic = 'force-dynamic'

import { getSalaryRecordsByMonth } from '@/actions/salary-actions'
import { getDistinctSalaryMonths } from '@/actions/salary-actions'
import { CreditCard } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string }>
}

type RecordWithEmp = {
  id: string; net_pay: number; confirmed_at: string | null
  hr_employees: { name: string; department: string; bank_name?: string | null; bank_account?: string | null } | null
}

export default async function TransferListPage({ searchParams }: Props) {
  const params = await searchParams
  const months = await getDistinctSalaryMonths()
  const today = new Date()
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = params.month ?? months[0] ?? defaultMonth

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = (await getSalaryRecordsByMonth(selectedMonth)) as any[]
  const totalNet = records.reduce((s: number, r: { net_pay: number }) => s + r.net_pay, 0)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">급여 계좌이체명세서</h1>
        </div>
        <form method="GET">
          <select name="month" defaultValue={selectedMonth} onChange={e => (e.target.form as HTMLFormElement)?.submit()}
            className="border rounded-md px-3 py-1.5 text-sm">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">은행</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">계좌번호</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">실지급액</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(records as RecordWithEmp[]).map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">{r.hr_employees?.name ?? '—'}</td>
                <td className="px-5 py-2.5 text-gray-600">{r.hr_employees?.department ?? '—'}</td>
                <td className="px-5 py-2.5 text-gray-500">{r.hr_employees?.bank_name ?? '미등록'}</td>
                <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">{r.hr_employees?.bank_account ?? '—'}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-violet-700">{r.net_pay.toLocaleString('ko-KR')}원</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">데이터 없음</td></tr>
            )}
          </tbody>
          {records.length > 0 && (
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={4} className="px-5 py-3 font-semibold text-gray-700">합계</td>
                <td className="px-5 py-3 text-right font-bold text-violet-700">{totalNet.toLocaleString('ko-KR')}원</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
