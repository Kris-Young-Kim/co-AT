'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createIncome } from '@/actions/finance-actions'
import { INCOME_CATEGORY_LABEL } from '@/lib/constants'
import type { FinanceIncome } from '@/actions/finance-actions'

const CATEGORY_ENTRIES = Object.entries(INCOME_CATEGORY_LABEL)

export default function NewIncomePage() {
  const router = useRouter()
  const [incomeDate, setIncomeDate]   = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory]       = useState<FinanceIncome['category']>('national_grant')
  const [source, setSource]           = useState('')
  const [amount, setAmount]           = useState('')
  const [description, setDescription] = useState('')
  const [note, setNote]               = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount.replace(/,/g, ''))
    if (!incomeDate || !source || !amt) { setError('수입일, 출처, 금액을 입력해주세요.'); return }
    setError(null)
    startTransition(async () => {
      const result = await createIncome({
        income_date:  incomeDate,
        category,
        source,
        amount:       amt,
        description:  description || null,
        note:         note || null,
      })
      if (result) router.push('/income')
      else setError('저장 실패. 권한을 확인해주세요.')
    })
  }

  return (
    <div className="p-8 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">수입·후원금 등록</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">수입일 *</label>
          <input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">분류 *</label>
          <select value={category} onChange={e => setCategory(e.target.value as FinanceIncome['category'])}
            className="w-full border rounded-md px-3 py-2 text-sm">
            {CATEGORY_ENTRIES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출처·기관명 *</label>
          <input type="text" value={source} onChange={e => setSource(e.target.value)}
            placeholder="예: 보건복지부, ○○복지재단"
            className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">금액(원) *</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="예: 5000000"
            className="w-full border rounded-md px-3 py-2 text-sm" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="보조금 용도 등"
            className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending}
            className="bg-emerald-600 text-white px-5 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50">
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50">취소</button>
        </div>
      </form>
    </div>
  )
}
