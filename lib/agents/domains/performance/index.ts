// lib/agents/domains/performance/index.ts
// Performance Main Agent - 실적 정리 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  MONTHLY_STATS_DECLARATION, monthlyStatsTool,
  STATS_SUMMARY_DECLARATION, statsSummaryTool,
  TEAM_PERFORMANCE_DECLARATION, teamPerformanceTool,
  BUDGET_EXECUTION_DECLARATION, budgetExecutionTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  get_monthly_stats: monthlyStatsTool,
  get_stats_summary: statsSummaryTool,
  get_team_performance: teamPerformanceTool,
  get_budget_execution: budgetExecutionTool,
}

export const PerformanceMainAgent: MainAgent = {
  domain: "performance" as AgentDomain,
  description:
    "실적 정리 에이전트: 월별 실적 통계, 기간별 요약, 팀 성과, 예산 집행 현황을 조회합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [
      MONTHLY_STATS_DECLARATION,
      STATS_SUMMARY_DECLARATION,
      TEAM_PERFORMANCE_DECLARATION,
      BUDGET_EXECUTION_DECLARATION,
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
