export const dynamic = 'force-dynamic'

import { getOvertimeByMonth } from '@/actions/overtime-actions'
import { Clock } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string }>
}

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default async function OvertimePage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth

  const rows = await getOvertimeByMonth(month)

  // 직원별 월합계
  type EmpSummary = { name: string; department: string; regular: number; overtime: number; night: number; holiday: number; total: number }
  const byEmp = new Map<string, EmpSummary>()
  for (const r of rows) {
    const key = r.employee_id
    const ex = byEmp.get(key) ?? {
      name: r.hr_employees?.name ?? '—',
      department: r.hr_employees?.department ?? '—',
      regular: 0, overtime: 0, night: 0, holiday: 0, total: 0,
    }
    ex.regular += r.regular_minutes
    ex.overtime += r.overtime_minutes
    ex.night += r.night_minutes
    ex.holiday += r.holiday_minutes
    ex.total += r.total_minutes
    byEmp.set(key, ex)
  }
  const summaries = [...byEmp.values()].sort((a, b) => a.name.localeCompare(b.name))

  // 월 목록 (최근 12개월)
  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">시간외근무 현황</h1>
        </div>
        <form method="GET">
          <select name="month" defaultValue={month}
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
              <th className="px-5 py-3 text-right font-medium text-gray-600">소정근로</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">연장근로</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">야간근로</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">휴일근로</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {summaries.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-medium text-gray-800">{s.name}</td>
                <td className="px-5 py-2.5 text-gray-600">{s.department}</td>
                <td className="px-5 py-2.5 text-right text-gray-700">{fmtMinutes(s.regular)}</td>
                <td className="px-5 py-2.5 text-right text-orange-600 font-medium">{fmtMinutes(s.overtime)}</td>
                <td className="px-5 py-2.5 text-right text-blue-600">{fmtMinutes(s.night)}</td>
                <td className="px-5 py-2.5 text-right text-red-600">{fmtMinutes(s.holiday)}</td>
                <td className="px-5 py-2.5 text-right font-semibold text-violet-700">{fmtMinutes(s.total)}</td>
              </tr>
            ))}
            {summaries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                  {month} 시간외근무 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
