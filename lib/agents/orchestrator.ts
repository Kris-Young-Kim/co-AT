// lib/agents/orchestrator.ts
// 마스터 오케스트레이터 - 사용자 쿼리를 분석하고 적절한 Main Agent에 라우팅

import { getGeminiModel } from "@/lib/gemini/client"
import { SchemaType, FunctionCallingMode } from "@google/generative-ai"
import type {
  MainAgent,
  AgentDomain,
  AgentToolDeclaration,
  StreamEvent,
  RoutingDecisionPayload,
  ToolStartPayload,
  ToolResultPayload,
  TextDeltaPayload,
  ErrorPayload,
} from "./types"

// ── AgentToolDeclaration → Gemini FunctionDeclaration 변환 ────────────────────

function toGeminiProperty(prop: AgentToolDeclaration["parameters"]["properties"][string]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base: Record<string, any> = { description: prop.description }

  switch (prop.type) {
    case "string":
      base.type = SchemaType.STRING
      break
    case "number":
      base.type = SchemaType.NUMBER
      break
    case "boolean":
      base.type = SchemaType.BOOLEAN
      break
    case "array":
      base.type = SchemaType.ARRAY
      break
    case "object":
      base.type = SchemaType.OBJECT
      break
    default:
      base.type = SchemaType.STRING
  }

  if (prop.enum) base.enum = prop.enum
  return base
}

function toGeminiFunctionDeclaration(decl: AgentToolDeclaration) {
  const properties: Record<string, ReturnType<typeof toGeminiProperty>> = {}
  for (const [key, val] of Object.entries(decl.parameters.properties)) {
    properties[key] = toGeminiProperty(val)
  }

  return {
    name: decl.name,
    description: decl.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties,
      required: decl.parameters.required,
    },
  }
}

// ── 라우팅 도구 선언 ───────────────────────────────────────────────────────────

