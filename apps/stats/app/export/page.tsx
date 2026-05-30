import { ExportButton } from '@/stats/components/stats/ExportButton'
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

  const cards = [
    {
      title: '사업 실적 보고서',
      subtitle: '중앙기관 제출용 (7개 시트)',
      description: (
        <>
          대여 현황, 맞춤제작 서비스 현황 등<br />
          중앙기관 보고 양식 그대로 출력됩니다.
        </>
      ),
      color: 'blue' as const,
      action: <BusinessReportButton year={year} />,
    },
    {
      title: '서비스 실적 리스트',
      subtitle: '기간별 서비스 건 목록',
      description: (
        <>
          대상자별 상담·평가·체험·대여·맞춤제작 등<br />
          서비스 상세 내역 전체를 추출합니다.
        </>
      ),
      color: 'green' as const,
      action: <ServiceRecordsExport defaultYear={year} />,
    },
    {
      title: 'KPI 요약 보고서',
      subtitle: '내부용 (2개 시트)',
      description: (
        <>
          전체 사업 실적 (목표/실적/달성률) +<br />
          월별 서비스 현황 요약표
        </>
      ),
      color: 'gray' as const,
      action: <ExportButton year={year} />,
    },
  ]

  const colorMap = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    gray: 'border-gray-200 bg-gray-50',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Excel 내보내기</h1>
          <p className="text-sm text-gray-500 mt-1">중앙기관 보고용 및 내부 분석용 Excel 파일을 생성합니다.</p>
        </div>
        <YearSelector currentYear={year} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div
            key={card.title}
            className={`border rounded-xl p-6 space-y-4 ${colorMap[card.color]}`}
          >
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">{card.title}</h2>
                <p className="text-xs text-gray-500">{card.subtitle}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{card.description}</p>
            {card.action}
          </div>
        ))}
      </div>
    </div>
  )
}
