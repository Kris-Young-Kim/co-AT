'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extendRental } from '@/actions/rental-actions'

export function ExtendButton({ rentalId, currentEndDate }: { rentalId: string; currentEndDate: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(14)

  async function handleExtend() {
    if (!confirm(`${days}일 연장하시겠습니까?`)) return
    setLoading(true)
    const base = new Date(currentEndDate)
    base.setDate(base.getDate() + days)
    const newEndDate = base.toISOString().slice(0, 10)
    const result = await extendRental(rentalId, newEndDate)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error ?? '연장에 실패했습니다')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={days}
        onChange={e => setDays(Number(e.target.value))}
        className="px-2 py-2 border rounded-md text-sm"
      >
        {[7, 14, 30].map(d => <option key={d} value={d}>{d}일</option>)}
      </select>
      <button
        onClick={handleExtend}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '기간 연장'}
      </button>
    </div>
  )
}
