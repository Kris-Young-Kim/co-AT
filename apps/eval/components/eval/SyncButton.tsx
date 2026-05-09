'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface SyncButtonProps {
  label: string
  action: () => Promise<{ success: boolean; rowsAdded?: number; rowsSkipped?: number; error?: string }>
  onComplete?: () => void
}

export function SyncButton({ label, action, onComplete }: SyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res = await action()
      if (res.success) {
        setResult(`완료: ${res.rowsAdded}건 추가, ${res.rowsSkipped}건 중복 건너뜀`)
        onComplete?.()
      } else {
        setResult(`오류: ${res.error ?? '알 수 없는 오류'}`)
      }
    } catch (e) {
      setResult(`오류: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? '동기화 중...' : label}
      </button>
      {result && (
        <p className={`text-sm ${result.startsWith('오류') ? 'text-red-600' : 'text-green-600'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
