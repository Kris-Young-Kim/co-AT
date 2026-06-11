import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardData } from '@/actions/finance-actions'
import { MonthlyBarChart } from '@/components/MonthlyBarChart'
import type { FinanceCategoryStats } from '@co-at/types'

function fmt(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border rounded-lg p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function CategoryRow({ stat, depth = 0 }: { stat: FinanceCategoryStats; depth?: number }) {
  const rateColor = stat.rate >= 90 ? 'text-red-600' : stat.rate >= 70 ? 'text-yellow-600' : 'text-green-600'
  return (
    <>
      <tr className={depth === 0 ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'}>
        <td className="px-4 py-2.5 text-sm" style={{ paddingLeft: `${16 + depth * 20}px` }}>
          {stat.category.name}
        </td>
        <td className="px-4 py-2.5 text-sm text-right">{fmt(stat.budget)}</td>
        <td className="px-4 py-2.5 text-sm text-right">{fmt(stat.spent)}</td>
        <td className="px-4 py-2.5 text-sm text-right">{fmt(stat.remaining)}</td>
        <td className={`px-4 py-2.5 text-sm text-right font-medium ${rateColor}`}>{stat.rate}%</td>
      </tr>
      {stat.children?.map(child => (
        <CategoryRow key={child.category.id} stat={child} depth={depth + 1} />
      ))}
    </>
  )
}


export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sp = await searchParams
  const year = sp.year ? parseInt(sp.year) : new Date().getFullYear()
  const data = await getDashboardData(year)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예산 대시보드</h1>
        <div className="flex items-center gap-2">
          {years.map(y => (
            <Link
              key={y}
              href={`/?year=${y}`}
              className={`px-3 py-1 rounded text-sm ${y === year ? 'bg-emerald-600 text-white' : 'border hover:bg-gray-50'}`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="연간 총예산" value={fmt(data.totalBudget)} />
        <SummaryCard label="총지출"      value={fmt(data.totalSpent)} />
        <SummaryCard label="잔액"        value={fmt(data.remaining)} />
        <SummaryCard label="집행률"      value={`${data.executionRate}%`} sub={`${data.totalSpent.toLocaleString()} / ${data.totalBudget.toLocaleString()}`} />
      </div>

      {/* Category table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">카테고리별 현황</h2>
          <Link href="/budget" className="text-xs text-emerald-600 hover:underline">예산 편성 →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['카테고리', '예산', '지출', '잔액', '집행률'].map(h => (
                <th key={h} className={`px-4 py-2.5 font-medium text-gray-600 ${h === '카테고리' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.categoryStats.map(stat => (
              <CategoryRow key={stat.category.id} stat={stat} />
            ))}
            {data.categoryStats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  예산 데이터가 없습니다.{' '}
                  <Link href="/budget" className="text-emerald-600 underline">예산 편성하기</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly chart */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold text-sm mb-4">월별 지출 추이 ({year}년)</h2>
        <MonthlyBarChart data={data.monthlySpend} />
      </div>
    </div>
  )
}
