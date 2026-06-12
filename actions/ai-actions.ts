"use server"

import { getGeminiModel } from "@/lib/gemini/client"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface IntakeDraftInput {
  memo: string
  applicationId: string // used to query domain_assessments for this consultation session
  clientId: string
}

export interface IntakeDraft {
  consultation_content: string
  main_activity_place: string
  activity_posture: string
  main_supporter: string
  environment_limitations: string
}

/** 상담기록지 5개 필드 AI 초안 생성 System Prompt */
const INTAKE_DRAFT_SYSTEM_PROMPT = `당신은 보조기기센터 전문가입니다. 아래 제공된 메모와 클라이언트 정보를 바탕으로 상담기록지 초안을 JSON 형식으로 생성해주세요.

다음 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "consultation_content": "상담 내용 요약 (3~5문장)",
  "main_activity_place": "주 활동 장소 (예: 자택, 직장)",
  "activity_posture": "주 활동 자세 (예: 앉기, 서기)",
  "main_supporter": "주 부양자 (예: 배우자, 부모)",
  "environment_limitations": "환경적 제한 사항 (예: 엘리베이터 없음)"
}`

/** 직원 메모와 클라이언트 정보를 기반으로 상담기록지 초안 생성 */

export async function generateIntakeDraft(
  input: IntakeDraftInput
): Promise<{ success: boolean; draft?: IntakeDraft; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    if (!input.memo.trim()) return { success: false, error: "메모를 입력해주세요" }

    console.log("[AI Actions] 초안 생성 시작:", { memoLength: input.memo.trim().length })

    const supabase = createAdminClient()

    const [clientResult, assessmentResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, birth_date, disability_type')
        .eq('id', input.clientId)
        .single(),
      supabase
        .from('domain_assessments')
        .select('domain_type, evaluator_opinion')
        .eq('application_id', input.applicationId),
    ])

    if (clientResult.error) console.error("[AI Actions] 클라이언트 조회 오류:", clientResult.error)
    if (assessmentResult.error) console.error("[AI Actions] 평가 조회 오류:", assessmentResult.error)

    // Verify the application belongs to this client
    const { data: appRow } = await supabase
      .from('applications')
      .select('client_id')
      .eq('id', input.applicationId)
      .single()

    if (!appRow || appRow.client_id !== input.clientId) {
      return { success: false, error: '접근 권한이 없습니다' }
    }

    console.log("[AI Actions] 클라이언트 컨텍스트 조회 완료")

    const client = clientResult.data
    const clientContext = client
      ? `이름: ${client.name}, 생년월일: ${client.birth_date ?? '미상'}, 장애유형: ${client.disability_type ?? '미상'}`
      : '클라이언트 정보 없음'

    const assessments = assessmentResult.data ?? []
    const assessmentContext =
      assessments.length > 0
        ? assessments
            .filter((a) => a.evaluator_opinion)
            .map((a) => `${a.domain_type}: ${a.evaluator_opinion}`)
            .join('\n')
        : '평가 정보 없음'

    const model = getGeminiModel("gemini-2.5-flash")
    const prompt = `${INTAKE_DRAFT_SYSTEM_PROMPT}\n\n클라이언트 정보:\n${clientContext}\n\n영역별 평가 의견:\n${assessmentContext}\n\n직원 메모:\n${input.memo}`

    console.log("[AI Actions] Gemini API 호출 중...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    console.log("[AI Actions] Gemini 응답 수신:", { responseLength: generatedText.length })

    let draft: IntakeDraft
    try {
      const cleanedText = generatedText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      draft = JSON.parse(cleanedText) as IntakeDraft

      if (
        !draft.consultation_content ||
        !draft.main_activity_place ||
        !draft.activity_posture ||
        !draft.main_supporter ||
        !draft.environment_limitations
      ) {
        throw new Error("초안 필수 필드가 누락되었습니다")
      }
    } catch (parseError) {
      console.error("[AI Actions] 초안 JSON 파싱 실패:", parseError)
      console.error("[AI Actions] 원본 응답:", generatedText)
      return {
        success: false,
        error: `AI 응답 파싱에 실패했습니다: ${parseError instanceof Error ? parseError.message : "알 수 없는 오류"}`,
      }
    }

    console.log("[AI Actions] 초안 생성 성공")

    return { success: true, draft }
  } catch (error) {
    console.error("[AI Actions] 초안 생성 오류:", error)

    if (error instanceof Error) {
      if (error.message.includes("GOOGLE_AI_API_KEY")) {
        return { success: false, error: "Google AI API 키가 설정되지 않았습니다" }
      }

      if (error.message.includes("API_KEY")) {
        return { success: false, error: "Google AI API 키가 유효하지 않습니다" }
      }

      return { success: false, error: `AI 생성 중 오류가 발생했습니다: ${error.message}` }
    }

    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

export interface CallLogAnswerInput {
  questionContent: string
  requesterType?: string | null
  disabilityType?: string | null
  activeQuestionTypes: string[]
}

const CALL_LOG_ANSWER_PROMPT = `당신은 강원특별자치도 보조기기센터의 전문 상담사입니다.
상담 내용을 바탕으로 적절한 답변(조치사항)을 작성해 주세요.

답변 작성 규칙:
- 2~4문장의 간결한 텍스트만 반환 (JSON 불필요)
- 구체적인 안내 사항, 다음 단계, 관련 서비스 등을 포함
- 전문적이고 친절한 어투 사용
- 보조기기 관련 전문 용어는 한국어로 작성`

export async function generateCallLogAnswer(
  input: CallLogAnswerInput
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: "권한이 없습니다" }

    const { userId } = await auth()
    if (!userId) return { success: false, error: "로그인이 필요합니다" }

    if (!input.questionContent.trim())
      return { success: false, error: "질문 내용을 먼저 입력해 주세요" }

    const contextLines = [
      input.activeQuestionTypes.length > 0 && `질문 유형: ${input.activeQuestionTypes.join(", ")}`,
      input.requesterType && `의뢰인 유형: ${input.requesterType}`,
      input.disabilityType && `장애유형: ${input.disabilityType}`,
    ].filter(Boolean).join("\n")

    const model = getGeminiModel("gemini-2.5-flash")
    const prompt = `${CALL_LOG_ANSWER_PROMPT}

${contextLines}

질문 내용:
${input.questionContent}`

    const result = await model.generateContent(prompt)
    const answer = result.response.text().trim()

    if (!answer) throw new Error("빈 응답")

    return { success: true, answer }
  } catch (error) {
    console.error("[AI Actions] 콜로그 답변 생성 오류:", error)
    return { success: false, error: "AI 답변 생성 중 오류가 발생했습니다" }
  }
}

