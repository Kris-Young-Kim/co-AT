export const dynamic = 'force-dynamic'

import { getLeaveBalancesByYear, generateLeaveBalancesForYear } from '@/actions/leave-balance-actions'
import { CalendarDays, RefreshCw, Star } from 'lucide-react'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function LeaveBalancePage({ searchParams }: Props) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const rows = await getLeaveBalancesByYear(year)

  const years = [year + 1, year, year - 1]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900">연차 잔여 현황</h1>
        </div>

        <div className="flex items-center gap-3">
          <form method="GET">
            <select name="year" defaultValue={String(year)}
              className="border rounded-md px-3 py-1.5 text-sm">
              {years.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </form>

          <form action={async () => {
            'use server'
            await generateLeaveBalancesForYear(year)
          }}>
            <button type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-md hover:bg-violet-700">
              <RefreshCw className="h-3.5 w-3.5" />
              연차 자동 생성
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">성명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">부서</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">연차 부여</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">이월</th>
              <th className="px-4 py-3 text-right font-medium text-violet-600">
                <span className="flex items-center justify-end gap-1">
                  <Star className="h-3 w-3" />특별
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">사용</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">연차 잔여</th>
              <th className="px-4 py-3 text-right font-medium text-violet-600">특별 잔여</th>
              <th className="px-4 py-3 text-right font-medium text-gray-900">총 잔여</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => {
              const totalRemaining = r.annual_remaining + r.special_remaining
              const isMidYearHire = r.special_entitlement > 0
              return (
                <tr key={i} className={`hover:bg-gray-50 ${isMidYearHire ? 'bg-violet-50/30' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {r.name}
                    {isMidYearHire && (
                      <span className="ml-1.5 text-xs text-violet-500 font-normal">중도</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{r.department}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.annual_entitlement}일</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">{r.annual_carry_over}일</td>
                  <td className="px-4 py-2.5 text-right text-violet-600 font-medium">
                    {isMidYearHire ? `${r.special_entitlement}일` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {r.annual_used + r.special_used}일
                    {r.special_used > 0 && (
                      <span className="text-xs text-violet-500 ml-1">(특별 {r.special_used})</span>
                    )}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-medium ${r.annual_remaining <= 3 ? 'text-red-600' : 'text-gray-700'}`}>
                    {r.annual_remaining}일
                  </td>
                  <td className="px-4 py-2.5 text-right text-violet-600 font-medium">
                    {isMidYearHire ? `${r.special_remaining}일` : '—'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold ${totalRemaining <= 3 ? 'text-red-600' : 'text-violet-700'}`}>
                    {totalRemaining}일
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                  {year}년 연차 데이터가 없습니다. &quot;연차 자동 생성&quot; 버튼을 눌러주세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 space-y-0.5">
        <p>* 연차: 근로기준법 기준 (1년 미만 월 1일, 1년 15일, 매 2년 +1일, 최대 25일)</p>
        <p>* 특별휴가 5일: 전년도 중도 입사자(1월 2일 이후 입사)에게 1월 1일자로 부여</p>
        <p>* 사용 우선순위: 특별휴가 5일 먼저 소진 후 연차 차감</p>
      </div>
    </div>
  )
}
