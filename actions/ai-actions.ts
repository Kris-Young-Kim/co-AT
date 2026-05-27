"use server"

import { getGeminiModel } from "@/lib/gemini/client"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface SoapNote {
  subjective: string // 주관적 정보 (S)
  objective: string // 객관적 정보 (O)
  assessment: string // 평가 (A)
  plan: string // 계획 (P)
}

/**
 * SOAP 노트 생성 System Prompt
 */
const SOAP_SYSTEM_PROMPT = `당신은 보조기기센터의 전문가입니다. 상담 내용을 바탕으로 SOAP 노트 형식의 구조화된 기록을 생성해주세요.

SOAP 노트는 다음 4가지 섹션으로 구성됩니다:
- S (Subjective): 내담자가 말한 주관적 정보, 불편사항, 요구사항
- O (Objective): 관찰 가능한 객관적 정보, 신체 기능, 환경
- A (Assessment): 전문가의 평가 및 분석
- P (Plan): 향후 계획 및 조치사항

다음 JSON 형식으로 응답해주세요:
{
  "subjective": "내담자의 주관적 정보",
  "objective": "관찰된 객관적 정보",
  "assessment": "전문가 평가",
  "plan": "향후 계획"
}

응답은 반드시 유효한 JSON 형식이어야 하며, 다른 설명 없이 JSON만 반환해주세요.`

/**
 * 텍스트를 SOAP 노트 형식으로 변환
 */
export async function generateSoapNote(
  text: string
): Promise<{
  success: boolean
  soapNote?: SoapNote
  error?: string
}> {
  try {
    console.log("[AI Actions] SOAP 노트 생성 시작:", { textLength: text.length })

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      console.error("[AI Actions] 권한 없음")
      return { success: false, error: "권한이 없습니다" }
    }

    // 인증 확인
    const { userId } = await auth()
    if (!userId) {
      console.error("[AI Actions] 로그인 필요")
      return { success: false, error: "로그인이 필요합니다" }
    }

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return { success: false, error: "입력 텍스트가 비어있습니다" }
    }

    // Gemini 모델 가져오기
    const model = getGeminiModel("gemini-2.0-flash-lite")

    // 프롬프트 구성
    const prompt = `${SOAP_SYSTEM_PROMPT}\n\n상담 내용:\n${text}`

    console.log("[AI Actions] Gemini API 호출 중...")

    // AI 생성 요청
    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    console.log("[AI Actions] Gemini 응답 수신:", { responseLength: generatedText.length })

    // JSON 파싱 시도
    let soapNote: SoapNote
    try {
      // JSON 코드 블록 제거 (```json ... ``` 형식 처리)
      const cleanedText = generatedText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim()

      soapNote = JSON.parse(cleanedText) as SoapNote

      // 필수 필드 검증
      if (
        !soapNote.subjective ||
        !soapNote.objective ||
        !soapNote.assessment ||
        !soapNote.plan
      ) {
        throw new Error("SOAP 노트 필수 필드가 누락되었습니다")
      }
    } catch (parseError) {
      console.error("[AI Actions] JSON 파싱 실패:", parseError)
      console.error("[AI Actions] 원본 응답:", generatedText)
      return {
        success: false,
        error: `AI 응답 파싱에 실패했습니다: ${parseError instanceof Error ? parseError.message : "알 수 없는 오류"}`,
      }
    }

    console.log("[AI Actions] SOAP 노트 생성 성공")

    return { success: true, soapNote }
  } catch (error) {
    console.error("[AI Actions] SOAP 노트 생성 중 오류:", error)

    // 에러 타입별 처리
    if (error instanceof Error) {
      if (error.message.includes("GOOGLE_AI_API_KEY")) {
        return {
          success: false,
          error: "Google AI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.",
        }
      }

      if (error.message.includes("API_KEY")) {
        return {
          success: false,
          error: "Google AI API 키가 유효하지 않습니다.",
        }
      }

      return {
        success: false,
        error: `AI 생성 중 오류가 발생했습니다: ${error.message}`,
      }
    }

    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    }
  }
}

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

    const model = getGeminiModel("gemini-2.0-flash-lite")
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

    const model = getGeminiModel("gemini-2.0-flash-lite")
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
