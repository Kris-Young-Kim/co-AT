// lib/agents/domains/posting/index.ts
// Posting Main Agent - 공개 게시 자동화 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  RECENT_NOTICES_DECLARATION, recentNoticesTool,
  NOTICES_BY_CATEGORY_DECLARATION, noticesByCategoryTool,
  CREATE_NOTICE_DECLARATION, createNoticeTool,
  UPDATE_NOTICE_DECLARATION, updateNoticeTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  get_recent_notices: recentNoticesTool,
  get_notices_by_category: noticesByCategoryTool,
  create_notice: createNoticeTool,
  update_notice: updateNoticeTool,
}

export const PostingMainAgent: MainAgent = {
  domain: "posting" as AgentDomain,
  description:
    "공개 게시 자동화 에이전트: 공지사항 조회, 게시, 수정을 처리합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [
      RECENT_NOTICES_DECLARATION,
      NOTICES_BY_CATEGORY_DECLARATION,
      CREATE_NOTICE_DECLARATION,
      UPDATE_NOTICE_DECLARATION,
    ]
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