export interface ServiceRecordDraftInput {
  applicationId: string
  clientId: string
  memo?: string
}

export interface ServiceRecordDraft {
  service_content: string
  service_major_category: string
  service_sub_category: string
  service_category: string
  service_area: string
  product_name: string
  referral_type: string
  is_consult: boolean
  is_assessment: boolean
  is_trial: boolean
  is_rental: boolean
  is_custom_make: boolean
  is_grant: boolean
  is_education: boolean
  is_info_provision: boolean
  is_repair: boolean
}

const SERVICE_RECORD_DRAFT_PROMPT = `당신은 보조기기센터 전문가입니다. 클라이언트 정보와 상담 내역을 바탕으로 서비스 기록 초안을 JSON 형식으로 생성해주세요.

다음 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "service_content": "서비스 내용 서술 (3~5문장, 구체적으로)",
  "service_major_category": "공적급여 | 민간지원 | 기타 | 서비스지원 중 하나",
  "service_sub_category": "소분류 (예: 건강보험 급여, 복지용구 등)",
  "service_category": "서비스구분 (예: 상담, 평가, 교부 등)",
  "service_area": "WC | ADL | S | SP | EC | CA | L | AAC | AM 중 하나, 해당없으면 빈 문자열",
  "product_name": "신청 품목명",
  "referral_type": "내방 | 유선 | 인터넷신청 | 기관연계 | 기타 중 하나",
  "is_consult": true/false,
  "is_assessment": true/false,
  "is_trial": true/false,
  "is_rental": true/false,
  "is_custom_make": true/false,
  "is_grant": true/false,
  "is_education": true/false,
  "is_info_provision": true/false,
  "is_repair": true/false
}`

