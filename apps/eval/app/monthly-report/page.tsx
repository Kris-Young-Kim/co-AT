import Link from 'next/link'
import { getMonthlyConfirmedSummary, generateMonthlyConfirmedExcel } from '@/actions/monthly-report-actions'
import { MonthlyReportTable } from '@/eval/components/eval/MonthlyReportTable'
import { DownloadReportButton } from '@/eval/components/eval/DownloadReportButton'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function MonthlyReportPage({ searchParams }: Props) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))
  const currentYear = new Date().getFullYear()
  const AVAILABLE_YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)

  const result = await getMonthlyConfirmedSummary(year)
  const rows = result.success ? result.rows : []

  const downloadAction = generateMonthlyConfirmedExcel.bind(null, year)

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">월별 확정 실적 보고서</h1>
        <p className="text-sm text-gray-500 mt-1">
          record_status = <span className="font-mono text-green-700">완료</span> 기준 집계 — 중앙보조기기센터 제출 양식
        </p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          {AVAILABLE_YEARS.map(y => (
            <Link
              key={y}
              href={`/monthly-report?year=${y}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                y === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {y}년
            </Link>
          ))}
        </div>
        {result.success && (
          <DownloadReportButton
            label={`${year}년 Excel 다운로드`}
            action={downloadAction}
          />
        )}
      </div>

      {!result.success ? (
        <p className="text-red-500 text-sm">{result.error}</p>
      ) : (
        <MonthlyReportTable rows={rows} year={year} />
      )}
    </div>
  )
}
