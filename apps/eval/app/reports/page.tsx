import Link from 'next/link'
import { CheckCircle2, Circle, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { getYearlyMonthlyGrid, MonthlyGridItem } from '@/actions/monthly-report-actions'

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = params.year ? parseInt(params.year) : currentYear

  const result = await getYearlyMonthlyGrid(year)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">월별 실적 보고서</h1>
        <p className="mt-1 text-sm text-gray-500">중앙보조기기센터 제출용 월별 실적 집계</p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`?year=${year - 1}`}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="이전 연도"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm">
          {year}년
        </span>

        {year < currentYear && (
          <Link
            href={`?year=${year + 1}`}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="다음 연도"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Error state */}
      {!result.success && (
        <p className="text-red-600 text-sm font-medium">{result.error}</p>
      )}

      {/* 12-month grid */}
      {result.success && (
        <div className="grid grid-cols-3 gap-4">
          {result.grid.map((item: MonthlyGridItem) => (
            <Link
              key={item.month}
              href={`/reports/${year}/${item.month}`}
              className="group relative flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
            >
              {/* Month header */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-800">
                  {item.month}월
                </span>
                {item.totalRecords > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>

              {/* Record counts */}
              <div className="flex flex-col gap-1 text-sm text-gray-500">
                <span>전체: {item.totalRecords}건</span>
                <span className={item.completedRecords > 0 ? 'text-green-600 font-medium' : ''}>
                  완료: {item.completedRecords}건
                </span>
              </div>

              {/* Report link indicator */}
              {item.totalRecords > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mt-auto pt-1">
                  <FileText className="w-4 h-4" />
                  <span>보고서 보기</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
