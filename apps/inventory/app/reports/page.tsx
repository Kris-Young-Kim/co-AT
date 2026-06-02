'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { generateRentalReport, generateDispatchSummaryReport } from '@/inventory/actions/report-actions'

function DownloadButton({ label, onDownload }: {
  label: string
  onDownload: () => Promise<{ buffer?: number[]; filename?: string; error?: string; success: boolean }>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true); setError(null)
    const result = await onDownload()
    if (!result.success || !result.buffer) { setError(result.error ?? '다운로드 실패'); setLoading(false); return }
    const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = result.filename ?? 'report.xlsx'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setLoading(false)
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">리포트</h1>

      <div className="flex gap-3 items-center">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>

      <div className="grid gap-4">
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <p className="font-semibold">월간 대여 현황</p>
          <p className="text-sm text-gray-500">{year}년 {month}월 대여 내역 Excel</p>
          <DownloadButton label="Excel 다운로드" onDownload={() => generateRentalReport({ year, month })} />
        </div>
        <div className="bg-white border rounded-lg p-5 space-y-3">
          <p className="font-semibold">연간 출고 통계</p>
          <p className="text-sm text-gray-500">{year}년 대여/맞춤제작/재사용 통계 Excel</p>
          <DownloadButton label="Excel 다운로드" onDownload={() => generateDispatchSummaryReport({ year })} />
        </div>
      </div>
    </div>
  )
}
