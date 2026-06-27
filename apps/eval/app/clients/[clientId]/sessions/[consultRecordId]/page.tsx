import { getClientById } from '@/actions/client-actions'
import { getConsultationRecordById } from '@/actions/case-record-actions'
import { getDomainAssessmentsByConsultationRecord } from '@/actions/assessment-actions'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ clientId: string; consultRecordId: string }>
}

const DOMAIN_LABELS: Record<string, string> = {
  WC: '휠체어 및 이동',
  ADL: '일상생활동작',
  S: '감각',
  SP: '앉기 및 자세',
  EC: '주택 및 환경개조',
  CA: '컴퓨터접근',
  L: '레저',
  AAC: '보완대체의사소통',
  AM: '자동차개조',
}

const DOMAIN_COLORS: Record<string, string> = {
  WC: 'bg-blue-50 text-blue-700',
  ADL: 'bg-green-50 text-green-700',
  S: 'bg-yellow-50 text-yellow-700',
  SP: 'bg-purple-50 text-purple-700',
  EC: 'bg-orange-50 text-orange-700',
  CA: 'bg-cyan-50 text-cyan-700',
  L: 'bg-pink-50 text-pink-700',
  AAC: 'bg-indigo-50 text-indigo-700',
  AM: 'bg-red-50 text-red-700',
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
  const domainItems: ConsultDomainAssessment[] = assessmentsResult.success ? (assessmentsResult.assessments ?? []) : []

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href={`/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        대상자 정보로
      </Link>

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

      {/* Domain assessments */}
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
              <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${DOMAIN_COLORS[item.domain_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {item.domain_type}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {DOMAIN_LABELS[item.domain_type] ?? item.domain_type}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{item.evaluation_date}</span>
                </div>
                <div className="px-4 py-3 space-y-2 text-sm">
                  {item.evaluator_opinion && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">평가자 의견</span>
                      <p className="mt-0.5 text-gray-700 whitespace-pre-wrap">{item.evaluator_opinion}</p>
                    </div>
                  )}
                  {item.recommended_device && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">추천 보조기기</span>
                      <p className="mt-0.5 text-gray-700">{item.recommended_device}</p>
                    </div>
                  )}
                  {item.future_plan && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">향후 계획</span>
                      <p className="mt-0.5 text-gray-700">{item.future_plan}</p>
                    </div>
                  )}
                  {!item.evaluator_opinion && !item.recommended_device && !item.future_plan && (
                    <p className="text-gray-400 text-xs">세부 내용 없음</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
