'use client'

import { useState } from 'react'
import { generateBusinessReport } from '@/actions/report-actions'
import { Download } from 'lucide-react'

export function BusinessReportButton({ year }: { year: number }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const result = await generateBusinessReport({ year })
    setLoading(false)

    if (!result.success || !result.buffer) {
      alert(result.error ?? 'Excel 생성에 실패했습니다')
      return
    }

    const blob = new Blob(
      [new Uint8Array(result.buffer)],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename ?? `${year}년_사업실적보고.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {loading ? '생성 중...' : `${year}년 사업 실적 보고서 다운로드`}
    </button>
  )
}
