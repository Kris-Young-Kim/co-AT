import { getGrantAssessmentById } from '@/actions/grant-assessment-actions'
import { getClientById } from '@/actions/client-actions'
import { getChecklistTemplates, type ChecklistTemplate } from '@/actions/checklist-template-actions'
import { PrintButton } from '@/eval/components/print/PrintButton'
import { HwpDownloadButton } from '@/eval/components/print/HwpDownloadButton'
import { PdfDownloadButton } from '@/eval/components/print/PdfDownloadButton'
import { generateGrantAssessmentHwpx } from '@/eval/actions/grant-assessment-hwp-actions'
import { generateGrantAssessmentPdf } from '@/eval/actions/pdf-actions'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

const SCORE_LABELS = ['환경 적합성', '조작 능력', '장애 특성', '활용 계획', '기대 효과']

export default async function PrintGrantEvalPage({ params }: Props) {
  const { id } = await params

  const result = await getGrantAssessmentById(id)
  if (!result.success || !result.assessment) notFound()

  const assessment = result.assessment
  const clientResult = await getClientById(assessment.client_id)
  const client = clientResult.success ? clientResult.client : null

  const checklistMap: Record<string, ChecklistTemplate[]> = {}
  await Promise.all(
    assessment.items.map(async (item) => {
      const r = await getChecklistTemplates(item.item_category)
      checklistMap[item.item_category] = r.templates ?? []
    })
  )

  const priorRecords = assessment.prior_grant_records ?? []

  return (
    <>
      <div className="fixed top-4 right-4 flex gap-2 no-print z-10">
        <HwpDownloadButton action={generateGrantAssessmentHwpx.bind(null, id)} />
        <PdfDownloadButton action={generateGrantAssessmentPdf.bind(null, id)} />
        <PrintButton />
      </div>
      <div className="max-w-3xl mx-auto p-10 text-sm print:p-4">
        <h1 className="text-xl font-bold text-center mb-2">보조기기 교부사업 적합성 평가 기록지</h1>
        <p className="text-center text-gray-500 mb-8">
          {assessment.assessment_year}년
          {assessment.assessment_month ? ` ${assessment.assessment_month}월` : ''}
        </p>

        {/* 대상자 정보 */}
        <section className="mb-6">
          <h2 className="font-bold border-b pb-1 mb-3">대상자 정보</h2>
          <div className="grid grid-cols-3 gap-2">
            <div><span className="text-gray-500">성명:</span> {client?.name ?? '—'}</div>
            <div><span className="text-gray-500">생년월일:</span> {client?.birth_date ?? '—'}</div>
            <div><span className="text-gray-500">장애유형:</span> {client?.disability_type ?? '—'}</div>
            <div><span className="text-gray-500">의뢰기관:</span> {assessment.referral_org ?? '—'}</div>
            <div><span className="text-gray-500">평가일:</span> {assessment.evaluation_date ?? '—'}</div>
            <div><span className="text-gray-500">평가자:</span> {assessment.evaluator_name ?? '—'}</div>
          </div>
        </section>

        {/* 장애정보 */}
        {(assessment.disability_cause_1 || assessment.disability_cause_2 ||
          assessment.disability_progression || assessment.disability_status_desc) && (
          <section className="mb-6">
            <h2 className="font-bold border-b pb-1 mb-3">□ 장애정보</h2>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="text-gray-500">장애원인 ①:</span>{' '}
                {assessment.disability_cause_1 ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">발생시기 ①:</span>{' '}
                {assessment.disability_onset_1 ?? '—'}
              </div>
              {(assessment.disability_cause_2 || assessment.disability_onset_2) && (
                <>
                  <div>
                    <span className="text-gray-500">장애원인 ②:</span>{' '}
                    {assessment.disability_cause_2 ?? '—'}
                  </div>
                  <div>
                    <span className="text-gray-500">발생시기 ②:</span>{' '}
                    {assessment.disability_onset_2 ?? '—'}
                  </div>
                </>
              )}
            </div>
            {assessment.disability_progression && (
              <div className="mb-2">
                <p className="text-gray-500 mb-0.5">장애진행정도</p>
                <p className="text-gray-700 whitespace-pre-wrap">{assessment.disability_progression}</p>
              </div>
            )}
            {assessment.disability_status_desc && (
              <div>
                <p className="text-gray-500 mb-0.5">장애상태기술</p>
                <p className="text-gray-700 whitespace-pre-wrap">{assessment.disability_status_desc}</p>
              </div>
            )}
          </section>
        )}

        {/* 기교부 실적 */}
        {priorRecords.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold border-b pb-1 mb-3">기교부 실적</h2>
            <table className="w-full text-xs border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-1.5 text-left border-r font-medium text-gray-600 w-16">연도</th>
                  <th className="px-3 py-1.5 text-left border-r font-medium text-gray-600">교부기관</th>
                  <th className="px-3 py-1.5 text-left font-medium text-gray-600">품목명</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {priorRecords.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 border-r">{r.year}</td>
                    <td className="px-3 py-1.5 border-r">{r.agency}</td>
                    <td className="px-3 py-1.5">{r.item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 품목별 */}
        {assessment.items.map((item) => {
          const templates = checklistMap[item.item_category] ?? []
          const scores = [item.score_env, item.score_operation, item.score_disability, item.score_use_plan, item.score_effectiveness]

          return (
            <section key={item.item_order} className="mb-8 border rounded p-4">
              <h2 className="font-bold mb-3">
                품목 {item.item_order} — {item.item_category}
                {item.item_remarks && (
                  <span className="ml-2 text-xs font-normal text-gray-500">({item.item_remarks})</span>
                )}
              </h2>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div><span className="text-gray-500">품목명:</span> {item.item_name ?? '—'}</div>
                <div><span className="text-gray-500">최종 품목명:</span> {item.final_item_name ?? '—'}</div>
                <div><span className="text-gray-500">사용 환경:</span> {item.use_location ?? '—'} {item.use_location_detail}</div>
                <div><span className="text-gray-500">사용 경험:</span> {item.usage_experience === null ? '—' : item.usage_experience ? '있음' : '없음'}</div>
                <div><span className="text-gray-500">자가 사용:</span> {item.self_usage_possible === null ? '—' : item.self_usage_possible ? '가능' : '불가'}</div>
                <div><span className="text-gray-500">자부담:</span> {item.has_self_pay ? '있음' : '없음'}</div>
              </div>

              <div className="mb-3">
                <p className="font-medium text-xs mb-1">활용 계획</p>
                <p className="text-gray-700 text-xs">{item.use_plan ?? '—'}</p>
              </div>

              {/* 점수 */}
              <div className="mb-3">
                <p className="font-medium text-xs mb-2">적정성 평가</p>
                <div className="grid grid-cols-5 gap-1 text-xs text-center">
                  {SCORE_LABELS.map((label, i) => (
                    <div key={i} className="border rounded p-1">
                      <p className="text-gray-500">{label}</p>
                      <p className="font-bold">{scores[i] ?? '—'}</p>
                    </div>
                  ))}
                </div>
                <p className="text-right text-xs font-bold mt-1">합계: {item.total_score ?? 0}점</p>
              </div>

              {/* 체크리스트 */}
              {templates.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-xs mb-1">기본 확인 사항</p>
                  <div className="space-y-1">
                    {templates.map((t) => (
                      <div key={t.question_id} className="flex items-start gap-2 text-xs">
                        <span>{item.checklist_responses?.[t.question_id] ? '☑' : '☐'}</span>
                        <span>{t.question_text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="font-medium text-xs mb-1">품목 의견</p>
                <p className="text-gray-700 text-xs">{item.item_opinion ?? '—'}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-xs border-t pt-2 mt-2">
                <div><span className="text-gray-500">품목 결과:</span> <strong>{item.item_result ?? '—'}</strong></div>
                <div><span className="text-gray-500">추천 모델:</span> {item.recommended_model ?? '—'}</div>
                <div><span className="text-gray-500">지원금액:</span> {item.support_amount ? `${item.support_amount.toLocaleString()}원` : '—'}</div>
                {item.vendor_name && (
                  <div><span className="text-gray-500">공급업체:</span> {item.vendor_name}{item.vendor_phone ? ` (${item.vendor_phone})` : ''}</div>
                )}
              </div>
            </section>
          )
        })}

        {/* 종합 의견 */}
        <section className="mb-6">
          <h2 className="font-bold border-b pb-1 mb-3">종합 의견</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{assessment.general_opinion ?? '—'}</p>
        </section>

        <section>
          <h2 className="font-bold border-b pb-1 mb-2">최종 결과</h2>
          <p className="text-lg font-bold">{assessment.final_result ?? '미결정'}</p>
        </section>

        <div className="mt-10 text-center text-xs text-gray-400 print:mt-6">
          인쇄일: {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>
    </>
  )
}
