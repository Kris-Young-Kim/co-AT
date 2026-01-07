import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * Gemini API 클라이언트 초기화
 */
export function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY

  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY 환경 변수가 설정되지 않았습니다")
  }

  return new GoogleGenerativeAI(apiKey)
}

/**
 * Gemini 모델 가져오기
 */
export function getGeminiModel(modelName: string = "gemini-1.5-flash") {
  const client = getGeminiClient()
  return client.getGenerativeModel({ model: modelName })
}
