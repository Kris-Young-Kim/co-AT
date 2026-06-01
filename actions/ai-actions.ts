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
