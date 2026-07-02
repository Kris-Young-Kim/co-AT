'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpenditure, uploadReceipt, getCategories } from '@/actions/finance-actions'
import type { FinanceBudgetCategoryWithChildren } from '@co-at/types'
import { ReceiptText } from 'lucide-react'

export default function NewExpenditurePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<FinanceBudgetCategoryWithChildren[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [spendDate, setSpendDate]   = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount]         = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote]             = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { getCategories().then(setCategories) }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadReceipt(fd)
    setUploading(false)
    if (result) setReceiptUrl(result.url)
    else setError('영수증 업로드 실패. 직접 URL을 입력하거나 나중에 시도해주세요.')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount.replace(/,/g, ''))
    if (!spendDate || !amt || !description) { setError('지출일, 금액, 내용을 입력해주세요.'); return }
    setError(null)
    startTransition(async () => {
      const result = await createExpenditure({
        category_id: categoryId || null,
        spend_date:  spendDate,
        amount:      amt,
        description,
        note:        note || undefined,
        receipt_url: receiptUrl || undefined,
      })
      if (result) router.push('/expenditures')
      else setError('저장 실패. 권한을 확인해주세요.')
    })
  }

  const allCategories = categories.flatMap(c => [c, ...c.children])

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">지출 수동 입력</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지출일 *</label>
          <input type="date" value={spendDate} onChange={e => setSpendDate(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">미분류</option>
            {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액(원) *</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="예: 50000" className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지출 내용 *</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        {/* 영수증 첨부 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">영수증 첨부</label>
          <label className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-md cursor-pointer text-sm transition-colors ${uploading ? 'opacity-50' : 'hover:border-emerald-400 hover:text-emerald-600'}`}>
            <ReceiptText className="h-4 w-4 text-gray-400" />
            {uploading ? '업로드 중...' : receiptUrl ? '파일 변경' : '파일 선택 (이미지·PDF)'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          {receiptUrl && (
            <div className="mt-1.5 flex items-center gap-2">
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate">영수증 확인</a>
              <button type="button" onClick={() => setReceiptUrl('')} className="text-xs text-red-400 hover:text-red-600">삭제</button>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">또는 URL 직접 입력:</p>
          <input type="url" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." className="mt-1 w-full border rounded-md px-3 py-1.5 text-xs" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending || uploading} className="bg-emerald-600 text-white px-5 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={() => router.back()} className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">취소</button>
        </div>
      </form>
    </div>
  )
}
