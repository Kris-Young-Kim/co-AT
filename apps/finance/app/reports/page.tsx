'use client'

import { useState } from 'react'
import Link from 'next/link'
import { generateMonthlyReport, generateAnnualBudgetReport } from '@/actions/report-actions'
import { ChartsTab } from './ChartsTab'

function DownloadButton({ label, onDownload }: { label: string; onDownload: () => Promise<{ buffer?: number[]; filename?: string; error?: string; success: boolean }> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await onDownload()
    if (!result.success || !result.buffer) {
      setError(result.error ?? '다운로드 실패')
      setLoading(false)
      return
    }
    const blob = new Blob([new Uint8Array(result.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = result.filename ?? 'report.xlsx'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-emerald-600 text-white px-4 py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? '생성 중...' : label}
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function ReportCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  )
}

type Tab = 'downloads' | 'charts'

export default function ReportsPage() {
  const now   = new Date()
  const [tab, setTab]     = useState<Tab>('downloads')
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const years  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">리포트</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        {(['downloads', 'charts'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t === 'downloads' ? '리포트 출력' : '예산 현황'}
          </button>
        ))}
      </div>

      {tab === 'downloads' && (
        <>
          <div className="flex gap-3 items-center">
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
              {months.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <span className="text-sm text-gray-400">선택 기간 리포트에 적용됩니다</span>
          </div>

          <div className="grid gap-4">
            <ReportCard title="월간 지출 내역" desc={`${year}년 ${month}월 지출 내역 Excel 다운로드`}>
              <DownloadButton
                label="Excel 다운로드"
                onDownload={() => generateMonthlyReport({ year, month })}
              />
            </ReportCard>

            <ReportCard title="연간 예산 집계표" desc={`${year}년 카테고리별 예산/지출/잔액 Excel 다운로드`}>
              <DownloadButton
                label="Excel 다운로드"
                onDownload={() => generateAnnualBudgetReport({ year })}
              />
            </ReportCard>

            <ReportCard title="결산 보고서 인쇄" desc="인쇄 전용 레이아웃으로 이동 후 브라우저 인쇄">
              <Link
                href={`/reports/print?year=${year}`}
                target="_blank"
                className="block w-full text-center border px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                인쇄 페이지 열기
              </Link>
            </ReportCard>
          </div>
        </>
      )}

      {tab === 'charts' && <ChartsTab initialYear={now.getFullYear()} />}
    </div>
  )
}