export async function generateServiceRecordDraft(
  input: ServiceRecordDraftInput
): Promise<{ success: boolean; draft?: ServiceRecordDraft; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) return { success: false, error: '권한이 없습니다' }

    const { userId } = await auth()
    if (!userId) return { success: false, error: '로그인이 필요합니다' }

    const supabase = createAdminClient()

    const { data: appRow } = await supabase
      .from('applications')
      .select('client_id, category, sub_category, status')
      .eq('id', input.applicationId)
      .single()

    if (!appRow || appRow.client_id !== input.clientId) {
      return { success: false, error: '접근 권한이 없습니다' }
    }

    const [clientResult, intakeResult, assessmentResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, birth_date, disability_type, disability_grade, economic_status, address')
        .eq('id', input.clientId)
        .single(),
      supabase
        .from('intake_records')
        .select('consultation_content, main_activity_place, environment_limitations')
        .eq('application_id', input.applicationId)
        .order('consult_date', { ascending: false })
        .limit(1),
      supabase
        .from('domain_assessments')
        .select('domain_type, evaluator_opinion')
        .eq('application_id', input.applicationId)
        .not('evaluator_opinion', 'is', null),
    ])

    const client = clientResult.data
    const latestIntake = (intakeResult.data ?? [])[0]
    const assessments = assessmentResult.data ?? []

    const clientCtx = client
      ? `이름: ${client.name}, 생년월일: ${client.birth_date ?? '미상'}, 장애유형: ${client.disability_type ?? '미상'}, 장애등급: ${client.disability_grade ?? '미상'}, 경제상황: ${client.economic_status ?? '미상'}, 주소: ${client.address ?? '미상'}`
      : '클라이언트 정보 없음'

    const appCtx = `사업분류: ${appRow.category ?? '미상'}, 서비스분류: ${appRow.sub_category ?? '미상'}, 상태: ${appRow.status ?? '미상'}`

    const intakeCtx = latestIntake
      ? `상담내용: ${latestIntake.consultation_content ?? '없음'}, 주활동장소: ${latestIntake.main_activity_place ?? '없음'}, 환경제한: ${latestIntake.environment_limitations ?? '없음'}`
      : '상담기록지 없음'

    const assessmentCtx = assessments.length > 0
      ? assessments
          .filter((a) => a.evaluator_opinion)
          .map((a) => `${a.domain_type}: ${a.evaluator_opinion}`)
          .join('\n')
      : '평가 정보 없음'

    const memoCtx = input.memo?.trim() ? `\n추가 메모:\n${input.memo.trim()}` : ''

    const model = getGeminiModel('gemini-2.5-flash')
    const prompt = `${SERVICE_RECORD_DRAFT_PROMPT}\n\n클라이언트 정보:\n${clientCtx}\n\n신청서 정보:\n${appCtx}\n\n상담기록지:\n${intakeCtx}\n\n영역별 평가:\n${assessmentCtx}${memoCtx}`

    const result = await model.generateContent(prompt)
    const generatedText = result.response.text()

    const cleanedText = generatedText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    const draft = JSON.parse(cleanedText) as ServiceRecordDraft

    if (!draft.service_content) throw new Error('service_content 누락')

    return { success: true, draft }
  } catch (error) {
    console.error('[AI Actions] 서비스 기록 초안 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `AI 생성 오류: ${error.message}` : '예상치 못한 오류가 발생했습니다',
    }
  }
}

