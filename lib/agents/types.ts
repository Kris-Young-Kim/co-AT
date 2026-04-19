// lib/agents/types.ts
// 공유 타입 정의 - 오케스트레이터와 모든 도메인 에이전트에서 사용

// ── 도메인 상수 ──────────────────────────────────────────────────────────────

export type AgentDomain =
  | "client"
  | "schedule"
  | "inventory"
  | "knowledge"
  | "document"
  | "posting"
  | "performance"
  | "application"
  | "general"

// ── 스트림 이벤트 타입 ────────────────────────────────────────────────────────

export type StreamEventType =
  | "text_delta"       // Gemini 텍스트 청크
  | "tool_start"       // 도구 실행 시작
  | "tool_result"      // 도구 실행 완료
  | "routing_decision" // 오케스트레이터 라우팅 결정
  | "error"            // 오류 발생
  | "done"             // 스트림 종료

export interface StreamEvent {
  type: StreamEventType
  data: string    // JSON.stringify된 페이로드
  timestamp: number
}

// 각 이벤트 타입별 페이로드
export interface TextDeltaPayload { text: string }
export interface ToolStartPayload { toolName: string; input: Record<string, unknown> }
export interface ToolResultPayload { toolName: string; success: boolean; summary: string }
export interface RoutingDecisionPayload { domain: AgentDomain; confidence: string }
export interface ErrorPayload { message: string }

// ── 도구 타입 ────────────────────────────────────────────────────────────────

export interface AgentToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object"
  description: string
  enum?: string[]
  items?: AgentToolParameter
  properties?: Record<string, AgentToolParameter>
  required?: string[]
}

export interface AgentToolDeclaration {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, AgentToolParameter>
    required?: string[]
  }
}

export interface AgentToolResult {
  success: boolean
  display: string    // 마크다운 텍스트 - Gemini context에 주입됨
  data?: unknown
  error?: string
}

export type AgentToolImplementation = (
  args: Record<string, unknown>
) => Promise<AgentToolResult>

// ── Main Agent 인터페이스 ──────────────────────────────────────────────────────

export interface MainAgent {
  domain: AgentDomain
  description: string
  getToolDeclarations(): AgentToolDeclaration[]
  executeTool(toolName: string, args: Record<string, unknown>): Promise<AgentToolResult>
}

// ── API 요청/응답 ─────────────────────────────────────────────────────────────

export interface AgentChatRequest {
  message: string
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
}
