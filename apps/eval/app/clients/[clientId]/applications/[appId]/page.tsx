import { getIntakeRecordsByApplication } from '@/actions/intake-actions'
import { getDomainAssessments } from '@/actions/assessment-actions'
import Link from 'next/link'
import { ArrowLeft, FileText, ClipboardCheck } from 'lucide-react'

interface AppDetailPageProps {
  params: Promise<{ clientId: string; appId: string }>
}

export default async function ApplicationDetailPage({ params }: AppDetailPageProps) {
  const { clientId, appId } = await params

  const [intakeResult, assessmentResult] = await Promise.all([
    getIntakeRecordsByApplication(appId),
    getDomainAssessments(appId),
  ])

  const intakeRecords = intakeResult.success ? intakeResult.records ?? [] : []
  const assessments = assessmentResult.success ? assessmentResult.assessments ?? [] : []

  return (
    <div className="p-8">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        클라이언트로
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">신청서 상세</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">상담 기록지 (첨부 19)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">{intakeRecords.length}건 작성됨</p>
          {intakeRecords.length > 0 && (
            <ul className="space-y-1 mb-4">
              {intakeRecords.slice(0, 3).map(r => (
                <li key={r.id} className="text-sm text-gray-700">{r.consult_date} 상담</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Link
              href={`/clients/${clientId}/applications/${appId}/intake`}
              className="flex-1 text-center py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50"
            >
              작성하기
            </Link>
            {intakeRecords.length > 0 && (
              <Link
                href={`/print/intake/${appId}`}
                target="_blank"
                className="flex-1 text-center py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                PDF 출력
              </Link>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">영역별 평가 (첨부 21)</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">{assessments.length}개 영역 평가됨</p>
          {assessments.length > 0 && (
            <ul className="space-y-1 mb-4">
              {assessments.slice(0, 3).map((a: { id: string; domain_type: string; evaluation_date: string }) => (
                <li key={a.id} className="text-sm text-gray-700">
                  {a.domain_type} 영역 — {a.evaluation_date}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Link
              href={`/clients/${clientId}/applications/${appId}/assessment`}
              className="flex-1 text-center py-2 border border-green-600 text-green-600 rounded-md text-sm font-medium hover:bg-green-50"
            >
              평가하기
            </Link>
            {assessments.length > 0 && (
              <Link
                href={`/print/assessment/${assessments[0].id}`}
                target="_blank"
                className="flex-1 text-center py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                PDF 출력
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
