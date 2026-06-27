import { getConsultationRecordById } from '@/actions/case-record-actions'
import { getDomainAssessmentsByConsultationRecord } from '@/actions/assessment-actions'
import type { ConsultDomainAssessment } from '@/actions/assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ consultRecordId: string }>
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

export default async function PrintSessionPage({ params }: Props) {
  const { consultRecordId } = await params

  const [consultResult, assessmentsResult] = await Promise.all([
    getConsultationRecordById(consultRecordId),
    getDomainAssessmentsByConsultationRecord(consultRecordId),
  ])

  if (!consultResult.success || !consultResult.record) notFound()

  const consult = consultResult.record
  const clientResult = await getClientById(consult.client_id)
  if (!clientResult.success || !clientResult.client) notFound()

  const client = clientResult.client
  const domainItems: ConsultDomainAssessment[] = assessmentsResult.success
    ? (assessmentsResult.assessments ?? [])
    : []

  return (
    <div className="p-8 max-w-4xl mx-auto text-sm print:p-4">
      {/* Print button — hidden in actual print */}
      <div className="print:hidden mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          인쇄
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50"
        >
          돌아가기
        </button>
      </div>

      {/* ── Document header ── */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-900">
        <h1 className="text-lg font-bold">보조기기 적합성 평가 기록지</h1>
        <p className="text-xs text-gray-500 mt-1">강원도재활공학서비스연구지원센터</p>
      </div>

      {/* ── Client info ── */}
      <table className="w-full border-collapse border border-gray-400 mb-6 text-xs">
        <tbody>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold w-24">성명</th>
            <td className="border border-gray-400 px-3 py-1.5">{client.name}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold w-24">생년월일</th>
            <td className="border border-gray-400 px-3 py-1.5">{client.birth_date ?? '—'}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold">장애유형</th>
            <td className="border border-gray-400 px-3 py-1.5">{client.disability_type ?? '—'}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold">연락처</th>
            <td className="border border-gray-400 px-3 py-1.5">{client.contact ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Consultation record ── */}
      <div className="mb-6">
        <h2 className="font-bold text-sm mb-2 border-b pb-1">□ 상담기록지</h2>
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <tbody>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold w-24">상담일</th>
              <td className="border border-gray-400 px-3 py-1.5">{consult.consultation_date}</td>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold w-24">상담유형</th>
              <td className="border border-gray-400 px-3 py-1.5">{consult.consultation_type}</td>
            </tr>
            {consult.consultant && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold">상담사</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5">{consult.consultant}</td>
              </tr>
            )}
            {consult.purpose && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">상담 목적</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">{consult.purpose}</td>
              </tr>
            )}
            {consult.current_situation && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">현재 상황</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">{consult.current_situation}</td>
              </tr>
            )}
            {consult.content && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">상담 내용</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">{consult.content}</td>
              </tr>
            )}
            {consult.result && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">상담 결과</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">{consult.result}</td>
              </tr>
            )}
            {consult.next_plan && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">다음 계획</th>
                <td colSpan={3} className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">{consult.next_plan}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Domain assessments ── */}
      {domainItems.length > 0 && (
        <div>
          <h2 className="font-bold text-sm mb-3 border-b pb-1">□ 영역별 평가 결과</h2>
          <div className="space-y-5">
            {domainItems.map((item, idx) => {
              const evalEntries = item.evaluation_data
                ? Object.entries(item.evaluation_data).filter(([, v]) =>
                    v !== null && v !== undefined && v !== '' &&
                    !(Array.isArray(v) && (v as unknown[]).length === 0)
                  )
                : []

              return (
                <div key={item.id} className="break-inside-avoid">
                  <h3 className="font-semibold text-xs mb-1.5">
                    {idx + 1}. ({item.domain_type}) {DOMAIN_LABELS[item.domain_type] ?? item.domain_type} — {item.evaluation_date}
                  </h3>
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      {evalEntries.map(([key, value]) => (
                        <tr key={key}>
                          <th className="border border-gray-400 bg-gray-50 px-3 py-1 text-left font-medium w-36 align-top text-gray-600">
                            {key.replace(/_/g, ' ')}
                          </th>
                          <td className="border border-gray-400 px-3 py-1 whitespace-pre-wrap">
                            {Array.isArray(value)
                              ? (value as string[]).join(', ')
                              : typeof value === 'boolean'
                              ? (value ? '예' : '아니오')
                              : String(value)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold w-36 align-top">평가자 의견</th>
                        <td className="border border-gray-400 px-3 py-1.5 whitespace-pre-wrap">
                          {item.evaluator_opinion ?? ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">추천 보조기기</th>
                        <td className="border border-gray-400 px-3 py-1.5">
                          {item.recommended_device ?? ''}
                        </td>
                      </tr>
                      <tr>
                        <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-semibold align-top">향후 계획</th>
                        <td className="border border-gray-400 px-3 py-1.5">
                          {item.future_plan ?? ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className="mt-8 flex justify-end gap-12 text-xs">
        <div className="text-center">
          <p className="mb-6">평가사</p>
          <p className="border-t border-gray-400 pt-1 w-24 text-center">(서명)</p>
        </div>
        <div className="text-center">
          <p className="mb-6">확인자</p>
          <p className="border-t border-gray-400 pt-1 w-24 text-center">(서명)</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { font-size: 11px; }
        }
      `}</style>
    </div>
  )
}
