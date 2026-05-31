import { BusinessReportButton } from '@/stats/components/stats/BusinessReportButton'
import { ServiceRecordsExport } from '@/stats/components/stats/ServiceRecordsExport'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import { FileSpreadsheet } from 'lucide-react'

interface ExportPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function ExportPage({ searchParams }: ExportPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excel 내보내기</h1>
          <p className="text-sm text-gray-500 mt-1">중앙기관 보고용 Excel 파일을 생성합니다.</p>
        </div>
        <YearSelector currentYear={year} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-xl p-6 space-y-4 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">지역보조기기센터 사업 실적보고</h2>
              <p className="text-xs text-gray-500">중앙기관 제출용 (7개 시트)</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            대여 현황, 맞춤제작 서비스 현황 등<br />
            중앙기관 보고 양식 그대로 출력됩니다.
          </p>
          <BusinessReportButton year={year} />
        </div>

        <div className="border rounded-xl p-6 space-y-4 border-green-200 bg-green-50">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">지역보조기기센터 서비스 실적</h2>
              <p className="text-xs text-gray-500">기간별 서비스 건 목록</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            대상자별 상담·평가·체험·대여·맞춤제작 등<br />
            서비스 상세 내역 전체를 추출합니다.
          </p>
          <ServiceRecordsExport defaultYear={year} />
        </div>
      </div>
    </div>
  )
}
