import Link from 'next/link'
import { getDailyWages } from '@/actions/daily-wage-actions'
import { Plus } from 'lucide-react'
import type { HrDailyWage } from '@co-at/types'

export default async function DailyWagesPage() {
  const wages = await getDailyWages()

  function formatKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">일용급여</h1>
        <Link href="/daily-wages/new"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          일용급여 입력
        </Link>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['직원명', '근무일', '시간', '시급', '지급총액', '공제합계', '실수령액', '메모'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {wages.map((w: HrDailyWage & { hr_employees?: { name: string } }) => {
              const deductionTotal =
                w.deductions.national_pension +
                w.deductions.health_insurance +
                w.deductions.employment_insurance +
                w.deductions.income_tax +
                w.deductions.local_income_tax
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{w.hr_employees?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{w.work_date}</td>
                  <td className="px-4 py-3">{w.hours_worked}시간</td>
                  <td className="px-4 py-3">{formatKRW(w.hourly_rate)}</td>
                  <td className="px-4 py-3 font-medium">{formatKRW(w.gross_pay)}</td>
                  <td className="px-4 py-3 text-red-600">-{formatKRW(deductionTotal)}</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatKRW(w.net_pay)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{w.note ?? '-'}</td>
                </tr>
              )
            })}
            {wages.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">등록된 일용급여가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
