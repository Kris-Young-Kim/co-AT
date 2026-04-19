// lib/agents/domains/client/index.ts
// Client Main Agent - CRM 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  CLIENT_SEARCH_DECLARATION,
  clientSearchTool,
  SERVICE_HISTORY_DECLARATION,
  serviceHistoryTool,
  APPLICATION_STATUS_DECLARATION,
  applicationStatusTool,
  CREATE_CLIENT_DECLARATION,
  createClientTool,
  GET_ALL_CLIENTS_DECLARATION,
  getAllClientsTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  search_clients: clientSearchTool,
  get_client_service_history: serviceHistoryTool,
  get_client_application_status: applicationStatusTool,
  create_client_record: createClientTool,
  get_all_clients: getAllClientsTool,
}

export const ClientMainAgent: MainAgent = {
  domain: "client" as AgentDomain,
  description:
    "CRM/대상자 에이전트: 대상자 검색, 등록, 서비스 이력 조회, 신청 현황 확인을 처리합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [
      CLIENT_SEARCH_DECLARATION,
      SERVICE_HISTORY_DECLARATION,
      APPLICATION_STATUS_DECLARATION,
      CREATE_CLIENT_DECLARATION,
      GET_ALL_CLIENTS_DECLARATION,
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
