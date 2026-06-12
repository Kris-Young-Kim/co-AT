import { getIntakeRecordsByApplication } from '@/actions/intake-actions'
import { getDomainAssessments } from '@/actions/assessment-actions'
import { getApplicationsByClientId } from '@/actions/application-actions'
import { getClientById } from '@/actions/client-actions'
import { getServiceRecordsByApplication } from '@/actions/service-record-actions'
import { AssessmentGrid } from '@/eval/components/eval/AssessmentGrid'
import { ApplicationDetailForm } from '@/eval/components/eval/ApplicationDetailForm'
import { PipelineProgress } from '@/eval/components/eval/PipelineProgress'
import Link from 'next/link'
import { ArrowLeft, FileText, ClipboardCheck, Plus, Printer, ClipboardList, ClipboardEdit } from 'lucide-react'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ clientId: string; appId: string }>
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { clientId, appId } = await params

  const [intakeResult, assessmentResult, clientResult, appsResult, serviceRecordResult] = await Promise.all([
    getIntakeRecordsByApplication(appId),
    getDomainAssessments(appId),
    getClientById(clientId),
    getApplicationsByClientId(clientId),
    getServiceRecordsByApplication(appId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const applications = appsResult.success ? appsResult.applications ?? [] : []
  const application = applications.find(a => a.id === appId)
  if (!application) notFound()

  const intakeRecords = intakeResult.success ? (intakeResult.records ?? []) : []
  const assessments  = assessmentResult.success ? (assessmentResult.assessments ?? []) : []
  const serviceRecords = serviceRecordResult.success ? (serviceRecordResult.records ?? []) : []

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        클라이언트로
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">신청서 상세</h1>

      {/* ── 진행 단계 ── */}
      <div className="mb-8">
        <PipelineProgress
          intakeCount={intakeRecords.length}
          assessmentCount={assessments.length}
          serviceRecordCount={serviceRecords.length}
          applicationStatus={application.status}
        />
      </div>

      {/* ── 접수 및 상담 ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">접수 및 상담</h2>
        </div>
        <div className="border rounded-lg p-5 bg-white">
          <ApplicationDetailForm
            application={application as Parameters<typeof ApplicationDetailForm>[0]['application']}
            clientId={clientId}
            clientName={client.name}
            registrationNumber={(client as { registration_number?: string | null }).registration_number}
          />
        </div>
      </section>

      {/* ── 상담 기록지 ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">상담 기록지 (첨부 19)</h2>
            <span className="text-xs text-gray-400">{intakeRecords.length}건</span>
          </div>
          <div className="flex gap-2">
            {intakeRecords.length > 0 && (
              <Link
                href={`/print/intake/${appId}`}
                target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50"
              >
                <Printer className="h-3.5 w-3.5" />
                PDF 출력
              </Link>
            )}
            <Link
              href={`/clients/${clientId}/applications/${appId}/intake`}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              작성하기
            </Link>
          </div>
        </div>

        {intakeRecords.length > 0 ? (
          <div className="border rounded-lg divide-y bg-white">
            {intakeRecords.map((r: { id: string; consult_date: string; consultation_content: string | null }) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-700">{r.consult_date} 상담</span>
                {r.consultation_content && (
                  <span className="text-xs text-gray-400 truncate max-w-xs ml-4">{r.consultation_content}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg px-4 py-6 text-center text-sm text-gray-400 bg-gray-50">
            아직 작성된 상담 기록이 없습니다
          </div>
        )}
      </section>

      {/* ── 서비스 기록 ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5 text-orange-600" />
            <h2 className="font-semibold text-gray-900">서비스 기록</h2>
            <span className="text-xs text-gray-400">{serviceRecords.length}건</span>
          </div>
          <Link
            href={`/clients/${clientId}/applications/${appId}/service-record`}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
          >
            <Plus className="h-3.5 w-3.5" />
            작성하기
          </Link>
        </div>
        {serviceRecords.length > 0 ? (
          <div className="border rounded-lg divide-y bg-white">
            {serviceRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-700">{r.received_at} 기록</span>
                {r.service_content && (
                  <span className="text-xs text-gray-400 truncate max-w-xs ml-4">{r.service_content}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg px-4 py-6 text-center text-sm text-gray-400 bg-gray-50">
            아직 작성된 서비스 기록이 없습니다
          </div>
        )}
      </section>

      {/* ── 영역별 평가 그리드 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-gray-900">영역별 평가 (첨부 21)</h2>
          </div>
          <div className="flex gap-2">
            {assessments.length > 0 && (
              <Link
                href={`/print/assessment/${assessments[0].id}`}
                target="_blank"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50"
              >
                <Printer className="h-3.5 w-3.5" />
                PDF 출력
              </Link>
            )}
            <Link
              href={`/clients/${clientId}/applications/${appId}/assessment`}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              <Plus className="h-3.5 w-3.5" />
              평가하기
            </Link>
          </div>
        </div>

        <AssessmentGrid
          assessments={assessments}
          clientId={clientId}
          appId={appId}
        />
      </section>
    </div>
  )
}
