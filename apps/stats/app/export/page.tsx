import { ExportButton } from '@/stats/components/stats/ExportButton'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface ExportPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Excel 내보내기</h1>
        <YearSelector currentYear={year} />
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-lg space-y-4">
        <h2 className="font-semibold text-gray-900">보조기기센터 사업 실적 보고 ({year}년)</h2>
        <p className="text-sm text-gray-600">
          중앙 보고용 Excel 파일을 생성합니다.<br />
          포함 내용: 전체 사업 실적 (목표/실적/달성률), 월별 현황
        </p>
        <ExportButton year={year} />
      </div>
    </div>
  )
}
