'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import {
  generateConsultationHwpx,
  generateClientConsultationsHwpx,
} from '@/eval/actions/consultation-hwp-actions'

interface ConsultationHwpDownloadButtonProps {
  recordId?: string
  clientId?: string
  label?: string
}

export function ConsultationHwpDownloadButton({
  recordId,
  clientId,
  label = 'HWP 다운로드',
}: ConsultationHwpDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!recordId && !clientId) return
    setLoading(true)
    setError(null)
    try {
      const result = recordId
        ? await generateConsultationHwpx(recordId)
        : await generateClientConsultationsHwpx(clientId!)

      if (!result.success || !result.buffer) {
        setError(result.error ?? '다운로드 실패')
        return
      }

      const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/hwp+zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.filename ?? '상담기록지'}.hwpx`
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
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 shadow-md disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
