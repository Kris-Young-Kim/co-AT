import { auth } from "@clerk/nextjs/server"
import { getGeminiModel } from "@/lib/gemini/client"
import { NextResponse } from "next/server"

export interface ExtractedGrantFields {
  referral_org?: string | null
  general_opinion?: string | null
  prior_grant_records?: Array<{ year: number; agency: string; item: string }> | null
  items: Array<{
    item_order: number
    item_category?: string
    use_plan?: string | null
    use_location?: string | null
    use_location_detail?: string | null
    usage_experience?: boolean | null
    self_usage_possible?: boolean | null
    support_person?: string | null
    item_opinion?: string | null
  }>
}

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY가 설정되지 않았습니다" }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null
    const assessmentId = formData.get("assessmentId") as string | null
    const existingItemsRaw = formData.get("existingItems") as string | null

    if (!audioFile || !assessmentId) {
      return NextResponse.json({ error: "audio 및 assessmentId는 필수입니다" }, { status: 400 })
    }

    const existingItems: Array<{ item_order: number; item_category: string }> = existingItemsRaw
      ? JSON.parse(existingItemsRaw)
      : []

    const base64Audio = Buffer.from(await audioFile.arrayBuffer()).toString("base64")

    const prompt = `당신은 보조기기 교부사업 적합성 평가 전문가입니다.
아래 현장 인터뷰 녹음을 분석하여 평가 양식에 필요한 정보를 추출해주세요.

현재 신청 품목들: ${JSON.stringify(existingItems)}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 순수 JSON):
{
  "transcript": "전체 대화 내용을 한국어로 전사",
  "fields": {
    "referral_org": "의뢰기관명 (언급된 경우)",
    "general_opinion": "종합 의견 (평가자 관찰 내용, 2-3문장)",
    "prior_grant_records": [{"year": 연도, "agency": "기관명", "item": "품목명"}],
    "items": [
      {
        "item_order": 1,
        "item_category": "품목 분류 (예: 전동휠체어)",
        "use_plan": "보조기기 활용 계획 (대상자가 언급한 내용)",
        "use_location": "가정|직장|학교|기타 중 하나",
        "use_location_detail": "세부 사용 장소",
        "usage_experience": true 또는 false (해당 보조기기 사용 경험),
        "self_usage_possible": true 또는 false (스스로 사용 가능 여부),
        "support_person": "보조인 이름 또는 관계",
        "item_opinion": "해당 품목에 대한 평가자 의견"
      }
    ]
  }
}

정보가 없는 필드는 null로 설정하세요. 확실하지 않은 정보는 추측하지 마세요.`

    const model = getGeminiModel("gemini-2.0-flash")
    const response = await model.generateContent([
      { inlineData: { data: base64Audio, mimeType: audioFile.type || "audio/webm" } },
      { text: prompt },
    ])

    const text = response.response.text()
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const parsed = JSON.parse(cleaned) as { transcript: string; fields: ExtractedGrantFields }

    return NextResponse.json({ transcript: parsed.transcript, fields: parsed.fields })
  } catch (e) {
    console.error("interview-extract POST:", e)
    const message = e instanceof Error ? e.message : "인터뷰 추출에 실패했습니다"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
