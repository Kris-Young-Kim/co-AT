'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extendRental, returnRental } from '@/actions/rental-actions'

interface RentalInlineActionsProps {
  rentalId: string
  currentEndDate: string
}

export function RentalInlineActions({ rentalId, currentEndDate }: RentalInlineActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'return' | 'extend' | null>(null)
  const [days, setDays] = useState(14)

  async function handleReturn() {
    if (!confirm('반납 처리하시겠습니까?')) return
    setLoading('return')
    const result = await returnRental(rentalId)
    setLoading(null)
    if (result.success) router.refresh()
    else alert(result.error ?? '반납 처리에 실패했습니다')
  }

  async function handleExtend() {
    if (!confirm(`${days}일 연장하시겠습니까?`)) return
    setLoading('extend')
    const base = new Date(currentEndDate)
    base.setDate(base.getDate() + days)
    const newEndDate = base.toISOString().slice(0, 10)
    const result = await extendRental(rentalId, newEndDate)
    setLoading(null)
    if (result.success) router.refresh()
    else alert(result.error ?? '연장에 실패했습니다')
  }

  const busy = loading !== null

  return (
    <div className="flex items-center gap-1.5 flex-nowrap">
      <button
        onClick={handleReturn}
        disabled={busy}
        className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
      >
        {loading === 'return' ? '...' : '반납'}
      </button>
      <select
        value={days}
        onChange={e => setDays(Number(e.target.value))}
        disabled={busy}
        className="px-1.5 py-1 border rounded text-xs"
      >
        {[7, 14, 30].map(d => <option key={d} value={d}>{d}일</option>)}
      </select>
      <button
        onClick={handleExtend}
        disabled={busy}
        className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
      >
        {loading === 'extend' ? '...' : '연장'}
      </button>
    </div>
  )
}
