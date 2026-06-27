import { getClientById, getClientActiveServices, getClientHistory, getSimilarClients, getLinkedPortalUserInfo, getClientTags } from '@/actions/client-actions'
import { getApplicationsByClientId } from '@/actions/application-actions'
import { getClientCases } from '@/actions/case-actions'
import { getConsultationRecordsByClient, getAssessmentNotesByClient } from '@/actions/case-record-actions'
import { getClientIPPAAssessments } from '@/actions/ippa-actions'
import { getGuardiansByClient } from '@/actions/guardian-actions'
import { getNotificationPreference } from '@/actions/notification-preference-actions'
import { listGrantAssessments } from '@/actions/grant-assessment-actions'
import { ApplicationListCard } from '@/eval/components/eval/ApplicationListCard'
import { CaseRecordPanel } from '@/eval/components/eval/CaseRecordPanel'
import { ClientActiveServices } from '@/eval/components/eval/ClientActiveServices'
import { ClientCases } from '@/eval/components/eval/ClientCases'
import { ClientIPPA } from '@/eval/components/eval/ClientIPPA'
import { ClientTimeline } from '@/eval/components/eval/ClientTimeline'
import { PortalUserLink } from '@/eval/components/eval/PortalUserLink'
import { ClientQrLabel } from '@/eval/components/clients/ClientQrLabel'
import { ClientCrmPanel } from '@/eval/components/eval/ClientCrmPanel'
import { ClientGuardiansPanel } from '@/eval/components/clients/ClientGuardiansPanel'
import { ClientNotificationPrefsPanel } from '@/eval/components/clients/ClientNotificationPrefsPanel'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params

  // Resolve client first to get disability_type for similar clients query
  const clientResult = await getClientById(clientId)
  if (!clientResult.success || !clientResult.client) notFound()

  const [appsResult, activeResult, historyResult, casesResult, ippaResult, similarResult, portalUserResult, consultationResult, assessmentResult, tagsResult, guardiansResult, notifPrefResult, grantEvalsResult] = await Promise.all([
    getApplicationsByClientId(clientId),
    getClientActiveServices(clientId),
    getClientHistory(clientId),
    getClientCases(clientId),
    getClientIPPAAssessments(clientId),
    getSimilarClients(clientId, clientResult.client.disability_type ?? null),
    (clientResult.client as any).portal_user_id
      ? getLinkedPortalUserInfo((clientResult.client as any).portal_user_id as string)
      : Promise.resolve({ success: true as const, user: undefined }),
    getConsultationRecordsByClient(clientId),
    getAssessmentNotesByClient(clientId),
    getClientTags(clientId),
    getGuardiansByClient(clientId),
    getNotificationPreference(clientId),
    listGrantAssessments({ clientId }),
  ])

  const client = clientResult.client
  const applications = appsResult.success ? appsResult.applications ?? [] : []
  const activeServices = activeResult.success ? activeResult.services ?? [] : []
  const historyItems = historyResult.success ? historyResult.history ?? [] : []
  const caseItems = casesResult.success ? casesResult.cases ?? [] : []
  const ippaItems = ippaResult.success ? ippaResult.assessments ?? [] : []
  const similarClients = similarResult.success ? similarResult.clients ?? [] : []
  const linkedPortalUser = portalUserResult.success ? portalUserResult.user ?? null : null
  const consultationRecords = consultationResult.success ? consultationResult.records ?? [] : []
  const assessmentNotes = assessmentResult.success ? assessmentResult.notes ?? [] : []
  const clientTags = tagsResult.success ? tagsResult.tags ?? [] : []
  const guardians = guardiansResult.success ? guardiansResult.guardians ?? [] : []
  const notifPref = notifPrefResult.success ? notifPrefResult.pref : undefined
  const grantEvals = grantEvalsResult.success ? grantEvalsResult.assessments ?? [] : []

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      {client.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-orange-50 border border-orange-200">
          <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">미등록 클라이언트</p>
            <p className="text-sm text-orange-700">등록 처리 후 정보 수정 및 서비스 신청이 가능합니다</p>
          </div>
          <Link
            href={`/clients/${clientId}/register`}
            className="px-3 py-1.5 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 whitespace-nowrap"
          >
            등록 처리
          </Link>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="border rounded-lg p-6 mb-6 bg-white">
        <h1 className="text-xl font-bold text-gray-900 mb-4">{client.name}</h1>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">생년월일</dt>
            <dd className="font-medium mt-0.5">{client.birth_date ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">연락처</dt>
            <dd className="font-medium mt-0.5">{client.contact ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">장애유형</dt>
            <dd className="font-medium mt-0.5">{client.disability_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">등록일</dt>
            <dd className="font-medium mt-0.5">
              {client.created_at ? new Date(client.created_at).toLocaleDateString('ko-KR') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* 보호자 · 연락처 */}
      <div className="border rounded-lg p-5 mb-6 bg-white">
        <ClientGuardiansPanel clientId={clientId} initialGuardians={guardians} />
      </div>

      {/* 알림 수신 설정 */}
      <div className="border rounded-lg p-5 mb-6 bg-white">
        <ClientNotificationPrefsPanel clientId={clientId} initialPref={notifPref} />
      </div>

      {/* 생애주기 + 태그 관리 */}
      <div className="mb-6">
        <ClientCrmPanel
          clientId={clientId}
          initialLifecycle={(client as any).lifecycle_status ?? 'active'}
          initialTags={clientTags}
        />
      </div>

      {/* 포털 계정 연결 */}
      <div className="mb-6">
        <PortalUserLink clientId={clientId} linkedUser={linkedPortalUser} />
      </div>

      {/* 대상자 QR 코드 */}
      {(client as any).qr_token && (
        <div className="mb-6">
          <ClientQrLabel
            clientId={clientId}
            qrToken={(client as any).qr_token as string}
            name={client.name}
            birthDate={client.birth_date}
          />
        </div>
      )}

      {/* 진행 중 서비스 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-semibold text-gray-900">진행 중 서비스</h2>
          {activeServices.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              {activeServices.length}
            </span>
          )}
        </div>
        <ClientActiveServices services={activeServices} />
      </div>

      {/* 케이스 관리 */}
      <div className="mb-6">
        <ClientCases initialCases={caseItems} clientId={clientId} />
      </div>

      {/* 상담 및 영역 평가 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">상담 및 영역 평가</h2>
          <Link
            href={`/clients/${clientId}/sessions/new`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 상담 및 평가 시작
          </Link>
        </div>
      </div>

      {/* 상담기록지 · 평가지 */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          상담기록지 · 평가지
          {(consultationRecords.length > 0 || assessmentNotes.length > 0) && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              (상담 {consultationRecords.length}건 · 평가 {assessmentNotes.length}건)
            </span>
          )}
        </h2>
        <CaseRecordPanel
          clientId={clientId}
          initialConsultationRecords={consultationRecords}
          initialAssessmentNotes={assessmentNotes}
        />
      </div>

      {/* K-IPPA 기능적 성과 측정 */}
      <div className="mb-6">
        <ClientIPPA initialAssessments={ippaItems} clientId={clientId} />
      </div>

      {/* 교부사업 평가 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            교부사업 평가
            {grantEvals.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({grantEvals.length}건)</span>
            )}
          </h2>
          <Link
            href={`/grant-eval/new?clientId=${clientId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 평가 시작
          </Link>
        </div>

        {grantEvals.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center border rounded-lg bg-gray-50">
            교부사업 평가 이력이 없습니다
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-white divide-y">
            {grantEvals.map((g) => (
              <Link
                key={g.id}
                href={`/grant-eval/${g.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="shrink-0 text-sm font-semibold text-gray-700 w-14">
                  {g.assessment_year}년
                  {g.assessment_month ? <span className="font-normal text-gray-400 ml-0.5">{g.assessment_month}월</span> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {g.referral_org && (
                      <span className="text-xs text-gray-500">{g.referral_org}</span>
                    )}
                    {(g.item_categories ?? []).map((cat, i) => (
                      <span key={i} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {cat}
                      </span>
                    ))}
                    {g.item_count === 0 && <span className="text-xs text-gray-400">품목 미입력</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {g.final_result ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      g.final_result === '적합' ? 'bg-green-100 text-green-700' :
                      g.final_result === '부적합' ? 'bg-red-100 text-red-700' :
                      g.final_result === '조건부적합' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {g.final_result}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">미결정</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {g.status === 'completed' ? '완료' : g.status === 'submitted' ? '제출됨' : '작성중'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 신청 이력 */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          신청 이력 ({applications.length}건)
        </h2>
        <ApplicationListCard applications={applications} clientId={clientId} />
      </div>

      {/* 전체 이력 타임라인 */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          전체 이력 타임라인
          {historyItems.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({historyItems.length}건)</span>
          )}
        </h2>
        <ClientTimeline items={historyItems} />
      </div>

      {/* 유사 대상자 */}
      {client.disability_type && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            유사 대상자
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({client.disability_type} · 최대 5명)
            </span>
          </h2>
          {similarClients.length === 0 ? (
            <p className="text-sm text-gray-500 px-1">해당 장애유형의 다른 대상자가 없습니다.</p>
          ) : (
            <div className="border rounded-lg divide-y bg-white">
              {similarClients.map((s) => (
                <Link
                  key={s.id}
                  href={`/clients/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.disability_grade ? `${s.disability_grade}급` : s.disability_type}
                        {s.birth_date ? ` · ${s.birth_date}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    서비스 {s.service_record_count}건
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
