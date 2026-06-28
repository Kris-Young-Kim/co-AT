import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { getMonthlyReportSummary } from '@/actions/monthly-report-actions'
import { MonthlyReportSummaryTable } from '@/components/reports/MonthlyReportSummary'
import { MonthlyReportExportButton } from '@/components/reports/MonthlyReportExportButton'

interface Props {
  params: Promise<{ year: string; month: string }>
}

export default async function MonthlyReportDetailPage({ params }: Props) {
  const { year: yearStr, month: monthStr } = await params
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    notFound()
  }

  const result = await getMonthlyReportSummary(year, month)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/reports?year=${year}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          월별 보고서 목록
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {year}년 {month}월 실적 보고서
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              중앙보조기기센터 보고 양식 — 서비스 기록 집계
            </p>
          </div>
          <MonthlyReportExportButton year={year} month={month} />
        </div>
      </div>

      {/* Error state */}
      {!result.success && (
        <p className="text-red-600 text-sm font-medium">{result.error}</p>
      )}

      {/* Content */}
      {result.success && result.summary.totalRecords === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">
            {year}년 {month}월에 등록된 서비스 기록이 없습니다.
          </p>
          <Link
            href="/service-records"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            서비스 기록 등록하기
          </Link>
        </div>
      )}

      {result.success && result.summary.totalRecords > 0 && (
        <MonthlyReportSummaryTable summary={result.summary} />
      )}
    </div>
  )
}
