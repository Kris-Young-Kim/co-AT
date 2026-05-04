'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { confirmSalaryRecord } from '@/actions/salary-actions'

interface Props {
  recordId: string
}

export function SalaryConfirmButton({ recordId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!confirm('급여를 확정하시겠습니까? 확정 후에는 수정이 불가합니다.')) return
    setLoading(true)
    await confirmSalaryRecord(recordId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={loading}
      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? '처리 중...' : '확정'}
    </button>
  )
}
