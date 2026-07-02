'use client'

import { useState, useEffect, useTransition } from 'react'
import { getBudgetTransfers, createBudgetTransfer, getCategories } from '@/actions/finance-actions'
import type { FinanceBudgetTransfer } from '@/actions/finance-actions'
import type { FinanceBudgetCategoryWithChildren } from '@co-at/types'
import { ArrowRight } from 'lucide-react'

function fmt(n: number) { return n.toLocaleString('ko-KR') + '원' }

const CURRENT_YEAR = new Date().getFullYear()

export default function BudgetTransferPage() {
  const [year, setYear]     = useState(CURRENT_YEAR)
  const [categories, setCategories] = useState<FinanceBudgetCategoryWithChildren[]>([])
  const [transfers, setTransfers]   = useState<FinanceBudgetTransfer[]>([])
  const [fromId, setFromId] = useState('')
  const [toId, setToId]     = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  const years = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

  useEffect(() => {
    startTransition(async () => {
      const [cats, txs] = await Promise.all([getCategories(), getBudgetTransfers(year)])
      setCategories(cats)
      setTransfers(txs)
    })
  }, [year])

  const allCategories = categories.flatMap(c => [c, ...c.children])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount.replace(/,/g, ''))
    if (!fromId || !toId || !amt || !reason) { setError('모든 필드를 입력해주세요.'); return }
    if (fromId === toId) { setError('전출·전입 카테고리가 같을 수 없습니다.'); return }
    setError(null)
    startTransition(async () => {
      const result = await createBudgetTransfer({ year, from_category_id: fromId, to_category_id: toId, amount: amt, reason })
      if (result.ok) {
        const txs = await getBudgetTransfers(year)
        setTransfers(txs)
        setFromId(''); setToId(''); setAmount(''); setReason('')
        setSuccess('예산 전용이 완료되었습니다.')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error ?? '처리 실패')
      }
    })
  }

  const previewAmt = parseInt(amount.replace(/,/g, ''))

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">예산 전용(流用)</h1>
          <p className="text-sm text-gray-500 mt-1">카테고리 간 예산을 이전합니다 (ADMIN 권한 필요)</p>
        </div>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* Transfer Form */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">전용 신청</h2>

        {error   && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded">{error}</p>}
        {success && <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전출 카테고리 *</label>
              <select value={fromId} onChange={e => setFromId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" required>
                <option value="">선택하세요</option>
                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">예산이 줄어드는 항목</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전입 카테고리 *</label>
              <select value={toId} onChange={e => setToId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" required>
                <option value="">선택하세요</option>
                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">예산이 늘어나는 항목</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전용 금액(원) *</label>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="예: 500000"
              className="w-full border rounded-md px-3 py-2 text-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유 *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="예산 전용 사유를 구체적으로 입력해주세요"
              className="w-full border rounded-md px-3 py-2 text-sm" required />
          </div>

          {/* Preview */}
          {fromId && toId && previewAmt > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border text-sm">
              <span className="font-medium text-red-600">{allCategories.find(c => c.id === fromId)?.name ?? '—'}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-medium text-emerald-600">{allCategories.find(c => c.id === toId)?.name ?? '—'}</span>
              <span className="ml-auto font-semibold">{fmt(previewAmt)}</span>
            </div>
          )}

          <div className="pt-2 border-t">
            <button type="submit" disabled={isPending}
              className="bg-emerald-600 text-white px-6 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
              {isPending ? '처리 중...' : '전용 신청'}
            </button>
          </div>
        </form>
      </div>

      {/* Transfer History */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">전용 이력</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['일시', '전출', '전입', '금액', '사유'].map((h, i) => (
                  <th key={i} className={`px-4 py-3 font-medium text-gray-600 ${h === '금액' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfers.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">전용 이력이 없습니다.</td></tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{t.from_category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-emerald-700 font-medium">{t.to_category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(t.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
