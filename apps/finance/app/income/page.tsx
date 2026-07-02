'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getIncome, updateIncome, deleteIncome, INCOME_CATEGORY_LABEL } from '@/actions/finance-actions'
import type { FinanceIncome } from '@/actions/finance-actions'
import { PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react'

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원' }

const CATEGORY_ENTRIES = Object.entries(INCOME_CATEGORY_LABEL)

const CATEGORY_COLORS: Record<string, string> = {
  national_grant:   'bg-blue-50 text-blue-700',
  provincial_grant: 'bg-indigo-50 text-indigo-700',
  local_grant:      'bg-violet-50 text-violet-700',
  donation:         'bg-pink-50 text-pink-700',
  self_funding:     'bg-amber-50 text-amber-700',
  other:            'bg-gray-100 text-gray-600',
}

type EditState = Omit<FinanceIncome, 'created_at'>

export default function IncomePage() {
  const now   = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState('')
  const [rows, setRows]   = useState<FinanceIncome[]>([])
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    startTransition(async () => {
      const data = await getIncome({ year, month: month ? parseInt(month) : undefined })
      setRows(data)
    })
  }, [year, month])

  function openEdit(row: FinanceIncome) {
    setEditId(row.id)
    setEditForm({ id: row.id, income_date: row.income_date, category: row.category, source: row.source, amount: row.amount, description: row.description, note: row.note })
    setError('')
  }

  function closeEdit() { setEditId(null); setEditForm(null) }

  function handleSave() {
    if (!editForm) return
    startTransition(async () => {
      const { id, ...input } = editForm
      const ok = await updateIncome(id, input)
      if (ok) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, ...editForm } : r))
        closeEdit()
      } else {
        setError('저장 실패')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 수입 내역을 삭제하시겠습니까?')) return
    startTransition(async () => {
      const ok = await deleteIncome(id)
      if (ok) setRows(prev => prev.filter(r => r.id !== id))
      else setError('삭제 실패')
    })
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">수입·후원금 관리</h1>
        <Link href="/income/new" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700">
          <PlusCircle className="w-4 h-4" />
          수입 등록
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">전체 월</option>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['수입일', '분류', '출처·기관', '내용', '금액', ''].map((h, i) => (
                <th key={i} className={`px-4 py-3 font-medium text-gray-600 ${h === '금액' ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 && !isPending && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">수입 내역이 없습니다.</td></tr>
            )}
            {rows.map(row =>
              editId === row.id && editForm ? (
                <tr key={row.id} className="bg-blue-50">
                  <td className="px-3 py-2">
                    <input type="date" value={editForm.income_date}
                      onChange={e => setEditForm(p => p ? { ...p, income_date: e.target.value } : p)}
                      className="border rounded px-2 py-1 text-xs w-32" />
                  </td>
                  <td className="px-3 py-2">
                    <select value={editForm.category}
                      onChange={e => setEditForm(p => p ? { ...p, category: e.target.value as FinanceIncome['category'] } : p)}
                      className="border rounded px-2 py-1 text-xs w-36">
                      {CATEGORY_ENTRIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.source}
                      onChange={e => setEditForm(p => p ? { ...p, source: e.target.value } : p)}
                      className="border rounded px-2 py-1 text-xs w-32" />
                  </td>
                  <td className="px-3 py-2">
                    <input value={editForm.description ?? ''}
                      onChange={e => setEditForm(p => p ? { ...p, description: e.target.value } : p)}
                      className="border rounded px-2 py-1 text-xs w-36" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" value={editForm.amount}
                      onChange={e => setEditForm(p => p ? { ...p, amount: parseInt(e.target.value) || 0 } : p)}
                      className="border rounded px-2 py-1 text-xs w-28 text-right" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <button onClick={handleSave} disabled={isPending}
                        className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={closeEdit} className="p-1.5 border rounded hover:bg-gray-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.income_date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[row.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {INCOME_CATEGORY_LABEL[row.category] ?? row.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.source}</td>
                  <td className="px-4 py-3 text-gray-700">{row.description ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(row.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(row.id)} disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">총 {rows.length}건 | 합계 {fmt(total)}</p>
    </div>
  )
}