const ROUTING_TOOL_DECLARATIONS = [
  {
    name: "route_to_client_agent",
    description: `대상자(CRM) 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 사람 이름으로 대상자 검색 (예: "김철수", "홍길동")
- 대상자 서비스 이력, 신청서 현황 조회
- 특정 대상자의 프로필, 장애유형, 연락처 확인
- "대상자 찾아줘", "이력 조회", "신청 현황" 등의 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_schedule_agent",
    description: `일정 관리 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 오늘/이번 주/내일 일정 확인
- 방문, 상담, 평가, 배송, 수거 일정 조회
- "오늘 뭐해", "이번 주 일정", "다음 방문 언제야" 등의 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_inventory_agent",
    description: `재고/기기 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 보조기기 재고 현황 조회
- 특정 기기 검색 (전동휠체어, 보청기 등)
- 대여 가능한 기기 목록
- "재고 있어?", "기기 찾아줘", "대여 가능한 것" 등의 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_knowledge_agent",
    description: `업무지침 에이전트로 라우팅합니다. 2026년 보조기기센터 사업안내 문서를 검색합니다. 다음 경우에 사용하세요:
- 대여 기간, 수리 비용 한도, 맞춤제작 지원 금액 등 서비스 기준
- 인력 자격, 팀장/팀원 요건, 센터장 자격
- 예산 집행 기준, 예산 단가, 상한액
- 신청 절차, 서비스 대상자, 지원 자격
- 복무 규정, 경조사휴가, 출산휴가, 모성보호
- 보고 체계, 평가 지표, 센터 운영 기준
- "규정이 어떻게 돼?", "지침서 찾아줘", "몇 개월이야?", "기준이 뭐야?" 등의 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_document_agent",
    description: `문서 생성 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 상담 내용을 SOAP 노트로 변환 요청
- "SOAP 노트 작성해줘", "상담 내용 정리해줘"
- 구조화된 서비스 기록 작성 요청`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_posting_agent",
    description: `공개 게시 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 공지사항 조회, 작성, 수정 요청
- "공지사항 올려줘", "최근 공지 보여줘", "공지사항 수정해줘"
- 카테고리별 공지 조회 (일반, 행사, 채용 등)`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_performance_agent",
    description: `실적/통계 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 월별/연도별 서비스 실적 통계
- 팀별 업무 현황, 예산 집행 현황
- "이번 달 실적", "지난 달 통계", "예산 얼마나 사용했어?"
- 센터 운영 현황 리포트 관련 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_application_agent",
    description: `신청서 관리 에이전트로 라우팅합니다. 다음 경우에 사용하세요:
- 신규 신청서 목록, 접수된 신청 현황
- 연체/반납 기한 임박 대여 관리
- "새로 들어온 신청서", "반납 기한 지난 기기", "곧 반납해야 할 기기"
- 신청 처리, 대여 상태 관리 관련 표현`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
  {
    name: "route_to_general",
    description: `일반 응답으로 라우팅합니다. 특정 도메인에 해당하지 않는 일반 질문, 인사, AI 도우미 관련 질문에 사용하세요.`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: "사용자 질문" },
      },
      required: ["query"],
    },
  },
]

const DOMAIN_FROM_FUNCTION: Record<string, AgentDomain> = {
  route_to_client_agent: "client",
  route_to_schedule_agent: "schedule",
  route_to_inventory_agent: "inventory",
  route_to_knowledge_agent: "knowledge",
  route_to_document_agent: "document",
  route_to_posting_agent: "posting",
  route_to_performance_agent: "performance",
  route_to_application_agent: "application",
  route_to_general: "general",
}

// ── 도메인별 시스템 프롬프트 ───────────────────────────────────────────────────

const DOMAIN_SYSTEM_PROMPTS: Record<AgentDomain, string> = {
  client: `당신은 강원도 보조기기센터의 CRM 전문 AI입니다.
대상자(클라이언트) 정보 조회, 신규 등록, 서비스 이력 확인, 신청 현황 파악을 도와줍니다.
도구 사용 결과를 바탕으로 명확하고 간결하게 답변하세요.
개인정보는 신중하게 다루고, 없는 정보는 추측하지 마세요.
한국어로 답변하세요.`,

  schedule: `당신은 강원도 보조기기센터의 일정 관리 AI입니다.
방문, 상담, 평가, 배송 등 모든 업무 일정을 파악하고 안내합니다.
도구 결과를 시간 순서대로 정리해서 명확하게 전달하세요.
한국어로 답변하세요.`,

  inventory: `당신은 강원도 보조기기센터의 재고 관리 AI입니다.
보조기기 재고 현황, 대여 가능 여부, 대여 현황, 기기 정보를 안내합니다.
도구 결과를 명확하게 정리해서 전달하세요.
한국어로 답변하세요.`,

  knowledge: `당신은 강원도 보조기기센터의 규정/지침서 전문 AI입니다.
센터 운영 규정, 업무 지침, 정책에 관한 질문에 도구 검색 결과를 바탕으로 답변합니다.
규정에 없는 내용은 추측하지 말고, 확인이 필요하다고 안내하세요.
한국어로 답변하세요.`,

  document: `당신은 강원도 보조기기센터의 문서 작성 AI입니다.
상담 내용을 SOAP 노트 형식으로 전문적으로 변환합니다.
도구가 생성한 SOAP 노트를 그대로 전달하고 필요시 간단한 설명을 덧붙이세요.
한국어로 답변하세요.`,

  posting: `당신은 강원도 보조기기센터의 공지사항 관리 AI입니다.
공지사항 조회, 작성, 수정 업무를 처리합니다.
게시 내용은 정확하고 공식적인 어조로 안내하세요.
한국어로 답변하세요.`,

  performance: `당신은 강원도 보조기기센터의 실적 분석 AI입니다.
월별/연도별 서비스 통계, 팀 업무 현황, 예산 집행 현황을 분석하고 보고합니다.
수치 데이터는 명확하게 표 또는 목록 형식으로 정리해서 전달하세요.
한국어로 답변하세요.`,

  application: `당신은 강원도 보조기기센터의 신청서 관리 AI입니다.
신규 신청서 현황, 대여 연체/만료 관리를 처리합니다.
처리가 필요한 항목은 우선순위를 명확히 표시하세요.
한국어로 답변하세요.`,

  general: `당신은 강원도 보조기기센터의 AI 업무 도우미입니다.
대상자 검색, 일정 확인, 재고 조회, 규정 검색, 공지사항, 실적 통계, SOAP 노트 작성을 도와드립니다.
친절하고 명확하게 답변하세요.
한국어로 답변하세요.`,
}

// ── 스트림 이벤트 헬퍼 ─────────────────────────────────────────────────────────

function emitEvent(
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  event: StreamEvent
): void {
  controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
}

type GeminiContent = { role: "user" | "model"; parts: Array<{ text: string }> }

// ── 일반 폴백 응답 ─────────────────────────────────────────────────────────────

async function streamGeneralAnswer(
  userMessage: string,
  conversationHistory: GeminiContent[],
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): Promise<void> {
  const model = getGeminiModel("gemini-2.0-flash")

  const stream = await model.generateContentStream({
    systemInstruction: DOMAIN_SYSTEM_PROMPTS.general,
    contents: [
      ...conversationHistory,
      { role: "user" as const, parts: [{ text: userMessage }] },
    ],
  })

  for await (const chunk of stream.stream) {
    const text = chunk.text()
    if (text) {
      emitEvent(encoder, controller, {
        type: "text_delta",
        data: JSON.stringify({ text } as TextDeltaPayload),
        timestamp: Date.now(),
      })
    }
  }
}

// ── 메인 오케스트레이터 함수 ───────────────────────────────────────────────────

export async function runOrchestratorStream(
  userMessage: string,
  conversationHistory: GeminiContent[],
  agents: Map<AgentDomain, MainAgent>,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): Promise<void> {
  try {
    // ── STEP 1: 라우팅 결정 ─────────────────────────────────────────────────
    const routingModel = getGeminiModel("gemini-2.0-flash")

    const routingResponse = await routingModel.generateContent({
      contents: [
        {
          role: "user" as const,
          parts: [
            {
              text: `다음 질문을 분석하고 적절한 에이전트로 라우팅하세요.\n\n질문: "${userMessage}"\n\n반드시 function call로만 응답하세요.`,
            },
          ],
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: ROUTING_TOOL_DECLARATIONS as any }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY } },
    })

    // function call 파트 추출
    const routingCandidate = routingResponse.response.candidates?.[0]
    const routingParts = routingCandidate?.content?.parts ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionCallPart = routingParts.find((p: any) => p.functionCall)

    let selectedDomain: AgentDomain = "general"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fcName = (functionCallPart as any)?.functionCall?.name
    if (fcName && DOMAIN_FROM_FUNCTION[fcName]) {
      selectedDomain = DOMAIN_FROM_FUNCTION[fcName]
    }

    emitEvent(encoder, controller, {
      type: "routing_decision",
      data: JSON.stringify({ domain: selectedDomain, confidence: "high" } as RoutingDecisionPayload),
      timestamp: Date.now(),
    })

    // ── STEP 2: General 폴백 처리 ───────────────────────────────────────────
    const agent = agents.get(selectedDomain)
    if (!agent || selectedDomain === "general") {
      await streamGeneralAnswer(userMessage, conversationHistory, encoder, controller)
      emitEvent(encoder, controller, {
        type: "done",
        data: JSON.stringify({}),
        timestamp: Date.now(),
      })
      controller.close()
      return
    }

    // ── STEP 3: 도메인 에이전트 도구 실행 ───────────────────────────────────
    const agentModel = getGeminiModel("gemini-2.0-flash")
    const geminiFunctionDeclarations = agent.getToolDeclarations().map(toGeminiFunctionDeclaration)
    const systemPrompt = DOMAIN_SYSTEM_PROMPTS[selectedDomain]

    // 첫 번째 에이전트 호출 - 어떤 도구를 쓸지 결정
    const agentResponse = await agentModel.generateContent({
      systemInstruction: systemPrompt,
      contents: [
        ...conversationHistory,
        { role: "user" as const, parts: [{ text: userMessage }] },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ functionDeclarations: geminiFunctionDeclarations as any }],
    })

    const agentCandidate = agentResponse.response.candidates?.[0]
    const agentParts = agentCandidate?.content?.parts ?? []

    // function call들 수집
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionCalls = agentParts.filter((p: any) => p.functionCall)

    // 도구가 호출되지 않은 경우 - 직접 텍스트 응답
    if (functionCalls.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const part of agentParts.filter((p: any) => p.text)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = (part as any).text as string
        if (text) {
          emitEvent(encoder, controller, {
            type: "text_delta",
            data: JSON.stringify({ text } as TextDeltaPayload),
            timestamp: Date.now(),
          })
        }
      }
      emitEvent(encoder, controller, {
        type: "done",
        data: JSON.stringify({}),
        timestamp: Date.now(),
      })
      controller.close()
      return
    }

    // 각 도구 순서대로 실행
    const toolResponseParts: Array<{
      functionResponse: { name: string; response: { content: string } }
    }> = []

    for (const part of functionCalls) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = (part as any).functionCall
      const toolName: string = fc.name
      const toolArgs: Record<string, unknown> = fc.args || {}

      emitEvent(encoder, controller, {
        type: "tool_start",
        data: JSON.stringify({ toolName, input: toolArgs } as ToolStartPayload),
        timestamp: Date.now(),
      })

      const toolResult = await agent.executeTool(toolName, toolArgs)

      emitEvent(encoder, controller, {
        type: "tool_result",
        data: JSON.stringify({
          toolName,
          success: toolResult.success,
          summary:
            toolResult.display.slice(0, 100) +
            (toolResult.display.length > 100 ? "..." : ""),
        } as ToolResultPayload),
        timestamp: Date.now(),
      })

      toolResponseParts.push({
        functionResponse: {
          name: toolName,
          response: { content: toolResult.display },
        },
      })
    }

    // ── STEP 4: 최종 스트리밍 응답 생성 ────────────────────────────────────
    const finalContents = [
      ...conversationHistory,
      { role: "user" as const, parts: [{ text: userMessage }] },
      { role: "model" as const, parts: agentParts },
      { role: "user" as const, parts: toolResponseParts },
    ]

    const finalStream = await agentModel.generateContentStream({
      systemInstruction: systemPrompt,
      contents: finalContents,
    })

    for await (const chunk of finalStream.stream) {
      const text = chunk.text()
      if (text) {
        emitEvent(encoder, controller, {
          type: "text_delta",
          data: JSON.stringify({ text } as TextDeltaPayload),
          timestamp: Date.now(),
        })
      }
    }

    emitEvent(encoder, controller, {
      type: "done",
      data: JSON.stringify({}),
      timestamp: Date.now(),
    })
    controller.close()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"

    emitEvent(encoder, controller, {
      type: "error",
      data: JSON.stringify({ message } as ErrorPayload),
      timestamp: Date.now(),
    })

    try {
      controller.close()
    } catch {
      // 이미 닫혀있는 경우 무시
    }
  }
}
