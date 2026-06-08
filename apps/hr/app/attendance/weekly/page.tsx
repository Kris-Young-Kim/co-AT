export const dynamic = 'force-dynamic'

import { getWeeklyWorkMinutes } from '@/actions/overtime-actions'
import { BarChart3, AlertTriangle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ month?: string }>
}

const WEEKLY_LIMIT = 52 * 60 // 주 52시간 = 3120분

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function progressColor(min: number): string {
  const ratio = min / WEEKLY_LIMIT
  if (ratio >= 1) return 'bg-red-500'
  if (ratio >= 0.8) return 'bg-orange-400'
  return 'bg-violet-500'
}

export default async function WeeklyPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth

  const rows = await getWeeklyWorkMinutes(month)

  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const exceeded = rows.filter(r => r.total_minutes > WEEKLY_LIMIT)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">주 52시간 모니터링</h1>
        </div>
        <form method="GET">
          <select name="month" defaultValue={month}
            className="border rounded-md px-3 py-1.5 text-sm">
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </form>
      </div>

      {exceeded.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">주 52시간 초과 경보</p>
            <p className="text-sm text-red-600">
              {exceeded.map(r => `${r.name} (${r.week}주)`).join(', ')} — 즉시 확인 필요
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-gray-600">주 시작일</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-5 py-3 text-right font-medium text-gray-600">주간 근무시간</th>
              <th className="px-5 py-3 text-left font-medium text-gray-600 w-48">한도 대비</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => {
              const ratio = Math.min(r.total_minutes / WEEKLY_LIMIT, 1)
              const over = r.total_minutes > WEEKLY_LIMIT
              return (
                <tr key={i} className={`hover:bg-gray-50 ${over ? 'bg-red-50' : ''}`}>
                  <td className="px-5 py-2.5 text-gray-600">{r.week}</td>
                  <td className="px-5 py-2.5 font-medium text-gray-800">{r.name}</td>
                  <td className="px-5 py-2.5 text-gray-600">{r.department}</td>
                  <td className={`px-5 py-2.5 text-right font-semibold ${over ? 'text-red-600' : 'text-gray-700'}`}>
                    {fmtMinutes(r.total_minutes)}
                    {over && <span className="ml-1 text-xs text-red-500">초과!</span>}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${progressColor(r.total_minutes)}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  {month} 근무 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        * 주 52시간 = 법정 소정근로 40시간 + 연장근로 12시간 한도 (근로기준법 제53조)
      </p>
    </div>
  )
}
