'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface DownloadReportButtonProps {
  label: string
  action: () => Promise<{ success: boolean; buffer?: number[]; filename?: string; error?: string }>
}

export function DownloadReportButton({ label, action }: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await action()
      if (!result.success || !result.buffer || !result.filename) {
        setError(result.error ?? '알 수 없는 오류')
        return
      }
      const blob = new Blob([new Uint8Array(result.buffer)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="h-4 w-4" />
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
