import { getClientById } from '@/actions/client-actions'
import { getConsultationRecordById } from '@/actions/case-record-actions'
import { getDomainAssessmentsByConsultationRecord } from '@/actions/assessment-actions'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { DomainAssessmentEditCard } from '@/eval/components/eval/DomainAssessmentEditCard'

interface Props {
  params: Promise<{ clientId: string; consultRecordId: string }>
}

export default async function AssessmentSessionDetailPage({ params }: Props) {
  const { clientId, consultRecordId } = await params

  const [clientResult, consultResult, assessmentsResult] = await Promise.all([
    getClientById(clientId),
    getConsultationRecordById(consultRecordId),
    getDomainAssessmentsByConsultationRecord(consultRecordId),
  ])

  if (!clientResult.success || !clientResult.client) notFound()
  if (!consultResult.success || !consultResult.record) notFound()

  const client = clientResult.client
  const consult = consultResult.record
  const domainItems: ConsultDomainAssessment[] = assessmentsResult.success
    ? (assessmentsResult.assessments ?? [])
    : []

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/clients/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          대상자 정보로
        </Link>
        <Link
          href={`/print/sessions/${consultRecordId}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" />
          인쇄
        </Link>
      </div>

      {/* Client + session header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">
          {client.name} — 평가 세션
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {consult.consultation_date} · {consult.consultation_type}
          {consult.consultant ? ` · ${consult.consultant}` : ''}
        </p>
      </div>

      {/* Consultation record */}
      <div className="border rounded-lg p-5 bg-white mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b">상담기록지</h2>
        <dl className="space-y-3 text-sm">
          {consult.purpose && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 목적</dt>
              <dd className="text-gray-800">{consult.purpose}</dd>
            </div>
          )}
          {consult.current_situation && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">현재 상황</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{consult.current_situation}</dd>
            </div>
          )}
          {consult.content && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 내용</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{consult.content}</dd>
            </div>
          )}
          {consult.result && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">상담 결과</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{consult.result}</dd>
            </div>
          )}
          {consult.next_plan && (
            <div>
              <dt className="text-xs font-medium text-gray-500 mb-0.5">다음 계획</dt>
              <dd className="text-gray-800 whitespace-pre-wrap">{consult.next_plan}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Domain assessments (editable) */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          영역별 평가
          {domainItems.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">({domainItems.length}개 영역)</span>
          )}
        </h2>

        {domainItems.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center border rounded-lg bg-gray-50">
            이 상담기록지에 연결된 영역 평가가 없습니다
          </p>
        ) : (
          <div className="space-y-4">
            {domainItems.map(item => (
              <DomainAssessmentEditCard key={item.id} assessment={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
