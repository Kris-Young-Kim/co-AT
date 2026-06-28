'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { generateMonthlyReportExcel } from '@/actions/monthly-report-actions'

interface Props {
  year: number
  month: number
}

export function MonthlyReportExportButton({ year, month }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateMonthlyReportExcel(year, month)
      if (!result.success || !result.buffer || !result.filename) {
        setError(result.error ?? '알 수 없는 오류가 발생했습니다')
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
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        엑셀 내보내기
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
