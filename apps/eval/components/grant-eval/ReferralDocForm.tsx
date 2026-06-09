'use client'

import { useState, useTransition } from 'react'
import { createGrantReferralDoc } from '@/actions/grant-referral-actions'

interface Props {
  onCreated?: () => void
}

export function ReferralDocForm({ onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    doc_year: new Date().getFullYear(),
    doc_number: '',
    sending_org: '',
    doc_date: '',
    receive_date: '',
    referral_count: '',
    note: '',
  })

  function set(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createGrantReferralDoc({
        doc_year: form.doc_year,
        doc_number: form.doc_number || null,
        sending_org: form.sending_org,
        doc_date: form.doc_date || null,
        receive_date: form.receive_date || null,
        referral_count: form.referral_count ? parseInt(form.referral_count) : 0,
        note: form.note || null,
      })
      if (result.success) {
        onCreated?.()
        setForm((p) => ({ ...p, doc_number: '', sending_org: '', doc_date: '', receive_date: '', referral_count: '', note: '' }))
        setError(null)
      } else {
        setError(result.error ?? '생성 실패')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-5 bg-white mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">새 접수공문 등록</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">연도</label>
          <input type="number" value={form.doc_year}
            onChange={(e) => set('doc_year', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">공문번호</label>
          <input value={form.doc_number} onChange={(e) => set('doc_number', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">발송기관 *</label>
          <input required value={form.sending_org} onChange={(e) => set('sending_org', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">공문일</label>
          <input type="date" value={form.doc_date} onChange={(e) => set('doc_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">접수일</label>
          <input type="date" value={form.receive_date} onChange={(e) => set('receive_date', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">의뢰 건수</label>
          <input type="number" value={form.referral_count} onChange={(e) => set('referral_count', e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {isPending ? '등록 중...' : '등록'}
      </button>
    </form>
  )
}
