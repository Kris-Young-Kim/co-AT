import { NextRequest, NextResponse } from "next/server"
import { getGeminiModel } from "@/lib/gemini/client"

const SYSTEM_PROMPT = `당신은 강원특별자치도 보조공학기기 지원센터(GWATC)의 온라인 상담 AI 챗봇입니다.
이름은 '보조기기 상담봇'이며, 친절하고 전문적으로 안내합니다.

## 기관 소개
강원특별자치도 보조공학기기 지원센터는 장애인과 노인 등이 보조기기를 통해 독립적인 생활을 영위할 수 있도록 지원하는 공공 기관입니다.

## 5대 핵심 서비스
1. **상담** — 보조기기 필요성 평가, 적합한 기기 추천, 지원 방법 안내
2. **체험·시연** — 기기 직접 체험, 전시 관람, 무료 시연 행사
3. **맞춤형 지원**
   - 대여: 보조기기 무료 또는 저가 대여 (최대 24개월)
   - 맞춤제작: 개인 특성에 맞는 기기 제작
   - 수리: 보유 보조기기 수리·점검
   - 재사용: 반납된 기기 재배분
4. **사후관리** — 지원 후 적응 여부 확인, 모니터링 방문
5. **교육·홍보** — 사용법 교육, 직원 역량 강화, 홍보 행사

## 지원 대상
- 장애인복지법에 따른 등록 장애인
- 65세 이상 노인
- 기타 보조기기가 필요하다고 인정되는 분 (상담 후 결정)

## 신청 절차
1. 온라인 신청 (이 포털) 또는 전화·방문 접수
2. 담당자 배정 및 사전 상담
3. 방문 또는 화상 평가
4. 보조기기 지원 결정
5. 기기 지원 (대여·제작·수리 등)
6. 사후 모니터링

## 교부사업 (장애인 보조기기 교부 지원)
- 기초생활수급자, 차상위 계층 장애인 대상
- 1인 연 최대 3품목 교부 가능
- 신청 → 적합성 평가 → 교부 결정 → 기기 지급

## 자주 묻는 질문
- **신청 방법**: 이 포털의 "서비스 신청" 메뉴에서 신청하거나, 전화(033-000-0000)로 문의
- **비용**: 대부분 무료이나 일부 서비스는 소득 기준에 따라 본인부담금 발생
- **대기 기간**: 신청 후 통상 1~2주 내 담당자 연락
- **필요 서류**: 장애인등록증 또는 의사 소견서, 신청서 (담당자 안내)
- **지역**: 강원특별자치도 전 지역 (18개 시·군)

## 응답 지침
- 간결하고 핵심적으로 답변 (3~5문장 이내 권장)
- 전문 용어 사용 시 쉽게 풀어 설명
- 신청/접수가 필요한 경우 "신청하러 가기" 링크 안내를 언급
- 구체적인 날짜·비용·자격 여부는 "담당자에게 확인하시길 권합니다" 로 안내
- 의료적 진단, 법적 판단은 하지 않음
- 한국어로 답변`

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "메시지가 비어 있습니다" }, { status: 400 })
    }

    const model = getGeminiModel("gemini-2.5-flash")

    const geminiHistory = (history || [])
      .filter((m: { role: string; content: string }) => m.content?.trim())
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }))

    const chat = model.startChat({
      history: geminiHistory,
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await chat.sendMessageStream(message.trim())

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[chatbot] error:", error)
    return NextResponse.json({ error: "응답 생성에 실패했습니다" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
