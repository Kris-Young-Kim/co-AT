// app/api/agents/chat/route.ts
// AI ?¤ì??¤íŠ¸?ˆì´???¤íŠ¸ë¦¬ë° ì±„íŒ… API ?”ë“œ?¬ì¸??
import { NextRequest, NextResponse } from "next/server"
import { hasAdminOrStaffPermission } from "@co-at/auth"
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

// ?ì´?„íŠ¸ ?ˆì??¤íŠ¸ë¦?- ëª¨ë“ˆ ?ˆë²¨?ì„œ ??ë²ˆë§Œ ?ì„±
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
  // 1. ê¶Œí•œ ?•ì¸ (ê¸°ì¡´ Server Action ?¨í„´ê³??™ì¼)
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json({ error: "ê¶Œí•œ???†ìŠµ?ˆë‹¤" }, { status: 403 })
    }
  } catch {
    return NextResponse.json(
      { error: "?¸ì¦ ?•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤" },
      { status: 401 }
    )
  }

  // 2. ?”ì²­ ë°”ë”” ?Œì‹±
  let body: AgentChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "?˜ëª»???”ì²­ ?•ì‹?…ë‹ˆ?? }, { status: 400 })
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "ë©”ì‹œì§€ê°€ ë¹„ì–´ ?ˆìŠµ?ˆë‹¤" }, { status: 400 })
  }

  // 3. ?€???´ë ¥??Gemini ?•ì‹?¼ë¡œ ë³€??  const geminiHistory = (body.conversationHistory || [])
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }))

  // 4. ReadableStream ë°˜í™˜
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

// ?•ì  ìµœì ??ë°©ì?
export const dynamic = "force-dynamic"
