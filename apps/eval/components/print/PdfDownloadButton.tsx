'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'

type PdfActionResult = {
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}

interface PdfDownloadButtonProps {
  action: () => Promise<PdfActionResult>
  label?: string
}

export function PdfDownloadButton({ action, label = 'PDF 다운로드' }: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await action()
      if (!result.success || !result.buffer) {
        setError(result.error ?? '다운로드 실패')
        return
      }
      const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.filename ?? '문서'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('다운로드 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-md disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