// ────────────────────────────────────────────
// E-5: 세션 대화록 AI 요약
// ────────────────────────────────────────────

export interface TranscriptKeyPoints {
  chief_complaint?: string
  requested_device?: string
  agreed_action?: string
  next_step?: string
}

const TRANSCRIPT_SUMMARY_PROMPT = `당신은 보조공학센터 전문 기록사입니다.
아래 상담 대화 내용에서 핵심 정보를 JSON으로 추출해주세요.
다른 설명 없이 JSON만 반환하세요:
{
  "chief_complaint": "주요 호소 내용 (1~2문장)",
  "requested_device": "요청 보조기기명 (없으면 빈 문자열)",
  "agreed_action": "합의된 조치 사항",
  "next_step": "다음 단계 또는 팔로업"
}`

export async function summarizeTranscript(
  transcript: string
): Promise<{ success: boolean; keyPoints?: TranscriptKeyPoints; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()
  if (!userId) return { success: false, error: '로그인이 필요합니다' }

  if (!transcript.trim()) return { success: false, error: '대화 내용이 없습니다' }

  try {
    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent(
      `${TRANSCRIPT_SUMMARY_PROMPT}\n\n대화 내용:\n${transcript}`
    )
    const raw = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const keyPoints = JSON.parse(raw) as TranscriptKeyPoints
    return { success: true, keyPoints }
  } catch (error) {
    console.error('[AI Actions] 대화록 요약 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `AI 요약 오류: ${error.message}` : 'AI 요약 중 오류가 발생했습니다',
    }
  }
}

export interface CallLogDraftFromTranscriptInput {
  transcript: string
  sessionDate: string
  clientName?: string | null
  disabilityType?: string | null
}

export interface CallLogDraftFromTranscript {
  question_content: string
  answer: string
  requester_type: string
  q_public_benefit: boolean
  q_private_benefit: boolean
  q_device: boolean
  q_case_management: boolean
  q_other: boolean
}

const CALL_LOG_FROM_TRANSCRIPT_PROMPT = `당신은 보조공학센터 전문 기록사입니다.
상담 대화 내용을 바탕으로 콜센터 상담일지를 JSON으로 작성해주세요.
다른 설명 없이 JSON만 반환하세요:
{
  "question_content": "질문 내용 요약 (2~4문장)",
  "answer": "답변 및 조치 내용 (2~4문장)",
  "requester_type": "장애 당사자 | 보호자 및 지인 | 유관기관 종사자 | 시군구(및 읍면동) 담당자 | 교육기관 종사자 | 기타 중 하나",
  "q_public_benefit": true/false,
  "q_private_benefit": true/false,
  "q_device": true/false,
  "q_case_management": true/false,
  "q_other": true/false
}`

export async function generateCallLogDraftFromTranscript(
  input: CallLogDraftFromTranscriptInput
): Promise<{ success: boolean; draft?: CallLogDraftFromTranscript; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const { userId } = await auth()
  if (!userId) return { success: false, error: '로그인이 필요합니다' }

  if (!input.transcript.trim()) return { success: false, error: '대화 내용이 없습니다' }

  try {
    const contextLines = [
      input.clientName && `대상자: ${input.clientName}`,
      input.disabilityType && `장애유형: ${input.disabilityType}`,
      `상담일: ${input.sessionDate}`,
    ].filter(Boolean).join('\n')

    const model = getGeminiModel('gemini-2.5-flash')
    const prompt = `${CALL_LOG_FROM_TRANSCRIPT_PROMPT}\n\n${contextLines}\n\n대화 내용:\n${input.transcript}`
    const result = await model.generateContent(prompt)
    const raw = result.response.text()
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    const draft = JSON.parse(raw) as CallLogDraftFromTranscript
    if (!draft.question_content) throw new Error('question_content 누락')
    draft.q_public_benefit = Boolean(draft.q_public_benefit)
    draft.q_private_benefit = Boolean(draft.q_private_benefit)
    draft.q_device = Boolean(draft.q_device)
    draft.q_case_management = Boolean(draft.q_case_management)
    draft.q_other = Boolean(draft.q_other)
    return { success: true, draft }
  } catch (error) {
    console.error('[AI Actions] 콜로그 초안 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `AI 콜로그 초안 생성 오류: ${error.message}` : 'AI 콜로그 초안 생성 중 오류가 발생했습니다',
    }
  }
}

