// app/api/agents/chat/route.ts
// AI 오케스트레이터 스트리밍 채팅 API 엔드포인트

import { NextRequest, NextResponse } from "next/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { runOrchestratorStream } from "@/lib/agents/orchestrator"
import { ClientMainAgent } from "@/lib/agents/domains/client"
import { ScheduleMainAgent } from "@/lib/agents/domains/schedule"
import { InventoryMainAgent } from "@/lib/agents/domains/inventory"
import { KnowledgeMainAgent } from "@/lib/agents/domains/knowledge"
import { DocumentMainAgent } from "@/lib/agents/domains/document"
import { PostingMainAgent } from "@/lib/agents/domains/posting"
import { PerformanceMainAgent } from "@/lib/agents/domains/performance"
import { ApplicationMainAgent } from "@/lib/agents/domains/application"
import type { AgentChatRequest, AgentDomain, MainAgent } from "@/lib/agents/types"

// 에이전트 레지스트리 - 모듈 레벨에서 한 번만 생성
const agentRegistry = new Map<AgentDomain, MainAgent>([
  ["client", ClientMainAgent],
  ["schedule", ScheduleMainAgent],
  ["inventory", InventoryMainAgent],
  ["knowledge", KnowledgeMainAgent],
  ["document", DocumentMainAgent],
  ["posting", PostingMainAgent],
  ["performance", PerformanceMainAgent],
  ["application", ApplicationMainAgent],
])

export async function POST(req: NextRequest) {
  // 1. 권한 확인 (기존 Server Action 패턴과 동일)
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }
  } catch {
    return NextResponse.json(
      { error: "인증 확인 중 오류가 발생했습니다" },
      { status: 401 }
    )
  }

  // 2. 요청 바디 파싱
  let body: AgentChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "메시지가 비어 있습니다" }, { status: 400 })
  }

  // 3. 대화 이력을 Gemini 형식으로 변환
  const geminiHistory = (body.conversationHistory || [])
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }))

  // 4. ReadableStream 반환
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      await runOrchestratorStream(
        body.message.trim(),
        geminiHistory,
        agentRegistry,
        encoder,
        controller
      )
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

// 정적 최적화 방지
export const dynamic = "force-dynamic"
