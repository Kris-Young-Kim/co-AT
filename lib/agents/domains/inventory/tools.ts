// lib/agents/domains/inventory/tools.ts
// Inventory 도메인 Sub-Agent 도구 구현
// 기존 inventory-actions.ts Server Action을 래핑

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { getInventoryList, getReusableDevices } from "@/actions/inventory-actions"
import { getRentals } from "@/actions/rental-actions"

// ── 도구 1: 재고 현황 조회 ─────────────────────────────────────────────────────

export const INVENTORY_STOCK_DECLARATION: AgentToolDeclaration = {
  name: "check_inventory_stock",
  description:
    "보조기기 재고 현황을 조회합니다. 특정 기기명, 카테고리, 상태로 검색할 수 있습니다.",
  parameters: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "검색어: 기기명, 자산번호, 제조사, 모델명 (예: '전동휠체어', 'WC-001')",
      },
      status: {
        type: "string",
        description: "상태 필터 (예: '보관', '대여중', '수리중', '폐기')",
        enum: ["보관", "대여중", "수리중", "폐기"],
      },
      category: {
        type: "string",
        description: "카테고리 필터 (예: '이동보조', '욕창예방', '의사소통')",
      },
    },
  },
}

export const inventoryStockTool: AgentToolImplementation = async (args) => {
  try {
    const result = await getInventoryList({
      search: args.search ? String(args.search) : undefined,
      status: args.status ? String(args.status) : undefined,
      category: args.category ? String(args.category) : undefined,
      limit: 15,
    })

    if (!result.success || !result.items || result.items.length === 0) {
      const searchDesc = args.search ? `"${args.search}"` : "해당 조건의"
      return {
        success: false,
        display: `${searchDesc} 재고 항목을 찾을 수 없습니다.`,
        error: result.error,
      }
    }

    const statusEmoji: Record<string, string> = {
      보관: "🟢",
      대여중: "🔵",
      수리중: "🟡",
      폐기: "⚫",
    }

    const itemList = result.items
      .slice(0, 10)
      .map((item) => {
        const emoji = statusEmoji[item.status || ""] || "⚪"
        const assetCode = item.asset_code ? ` (${item.asset_code})` : ""
        const rentalBadge = item.is_rental_available ? " ✅대여가능" : ""
        return `- ${emoji} **${item.name}**${assetCode} | ${item.status}${rentalBadge}` +
          (item.category ? ` | ${item.category}` : "") +
          (item.manufacturer ? ` | ${item.manufacturer}` : "")
      })
      .join("\n")

    return {
      success: true,
      display: `재고 조회 결과 (총 ${result.total}개 중 ${Math.min(10, result.items.length)}개 표시):\n\n${itemList}`,
      data: result.items,
    }
  } catch (error) {
    return {
      success: false,
      display: "재고 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 대여 가능 기기 목록 ───────────────────────────────────────────────

export const RENTAL_AVAILABLE_DECLARATION: AgentToolDeclaration = {
  name: "get_rental_available_devices",
  description:
    "현재 대여 가능한 재사용 보조기기 목록을 조회합니다. '대여 가능한 기기', '빌릴 수 있는 기기' 등의 질문에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 20)",
      },
    },
  },
}

export const rentalAvailableTool: AgentToolImplementation = async (args) => {
  try {
    const limit = Math.min(Number(args.limit) || 20, 30)
    const devices = await getReusableDevices(limit)

    if (!devices || devices.length === 0) {
      return {
        success: true,
        display: "현재 대여 가능한 재사용 보조기기가 없습니다.",
      }
    }

    const deviceList = devices
      .map((d) => {
        const assetCode = d.asset_code ? ` (${d.asset_code})` : ""
        const purchaseDate = d.purchase_date ? ` | 구입일: ${d.purchase_date.slice(0, 7)}` : ""
        return `- **${d.name}**${assetCode} | ${d.category || "미분류"}${purchaseDate}`
      })
      .join("\n")

    return {
      success: true,
      display: `대여 가능 재사용 보조기기 (총 ${devices.length}개):\n\n${deviceList}`,
      data: devices,
    }
  } catch (error) {
    return {
      success: false,
      display: "대여 가능 기기 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 3: 대여 현황 목록 조회 ────────────────────────────────────────────────

export const RENTAL_LIST_DECLARATION: AgentToolDeclaration = {
  name: "get_rental_list",
  description:
    "현재 진행 중인 대여 목록을 조회합니다. 상태별(대여중/반납완료/연체)로 필터링하거나 전체 대여 현황을 확인할 수 있습니다.",
  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "대여 상태 필터 (예: '대여중', '반납완료', '연체')",
        enum: ["대여중", "반납완료", "연체"],
      },
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 15)",
      },
    },
  },
}

export const rentalListTool: AgentToolImplementation = async (args) => {
  const status = args.status ? String(args.status) : undefined
  const limit = Math.min(Number(args.limit) || 15, 30)

  try {
    const result = await getRentals({ status, limit })

    if (!result.success || !result.rentals || result.rentals.length === 0) {
      const statusDesc = status ? `'${status}' 상태의` : ""
      return {
        success: true,
        display: `현재 ${statusDesc} 대여 기록이 없습니다.`,
      }
    }

    const statusEmoji: Record<string, string> = {
      대여중: "🔵",
      반납완료: "🟢",
      연체: "🔴",
    }

    const rentalList = result.rentals
      .map((r) => {
        const emoji = statusEmoji[r.status || ""] || "⚪"
        const daysInfo = r.is_overdue
          ? " ⚠️ 연체"
          : r.days_remaining !== undefined
            ? ` (잔여 ${r.days_remaining}일)`
            : ""
        return (
          `- ${emoji} **${r.inventory_name || "기기명 없음"}** | ${r.client_name || "대상자 없음"}` +
          `\n  대여: ${r.rental_start_date?.slice(0, 10)} ~ ${r.rental_end_date?.slice(0, 10)}${daysInfo}`
        )
      })
      .join("\n")

    return {
      success: true,
      display: `대여 현황 (총 ${result.total}건 중 ${result.rentals.length}건 표시):\n\n${rentalList}`,
      data: result.rentals,
    }
  } catch (error) {
    return {
      success: false,
      display: "대여 목록 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
