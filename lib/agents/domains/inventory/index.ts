// lib/agents/domains/inventory/index.ts
// Inventory Main Agent - 재고/기기 도메인 진입점

import type { MainAgent, AgentDomain, AgentToolDeclaration, AgentToolResult } from "../../types"
import {
  INVENTORY_STOCK_DECLARATION,
  inventoryStockTool,
  RENTAL_AVAILABLE_DECLARATION,
  rentalAvailableTool,
  RENTAL_LIST_DECLARATION,
  rentalListTool,
} from "./tools"

const toolMap: Record<string, (args: Record<string, unknown>) => Promise<AgentToolResult>> = {
  check_inventory_stock: inventoryStockTool,
  get_rental_available_devices: rentalAvailableTool,
  get_rental_list: rentalListTool,
}

export const InventoryMainAgent: MainAgent = {
  domain: "inventory" as AgentDomain,
  description:
    "재고/기기 에이전트: 보조기기 재고 현황 조회, 대여 가능 기기 목록, 대여 현황 관리를 처리합니다.",

  getToolDeclarations(): AgentToolDeclaration[] {
    return [INVENTORY_STOCK_DECLARATION, RENTAL_AVAILABLE_DECLARATION, RENTAL_LIST_DECLARATION]
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
