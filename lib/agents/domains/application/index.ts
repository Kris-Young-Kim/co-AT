// lib/agents/domains/application/index.ts
// Application Main Agent - 신청서 관리 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  NEW_APPLICATIONS_DECLARATION, newApplicationsTool,
  CLIENT_APPLICATIONS_DECLARATION, clientApplicationsTool,
  OVERDUE_RENTALS_DECLARATION, overdueRentalsTool,
  EXPIRING_RENTALS_DECLARATION, expiringRentalsTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  get_new_applications: newApplicationsTool,
  get_client_applications: clientApplicationsTool,
  get_overdue_rentals: overdueRentalsTool,
  get_expiring_rentals: expiringRentalsTool,
}

export const ApplicationMainAgent: MainAgent = {
  domain: "application" as AgentDomain,
  description:
    "신청서 관리 에이전트: 신규 접수 신청서 조회, 대상자별 신청 이력, 연체 및 만료 예정 대여 관리를 처리합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [
      NEW_APPLICATIONS_DECLARATION,
      CLIENT_APPLICATIONS_DECLARATION,
      OVERDUE_RENTALS_DECLARATION,
      EXPIRING_RENTALS_DECLARATION,
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
