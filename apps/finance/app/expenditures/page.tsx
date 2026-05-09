import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@co-at/auth'
import { ROLES } from '@co-at/types'
import { getExpenditures, getCategories } from '@/actions/finance-actions'
import type { FinanceExpenditureWithCategory, FinanceBudgetCategoryWithChildren } from '@co-at/types'
import { PlusCircle } from 'lucide-react'

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원' }

interface Props {
  searchParams: Promise<{ year?: string; month?: string; category_id?: string; type?: string }>
}

export default async function ExpendituresPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sp = await searchParams
  const year       = sp.year        ? parseInt(sp.year)  : new Date().getFullYear()
  const month      = sp.month       ? parseInt(sp.month) : undefined
  const categoryId = sp.category_id ?? undefined
  const typeFilter = sp.type        ?? undefined

  const [rows, categories] = await Promise.all([
    getExpenditures({ year, month, category_id: categoryId, is_manual: typeFilter === 'manual' ? true : typeFilter === 'approval' ? false : undefined }),
    getCategories(),
  ])

  const allCategories = categories.flatMap(c => [c, ...c.children])
  const canWrite = await requireRole(ROLES.MANAGER)

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years  = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">지출 내역</h1>
        {canWrite && (
          <Link href="/expenditures/new" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700">
            <PlusCircle className="w-4 h-4" />
            수동 입력
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <select name="year" defaultValue={year} className="border rounded-md px-3 py-1.5 text-sm">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select name="month" defaultValue={month ?? ''} className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">전체 월</option>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
        <select name="category_id" defaultValue={categoryId ?? ''} className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">전체 카테고리</option>
          {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="type" defaultValue={typeFilter ?? ''} className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">전체 유형</option>
          <option value="approval">결재 연동</option>
          <option value="manual">수동 입력</option>
        </select>
        <button type="submit" className="bg-gray-800 text-white px-4 py-1.5 rounded-md text-sm hover:bg-gray-700">적용</button>
        <Link href="/expenditures" className="border px-4 py-1.5 rounded-md text-sm hover:bg-gray-50">초기화</Link>
      </form>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['지출일', '카테고리', '내용', '금액', '유형', ''].map((h, i) => (
                <th key={i} className={`px-4 py-3 font-medium text-gray-600 ${h === '금액' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{row.spend_date}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{row.finance_budget_categories?.name ?? <span className="text-amber-600">미분류</span>}</td>
                <td className="px-4 py-3">{row.description}</td>
                <td className="px-4 py-3 text-right font-medium">{fmt(row.amount)}</td>
                <td className="px-4 py-3">
                  {row.is_manual ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">수동</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">결재</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.source_approval_id && (
                    <a href={`${process.env.NEXT_PUBLIC_APPROVAL_URL ?? '/'}/${row.source_approval_id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">결재 보기</a>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">지출 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {rows.length}건 | 합계 {fmt(rows.reduce((s, r) => s + r.amount, 0))}</p>
    </div>
  )
}
