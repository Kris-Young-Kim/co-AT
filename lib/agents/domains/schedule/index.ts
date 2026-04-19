// lib/agents/domains/schedule/index.ts
// Schedule Main Agent - 일정 관리 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  TODAY_SCHEDULE_DECLARATION,
  todayScheduleTool,
  WEEK_SCHEDULE_DECLARATION,
  weekScheduleTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  get_today_schedules: todayScheduleTool,
  get_week_schedules: weekScheduleTool,
}

export const ScheduleMainAgent: MainAgent = {
  domain: "schedule" as AgentDomain,
  description: "일정 관리 에이전트: 오늘 일정, 이번 주 일정, 예정된 방문/상담/평가 일정을 조회합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [TODAY_SCHEDULE_DECLARATION, WEEK_SCHEDULE_DECLARATION]
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
