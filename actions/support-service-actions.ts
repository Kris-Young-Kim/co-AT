"use server"

import { getGeminiClient } from "@/lib/gemini/client"

/**
 * 지원사업 정보 챗봇 - Public Zone용 (인증 불필요)
 * Google Gemini API를 활용하여 보조기기센터 지원사업에 대한 질의응답 제공
 */
const SUPPORT_SERVICE_SYSTEM_PROMPT = `당신은 강원특별자치도 보조기기센터(GWATC)의 지원사업 안내 전문가입니다.
이용자에게 보조기기센터의 5대 핵심 지원사업에 대해 친절하고 정확하게 안내해주세요.

## 5대 핵심 지원사업

### 1. 상담 및 정보제공
- 초기 상담: 접수 → 욕구파악/평가
- 콜센터(1670-5529): 단순 정보제공 및 타 기관 연계
- 체험지원: 전시장 내 기기 직접 체험, 견학 프로그램 운영

### 2. 맞춤형 지원
- **대여**: 단기/장기 대여, 1인 연간 3종 이하, 최대 1년(연장 1~2회 가능)
- **맞춤 제작**: 기성품 사용 불가 시 개조/제작, 지원금 1인 10만원 기준(재료비)
- **교부평가**: 지자체 의뢰 → 상담/평가 → 적합 기기 추천

### 3. 사후관리
- 소독 및 세척: 위생 관리
- 점검 및 수리: 지원금 1인 연간 10만원 기준
- 재사용 지원: 유휴 기기 기증/수거 → 세척/수리 → 재보급(대여/지급)

### 4. 교육/홍보
- 종사자·공무원·전문가·사용자 교육
- 온/오프라인 홍보, 보조기기 인식 개선 캠페인

### 5. 지역사회연계
- 지역 기관과 협력하여 통합적 서비스 제공

## 대상자
- 장애인복지법상 장애인
- 노인장기요양보험법상 노인
- 국가유공자 등

## 답변 원칙
1. 위 정보를 바탕으로 정확하고 친절하게 답변하세요.
2. 구체적인 수치(한도, 기간 등)가 있으면 명확히 전달하세요.
3. 질문 범위를 벗어나면 "해당 내용은 센터에 직접 문의(콜센터 1670-5529)해 주시기 바랍니다"라고 안내하세요.
4. 한국어로 자연스럽고 이해하기 쉽게 답변하세요.
5. 서비스 신청은 홈페이지의 '서비스 신청' 메뉴를 안내하세요.`

export interface SupportServiceAnswer {
  answer: string
}

export async function generateSupportServiceAnswer(
  query: string
): Promise<{
  success: boolean
  answer?: SupportServiceAnswer
  error?: string
}> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error:
          "Google AI API 키가 설정되지 않았습니다. 서비스가 일시적으로 이용 불가합니다.",
      }
    }

    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `${SUPPORT_SERVICE_SYSTEM_PROMPT}

---
질문: ${query}

답변:`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const answerText = response.text()

    if (!answerText?.trim()) {
      return {
        success: false,
        error: "답변 생성에 실패했습니다. 다시 시도해 주세요.",
      }
    }

    return {
      success: true,
      answer: { answer: answerText.trim() },
    }
  } catch (error) {
    console.error("[Support Service Chatbot] 답변 생성 실패:", error)

    if (error instanceof Error) {
      if (
        error.message.includes("API key not valid") ||
        error.message.includes("API_KEY_INVALID")
      ) {
        return {
          success: false,
          error: "AI 서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해 주세요.",
        }
      }
      if (error.message.includes("환경 변수가 설정되지 않았습니다")) {
        return {
          success: false,
          error: "AI 서비스가 일시적으로 이용 불가합니다.",
        }
      }
      return {
        success: false,
        error: "답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      }
    }

    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다.",
    }
  }
}
