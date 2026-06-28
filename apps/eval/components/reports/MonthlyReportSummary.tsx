import type { MonthlyReportSummary } from '@/actions/monthly-report-actions'

interface Props {
  summary: MonthlyReportSummary
}

interface SummarySectionProps {
  title: string
  rows: Array<{ label: string; count: number }>
}

function SummarySection({ title, rows }: SummarySectionProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </p>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(({ label, count }) => (
            <tr key={label} className="border-t border-gray-100 first:border-0">
              <td className="py-1.5 text-gray-700">{label}</td>
              <td className="py-1.5 text-right font-medium text-gray-900 tabular-nums">
                {count}건
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MonthlyReportSummaryTable({ summary }: Props) {
  const serviceTypeRows = [
    { label: '상담',          count: summary.consult },
    { label: '체험지원',      count: summary.trial },
    { label: '대여',          count: summary.rental },
    { label: '맞춤제작',      count: summary.customMake },
    { label: '교부사업 평가', count: summary.grant },
    { label: '교육',          count: summary.education },
    { label: '정보제공',      count: summary.infoProvision },
    { label: '소독·세척',     count: summary.cleaning },
    { label: '수리',          count: summary.repair },
    { label: '재사용지원',    count: summary.reuse },
    { label: '모니터링',      count: summary.monitoring },
    { label: '기타사업',      count: summary.otherBusiness },
  ]

  const fundingRows = [
    { label: '공적급여', count: summary.publicFunding },
    { label: '민간지원', count: summary.privateFunding },
    { label: '자부담',   count: summary.selfPay },
  ]

  const economicRows = [
    { label: '수급자', count: summary.beneficiary },
    { label: '차상위', count: summary.nearPoverty },
    { label: '일반',   count: summary.general },
  ]

  const severityRows = [
    { label: '중증', count: summary.severe },
    { label: '경증', count: summary.mild },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left column: total count + service type */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="mb-6 text-center">
          <span className="text-5xl font-bold text-gray-900">{summary.totalRecords}</span>
          <span className="ml-2 text-base text-gray-500 font-medium">건 (전체)</span>
        </div>
        <SummarySection title="서비스 유형" rows={serviceTypeRows} />
      </div>

      {/* Right column: 3 bordered boxes */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection title="재원 구분" rows={fundingRows} />
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection title="경제 상태" rows={economicRows} />
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <SummarySection title="장애 정도" rows={severityRows} />
        </div>
      </div>
    </div>
  )
}