// ────────────────────────────────────────────
// E-5: 대상자 종합 평가 보고서 초안
// ────────────────────────────────────────────

const EVALUATION_REPORT_PROMPT = `당신은 강원특별자치도 보조공학기기 지원센터의 전문 평가사입니다.
아래 대상자 정보를 바탕으로 종합 평가 보고서 초안을 작성해 주세요.

형식 (마크다운):
## 종합 평가 보고서

**대상자**: [이름] | **평가일**: [날짜]

### 1. 대상자 개요
[장애유형, 주요 생활 상황 2~3문장]

### 2. 서비스 지원 이력
[최근 주요 서비스 지원 요약]

### 3. 기능 성과 측정 (K-IPPA)
[K-IPPA 결과 해석 및 주요 개선 영역]

### 4. 영역별 평가 결과
[9개 영역 평가 의견 요약]

### 5. 종합 의견 및 권고사항
[종합 평가 의견 3~5문장, 향후 지원 방향 포함]

마크다운 형식으로만 작성하세요. 정보가 없는 섹션은 "데이터 없음"으로 표기하세요.`

export async function generateEvaluationReport(
  clientId: string
): Promise<{ success: boolean; report?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  try {
    const supabase = createAdminClient()

    const [clientResult, ippaResult, serviceResult, assessmentResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, birth_date, gender, disability_type, disability_grade, economic_status, address')
        .eq('id', clientId)
        .single(),
      (supabase as any)
        .from('eval_ippa_assessments')
        .select('assessment_year, pre_date, post_date, items, outcome_score, status')
        .eq('client_id', clientId)
        .order('assessment_year', { ascending: false })
        .limit(3),
      (supabase as any)
        .from('eval_service_records')
        .select('received_at, service_major_category, service_category, product_name, satisfaction_score, record_status')
        .eq('client_id', clientId)
        .order('received_at', { ascending: false, nullsFirst: false })
        .limit(5),
      (supabase as any)
        .from('domain_assessments')
        .select('domain_type, evaluator_opinion, score')
        .eq('client_id', clientId)
        .not('evaluator_opinion', 'is', null)
        .order('created_at', { ascending: false })
        .limit(9),
    ])

    const client = clientResult.data
    if (!client) return { success: false, error: '대상자를 찾을 수 없습니다' }

    const today = new Date().toLocaleDateString('ko-KR')

    const clientCtx = `이름: ${client.name}
생년월일: ${client.birth_date ?? '미상'} | 성별: ${client.gender ?? '미상'}
장애유형: ${client.disability_type ?? '미상'} | 장애정도: ${client.disability_grade ?? '미상'}
경제상황: ${client.economic_status ?? '미상'}`

    const ippaRows = (ippaResult.data ?? []) as Array<{
      assessment_year: number; pre_date: string | null; post_date: string | null
      items: Array<{ problem: string; pre_score: number; post_score: number | null }>
      outcome_score: number | null; status: string
    }>
    const ippaCtx = ippaRows.length === 0
      ? '측정 이력 없음'
      : ippaRows.map(r => {
          const outcome = r.outcome_score != null ? `성과점수: ${r.outcome_score > 0 ? '+' : ''}${r.outcome_score}` : '사후 미측정'
          const items = r.items.map(it => `${it.problem}(전:${it.pre_score}→후:${it.post_score ?? '미측정'})`).join(', ')
          return `${r.assessment_year}년 [${outcome}] ${items}`
        }).join('\n')

    const serviceRows = (serviceResult.data ?? []) as Array<{
      received_at: string | null; service_major_category: string | null
      service_category: string | null; product_name: string | null
      satisfaction_score: number | null; record_status: string | null
    }>
    const serviceCtx = serviceRows.length === 0
      ? '서비스 이력 없음'
      : serviceRows.map(r =>
          `[${r.received_at?.slice(0, 7) ?? '?'}] ${r.service_major_category ?? ''} > ${r.service_category ?? ''} ${r.product_name ? '(' + r.product_name + ')' : ''} 만족도:${r.satisfaction_score ?? '미기록'}`
        ).join('\n')

    const domainRows = (assessmentResult.data ?? []) as Array<{
      domain_type: string; evaluator_opinion: string | null; score: number | null
    }>
    const domainCtx = domainRows.length === 0
      ? '영역 평가 없음'
      : domainRows.map(r => `[${r.domain_type}] ${r.score != null ? r.score + '점' : ''} ${r.evaluator_opinion ?? ''}`).join('\n')

    const prompt = `${EVALUATION_REPORT_PROMPT}

평가일: ${today}
대상자 정보:
${clientCtx}

서비스 지원 이력 (최근 5건):
${serviceCtx}

K-IPPA 기능 성과 측정:
${ippaCtx}

영역별 평가:
${domainCtx}`

    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent(prompt)
    const report = result.response.text().trim()

    if (!report) throw new Error('빈 응답')
    return { success: true, report }
  } catch (error) {
    console.error('[AI Actions] 평가 보고서 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `보고서 생성 오류: ${error.message}` : '예상치 못한 오류가 발생했습니다',
    }
  }
}

