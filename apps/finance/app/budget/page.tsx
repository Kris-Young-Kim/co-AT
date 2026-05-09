'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getBudgets, getCategories, upsertBudget, copyBudgetYear, getBudgetAdjustments } from '@/actions/finance-actions'
import type { FinanceBudgetCategoryWithChildren, FinanceBudgetWithCategory, FinanceBudgetAdjustment } from '@co-at/types'

function fmt(n: number) { return n.toLocaleString('ko-KR') }

const CURRENT_YEAR = new Date().getFullYear()

export default function BudgetPage() {
  const [year, setYear]           = useState(CURRENT_YEAR)
  const [categories, setCategories] = useState<FinanceBudgetCategoryWithChildren[]>([])
  const [budgets, setBudgets]     = useState<FinanceBudgetWithCategory[]>([])
  const [editing, setEditing]     = useState<Record<string, string>>({})
  const [adjustments, setAdjustments] = useState<Record<string, FinanceBudgetAdjustment[]>>({})
  const [showAdj, setShowAdj]     = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [message, setMessage]     = useState<string | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

  useEffect(() => {
    startTransition(async () => {
      const [cats, buds] = await Promise.all([getCategories(), getBudgets(year)])
      setCategories(cats)
      setBudgets(buds)
      setEditing({})
    })
  }, [year])

  function getBudgetAmount(categoryId: string): number {
    return budgets.find(b => b.category_id === categoryId)?.amount ?? 0
  }
  function getBudgetId(categoryId: string): string | null {
    return budgets.find(b => b.category_id === categoryId)?.id ?? null
  }

  async function handleSave(categoryId: string) {
    const raw = editing[categoryId]
    if (raw === undefined) return
    const amount = parseInt(raw.replace(/,/g, '')) || 0
    startTransition(async () => {
      const result = await upsertBudget({ year, category_id: categoryId, amount })
      if (result) {
        setBudgets(prev => {
          const idx = prev.findIndex(b => b.category_id === categoryId)
          const updated = { ...(prev[idx] ?? {}), ...result, finance_budget_categories: prev[idx]?.finance_budget_categories } as FinanceBudgetWithCategory
          return idx >= 0 ? prev.map((b, i) => i === idx ? updated : b) : [...prev, updated]
        })
        setEditing(prev => { const n = { ...prev }; delete n[categoryId]; return n })
        setMessage('저장됐습니다.')
        setTimeout(() => setMessage(null), 2000)
      }
    })
  }

  async function handleCopyYear() {
    startTransition(async () => {
      const ok = await copyBudgetYear(year - 1, year)
      if (ok) {
        const buds = await getBudgets(year)
        setBudgets(buds)
        setMessage(`${year - 1}년 예산을 ${year}년으로 복사했습니다.`)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage(`${year - 1}년 예산 데이터가 없습니다.`)
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  async function toggleAdjustments(categoryId: string) {
    const budgetId = getBudgetId(categoryId)
    if (!budgetId) return
    if (showAdj[categoryId]) {
      setShowAdj(prev => ({ ...prev, [categoryId]: false }))
      return
    }
    const adjs = await getBudgetAdjustments(budgetId)
    setAdjustments(prev => ({ ...prev, [categoryId]: adjs }))
    setShowAdj(prev => ({ ...prev, [categoryId]: true }))
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예산 관리</h1>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <button
            onClick={handleCopyYear}
            disabled={isPending}
            className="border px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            전년도 복사
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">예산(원)</th>
              <th className="px-4 py-3 font-medium text-gray-600 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(cat => (
              <>
                <tr key={cat.id} className="bg-gray-50">
                  <td className="px-4 py-2.5 font-semibold">{cat.name}</td>
                  <td className="px-4 py-2.5 text-right text-gray-400">
                    {fmt(cat.children.reduce((s, c) => s + getBudgetAmount(c.id), 0) + getBudgetAmount(cat.id))}
                  </td>
                  <td />
                </tr>
                {cat.children.map(child => (
                  <>
                    <tr key={child.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 pl-8">{child.name}</td>
                      <td className="px-4 py-2.5 text-right">
                        {editing[child.id] !== undefined ? (
                          <input
                            type="text"
                            value={editing[child.id]}
                            onChange={e => setEditing(prev => ({ ...prev, [child.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleSave(child.id)}
                            className="border rounded px-2 py-0.5 text-right w-36 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-emerald-600"
                            onClick={() => setEditing(prev => ({ ...prev, [child.id]: String(getBudgetAmount(child.id)) }))}
                          >
                            {fmt(getBudgetAmount(child.id))}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 flex gap-2 justify-end">
                        {editing[child.id] !== undefined && (
                          <button onClick={() => handleSave(child.id)} className="text-xs text-emerald-600 hover:underline">저장</button>
                        )}
                        <button onClick={() => toggleAdjustments(child.id)} className="text-xs text-gray-400 hover:underline">이력</button>
                      </td>
                    </tr>
                    {showAdj[child.id] && (
                      <tr key={`${child.id}-adj`}>
                        <td colSpan={3} className="px-8 py-2 bg-blue-50">
                          {(adjustments[child.id] ?? []).length === 0 ? (
                            <p className="text-xs text-gray-400">변경 이력 없음</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead><tr className="text-gray-500"><th className="text-left pb-1">일시</th><th className="text-right pb-1">변경 전</th><th className="text-right pb-1">변경 후</th><th className="text-left pb-1 pl-4">사유</th></tr></thead>
                              <tbody>
                                {adjustments[child.id].map(adj => (
                                  <tr key={adj.id}>
                                    <td>{new Date(adj.adjusted_at).toLocaleDateString('ko-KR')}</td>
                                    <td className="text-right">{fmt(adj.before_amount)}</td>
                                    <td className="text-right">{fmt(adj.after_amount)}</td>
                                    <td className="pl-4">{adj.reason ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  카테고리가 없습니다.{' '}
                  <Link href="/categories" className="text-emerald-600 underline">카테고리 관리</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">금액 클릭 → 인라인 편집 → Enter 또는 저장 클릭 (ADMIN 권한 필요)</p>
    </div>
  )
}
