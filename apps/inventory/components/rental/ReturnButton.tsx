'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { returnRental } from '@/actions/rental-actions'

export function ReturnButton({ rentalId }: { rentalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleReturn() {
    if (!confirm('반납 처리하시겠습니까?')) return
    setLoading(true)
    const result = await returnRental(rentalId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error ?? '반납 처리에 실패했습니다')
    }
  }

  return (
    <button
      onClick={handleReturn}
      disabled={loading}
      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? '처리 중...' : '반납 처리'}
    </button>
  )
}