// ────────────────────────────────────────────
// E-5: 서비스 완료 노트 자동 생성
// ────────────────────────────────────────────

export interface CompletionNoteInput {
  clientId: string
  serviceCategory: string | null
  productName: string | null
  serviceTypes: string[]
  existingContent: string | null
  satisfactionScore: number | null
}

const COMPLETION_NOTE_PROMPT = `당신은 보조공학센터 전문 기록사입니다.
아래 서비스 기록이 완료 처리됩니다. 2~4문장의 완료 노트를 작성해주세요.

작성 기준:
- 제공된 서비스 내용을 간략히 요약
- 서비스 결과 및 대상자 상태 언급
- 후속 조치 또는 모니터링 계획 포함
- 전문적이고 간결한 어투 사용
- 텍스트만 반환 (JSON·마크다운·따옴표 없음)`

export async function generateCompletionNote(
  input: CompletionNoteInput
): Promise<{ success: boolean; note?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  try {
    const supabase = createAdminClient()
    const { data: client } = await supabase
      .from('clients')
      .select('name, disability_type')
      .eq('id', input.clientId)
      .single()

    const clientCtx = client
      ? `대상자: ${client.name}, 장애유형: ${client.disability_type ?? '미상'}`
      : ''

    const serviceCtx = [
      input.serviceCategory && `서비스구분: ${input.serviceCategory}`,
      input.productName && `기기/품목: ${input.productName}`,
      input.serviceTypes.length > 0 && `서비스유형: ${input.serviceTypes.join(', ')}`,
      input.existingContent && `기존 내용: ${input.existingContent}`,
      input.satisfactionScore != null && `만족도: ${input.satisfactionScore}점`,
    ].filter(Boolean).join('\n')

    const model = getGeminiModel('gemini-2.5-flash')
    const result = await model.generateContent(
      `${COMPLETION_NOTE_PROMPT}\n\n${clientCtx}\n${serviceCtx}`
    )
    const note = result.response.text().trim()
    if (!note) throw new Error('빈 응답')
    return { success: true, note }
  } catch (error) {
    console.error('[AI Actions] 완료 노트 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `완료 노트 생성 오류: ${error.message}` : '예상치 못한 오류가 발생했습니다',
    }
  }
}

