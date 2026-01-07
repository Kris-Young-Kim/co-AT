"use server"

import { getGeminiModel } from "@/lib/gemini/client"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { auth } from "@clerk/nextjs/server"

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
    const model = getGeminiModel("gemini-1.5-flash")

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
