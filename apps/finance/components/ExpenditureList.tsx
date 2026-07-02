'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, ReceiptText, X, Check } from 'lucide-react'
import { updateExpenditure, deleteExpenditure, uploadReceipt, getCategories } from '@/actions/finance-actions'
import type { FinanceExpenditureWithCategory, FinanceBudgetCategoryWithChildren } from '@co-at/types'

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원' }

interface Props {
  initialRows: FinanceExpenditureWithCategory[]
  categories: FinanceBudgetCategoryWithChildren[]
  canWrite: boolean
}

interface EditState {
  id: string
  category_id: string
  spend_date: string
  amount: string
  description: string
  note: string
  receipt_url: string
}

export function ExpenditureList({ initialRows, categories, canWrite }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const allCategories = categories.flatMap(c => [c, ...c.children])

  function openEdit(row: FinanceExpenditureWithCategory) {
    setEditId(row.id)
    setEditForm({
      id:           row.id,
      category_id:  row.category_id ?? '',
      spend_date:   row.spend_date,
      amount:       String(row.amount),
      description:  row.description,
      note:         row.note ?? '',
      receipt_url:  row.receipt_url ?? '',
    })
    setError('')
  }

  function closeEdit() { setEditId(null); setEditForm(null) }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editForm) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadReceipt(fd)
    setUploading(false)
    if (result) setEditForm(prev => prev ? { ...prev, receipt_url: result.url } : prev)
    else setError('영수증 업로드 실패')
  }

  function handleSave() {
    if (!editForm) return
    setError('')
    startTransition(async () => {
      const ok = await updateExpenditure(editForm.id, {
        category_id:  editForm.category_id || null,
        spend_date:   editForm.spend_date,
        amount:       parseInt(editForm.amount.replace(/,/g, '')) || 0,
        description:  editForm.description,
        note:         editForm.note || null,
        receipt_url:  editForm.receipt_url || null,
      })
      if (ok) {
        setRows(prev => prev.map(r => r.id === editForm.id ? {
          ...r,
          category_id:  editForm.category_id || null,
          spend_date:   editForm.spend_date,
          amount:       parseInt(editForm.amount.replace(/,/g, '')) || r.amount,
          description:  editForm.description,
          note:         editForm.note || null,
          receipt_url:  editForm.receipt_url || null,
          finance_budget_categories: allCategories.find(c => c.id === editForm.category_id) ?? null,
        } : r))
        closeEdit()
      } else {
        setError('저장 실패 (결재 연동 건은 수정 불가)')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('이 지출 내역을 삭제하시겠습니까?')) return
    startTransition(async () => {
      const ok = await deleteExpenditure(id)
      if (ok) setRows(prev => prev.filter(r => r.id !== id))
      else setError('삭제 실패 (결재 연동 건은 삭제 불가)')
    })
  }

  if (rows.length === 0) {
    return <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">지출 내역이 없습니다.</td></tr>
  }

  return (
    <>
      {error && (
        <tr><td colSpan={7} className="px-4 py-2">
          <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">{error}</p>
        </td></tr>
      )}
      {rows.map(row => (
        editId === row.id && editForm ? (
          <tr key={row.id} className="bg-blue-50">
            <td className="px-3 py-2">
              <input type="date" value={editForm.spend_date}
                onChange={e => setEditForm(p => p ? { ...p, spend_date: e.target.value } : p)}
                className="border rounded px-2 py-1 text-xs w-32" />
            </td>
            <td className="px-3 py-2">
              <select value={editForm.category_id}
                onChange={e => setEditForm(p => p ? { ...p, category_id: e.target.value } : p)}
                className="border rounded px-2 py-1 text-xs w-32">
                <option value="">미분류</option>
                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </td>
            <td className="px-3 py-2">
              <input value={editForm.description}
                onChange={e => setEditForm(p => p ? { ...p, description: e.target.value } : p)}
                className="border rounded px-2 py-1 text-xs w-40" />
            </td>
            <td className="px-3 py-2 text-right">
              <input type="number" value={editForm.amount}
                onChange={e => setEditForm(p => p ? { ...p, amount: e.target.value } : p)}
                className="border rounded px-2 py-1 text-xs w-28 text-right" />
            </td>
            <td className="px-3 py-2 text-xs text-gray-500">{row.is_manual ? '수동' : '결재'}</td>
            <td className="px-3 py-2">
              <div className="flex flex-col gap-1">
                {editForm.receipt_url && (
                  <a href={editForm.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[120px]">영수증 보기</a>
                )}
                <label className="text-xs text-gray-500 cursor-pointer hover:text-blue-600">
                  {uploading ? '업로드 중...' : '파일 첨부'}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
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
            <td className="px-4 py-3 text-gray-500 text-xs">{row.spend_date}</td>
            <td className="px-4 py-3 text-gray-500 text-xs">{row.finance_budget_categories?.name ?? <span className="text-amber-600">미분류</span>}</td>
            <td className="px-4 py-3">{row.description}</td>
            <td className="px-4 py-3 text-right font-medium">{fmt(row.amount)}</td>
            <td className="px-4 py-3">
              {row.is_manual
                ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">수동</span>
                : <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">결재</span>}
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                {row.receipt_url && (
                  <a href={row.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ReceiptText className="h-3 w-3" /> 영수증
                  </a>
                )}
                {row.source_approval_id && (
                  <a href={`${process.env.NEXT_PUBLIC_APPROVAL_URL ?? '/'}/${row.source_approval_id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">결재 보기</a>
                )}
              </div>
            </td>
            <td className="px-4 py-3">
              {canWrite && row.is_manual && (
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(row.id)} disabled={isPending} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </td>
          </tr>
        )
      ))}
    </>
  )
}