// ────────────────────────────────────────────
// E-5: 보조기기 추천
// ────────────────────────────────────────────

const DEVICE_RECOMMENDATION_PROMPT = `당신은 보조공학 전문가입니다.
아래 대상자 정보와 기관 지원 실적 데이터를 바탕으로 최적 보조기기 3~5종을 마크다운으로 추천해 주세요.

형식:
## 보조기기 추천

### 1. [기기명]
**추천 이유**: (장애유형·활동 문제와의 연관성 2~3문장)
**기관 실적**: (지원 건수·평균 만족도 — 데이터가 없으면 "실적 없음")
**주의사항**: (적용 시 고려할 점 1~2문장)

위 형식으로 3~5개 기기를 작성하세요. 정보가 부족하면 전문가 판단 근거를 명시하세요.`

export async function generateDeviceRecommendations(
  clientId: string
): Promise<{ success: boolean; recommendations?: string; error?: string }> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  try {
    const supabase = createAdminClient()

    const [clientResult, ippaResult, recordResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, disability_type, disability_grade, birth_date')
        .eq('id', clientId)
        .single(),
      (supabase as any)
        .from('eval_ippa_assessments')
        .select('items, outcome_score, status')
        .eq('client_id', clientId)
        .order('assessment_year', { ascending: false })
        .limit(1),
      (supabase as any)
        .from('eval_service_records')
        .select('product_name, disability_type, satisfaction_score')
        .not('product_name', 'is', null)
        .not('product_name', 'eq', '')
        .limit(200),
    ])

    const client = clientResult.data
    if (!client) return { success: false, error: '대상자를 찾을 수 없습니다' }

    const clientCtx = `장애유형: ${client.disability_type ?? '미상'} | 장애정도: ${client.disability_grade ?? '미상'}`

    const ippaRows = (ippaResult.data ?? []) as Array<{
      items: Array<{ problem: string; pre_score: number; post_score: number | null }>
    }>
    const problemAreas = ippaRows.length > 0 && Array.isArray(ippaRows[0]?.items) && ippaRows[0].items.length > 0
      ? ippaRows[0].items.map(it => `${it.problem} (어려움 ${it.pre_score}점)`).join(', ')
      : '측정 이력 없음'

    const allRecords = (recordResult.data ?? []) as Array<{
      product_name: string; disability_type: string | null; satisfaction_score: number | null
    }>
    const matching = client.disability_type
      ? allRecords.filter(r => (r.disability_type ?? '').includes(client.disability_type ?? ''))
      : allRecords

    const grouped: Record<string, { count: number; satisfactions: number[] }> = {}
    matching.forEach(r => {
      if (!grouped[r.product_name]) grouped[r.product_name] = { count: 0, satisfactions: [] }
      grouped[r.product_name].count++
      if (r.satisfaction_score != null) grouped[r.product_name].satisfactions.push(r.satisfaction_score)
    })

    const knowledgeCtx = Object.entries(grouped)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, { count, satisfactions }]) => {
        const avg = satisfactions.length > 0
          ? (satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length).toFixed(1)
          : null
        return `${name}: ${count}건${avg ? `, 만족도 ${avg}점` : ''}`
      })
      .join('\n')

    const model = getGeminiModel('gemini-2.5-flash')
    const prompt = `${DEVICE_RECOMMENDATION_PROMPT}\n\n대상자 정보:\n${clientCtx}\n\nK-IPPA 활동 문제 영역:\n${problemAreas}\n\n기관 실적 (동일 장애유형 상위 10개):\n${knowledgeCtx || '데이터 없음'}`

    const result = await model.generateContent(prompt)
    const recommendations = result.response.text().trim()
    if (!recommendations) throw new Error('빈 응답')
    return { success: true, recommendations }
  } catch (error) {
    console.error('[AI Actions] 보조기기 추천 생성 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? `추천 생성 오류: ${error.message}` : '예상치 못한 오류가 발생했습니다',
    }
  }
}
