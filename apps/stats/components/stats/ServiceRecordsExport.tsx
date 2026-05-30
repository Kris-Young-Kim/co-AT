'use client'

import { useState } from 'react'
import { generateServiceRecordReport } from '@/actions/report-actions'
import { Download } from 'lucide-react'

export function ServiceRecordsExport({ defaultYear }: { defaultYear: number }) {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(`${defaultYear}-01-01`)
  const [endDate, setEndDate] = useState(`${defaultYear}-12-31`)

  async function handleExport() {
    if (!startDate || !endDate || startDate > endDate) {
      alert('기간을 올바르게 입력해 주세요')
      return
    }
    setLoading(true)
    const result = await generateServiceRecordReport({ startDate, endDate })
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
    a.download = result.filename ?? `서비스_실적_${startDate}_${endDate}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 w-full justify-center"
      >
        <Download className="h-4 w-4" />
        {loading ? '생성 중...' : '서비스 실적 리스트 다운로드'}
      </button>
    </div>
  )
}
