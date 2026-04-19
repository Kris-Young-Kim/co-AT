// lib/agents/domains/knowledge/index.ts
// Knowledge Main Agent - 규정/지침서 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import { GUIDE_SEARCH_DECLARATION, guideSearchTool } from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  search_business_guide: guideSearchTool,
}

export const KnowledgeMainAgent: MainAgent = {
  domain: "knowledge" as AgentDomain,
  description:
    "업무지침 에이전트: 2026년 보조기기센터 사업안내 문서를 직접 검색하여 운영 기준, 절차, 규정에 대해 답변합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [GUIDE_SEARCH_DECLARATION]
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
