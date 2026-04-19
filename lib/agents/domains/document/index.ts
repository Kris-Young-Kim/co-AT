// lib/agents/domains/document/index.ts
// Document Main Agent - 문서 생성 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import { SOAP_NOTE_DECLARATION, soapNoteTool } from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  generate_soap_note: soapNoteTool,
}

export const DocumentMainAgent: MainAgent = {
  domain: "document" as AgentDomain,
  description:
    "문서 생성 에이전트: 상담 내용을 SOAP 노트 형식으로 변환하는 AI 문서화를 지원합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [SOAP_NOTE_DECLARATION]
  },

  async executeTool(toolName: string, args: Record<string, unknown>): Promise<AgentToolResult> {
    const impl = toolMap[toolName]
    if (!impl) {
      return {
        success: false,
        display: `알 수 없는 도구입니다: ${toolName}`,
        error: `Tool not found: ${toolName}`,
      }
    }
    return impl(args)
  },
}
