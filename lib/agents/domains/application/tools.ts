// lib/agents/domains/application/tools.ts
// Application 도메인 Sub-Agent 도구 구현
// 신청서 관리 - 신규 접수, 대여 현황, 만료 예정

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { getNewApplications } from "@/actions/dashboard-actions"
import {
  getRentals,
  getOverdueRentals,
  getExpiringRentals,
} from "@/actions/rental-actions"
import { getClientHistory } from "@/actions/client-actions"

// ── 도구 1: 신규 접수 신청서 목록 ────────────────────────────────────────────

export const NEW_APPLICATIONS_DECLARATION: AgentToolDeclaration = {
  name: "get_new_applications",
  description:
    "최근 새로 접수된 신청서 목록을 조회합니다. '신규 접수', '신청서 현황', '접수된 신청' 등의 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 10)",
      },
    },
  },
}

export const newApplicationsTool: AgentToolImplementation = async (args) => {
  try {
    const limit = Math.min(Number(args.limit) || 10, 20)
    const result = await getNewApplications(limit)

    if (!result.success || !result.applications || result.applications.length === 0) {
      return {
        success: true,
        display: "현재 처리 대기 중인 신청서가 없습니다.",
      }
    }

    const CATEGORY_LABEL: Record<string, string> = {
      consultation: "상담",
      experience: "체험",
      rental: "대여",
      repair: "수리",
      custom_make: "맞춤제작",
      aftercare: "사후관리",
      education: "교육",
    }

    const list = result.applications
      .map((app, i) => {
        const clientName = app.client?.name || "미등록"
        const category = app.category ? CATEGORY_LABEL[app.category] || app.category : "기타"
        const subCategory = app.sub_category ? ` > ${app.sub_category}` : ""
        const date = app.created_at ? app.created_at.slice(0, 10) : "날짜 미상"
        return `${i + 1}. **${clientName}** | [${category}${subCategory}] | 접수일: ${date}\n   ID: \`${app.id.slice(0, 8)}...\``
      })
      .join("\n\n")

    return {
      success: true,
      display: `신규 접수 신청서 ${result.applications.length}건:\n\n${list}`,
      data: result.applications,
    }
  } catch (error) {
    return {
      success: false,
      display: "신청서 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 대상자별 신청 이력 ────────────────────────────────────────────────

export const CLIENT_APPLICATIONS_DECLARATION: AgentToolDeclaration = {
  name: "get_client_applications",
  description:
    "특정 대상자의 신청서 전체 이력을 조회합니다. 대상자 ID가 필요합니다.",
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "대상자의 UUID (대상자 검색 후 ID를 가져오세요)",
      },
    },
    required: ["client_id"],
  },
}

export const clientApplicationsTool: AgentToolImplementation = async (args) => {
  const clientId = String(args.client_id || "")

  try {
    const result = await getClientHistory(clientId)

    if (!result.success || !result.history) {
      return {
        success: false,
        display: "신청 이력 조회 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const applications = result.history.filter((h) => h.type === "application")

    if (applications.length === 0) {
      return {
        success: true,
        display: "해당 대상자의 신청 이력이 없습니다.",
      }
    }

    const STATUS_LABEL: Record<string, string> = {
      received: "🟡 접수",
      in_progress: "🔵 진행중",
      completed: "🟢 완료",
      cancelled: "⚫ 취소",
    }

    const list = applications
      .slice(0, 10)
      .map((a) => {
        const status = STATUS_LABEL[a.status || ""] || a.status || "접수"
        const category = a.category ? ` [${a.category}]` : ""
        return `- ${status}${category} **${a.title}** | ${a.date.slice(0, 10)}`
      })
      .join("\n")

    return {
      success: true,
      display: `신청 이력 (총 ${applications.length}건 / 최근 ${Math.min(10, applications.length)}건):\n\n${list}`,
      data: applications,
    }
  } catch (error) {
    return {
      success: false,
      display: "신청 이력 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 3: 연체 대여 목록 ────────────────────────────────────────────────────

export const OVERDUE_RENTALS_DECLARATION: AgentToolDeclaration = {
  name: "get_overdue_rentals",
  description:
    "현재 반납 기한이 지난 연체 대여 목록을 조회합니다. '연체 대여', '반납 안 된 기기', '미반납' 등의 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {},
  },
}

export const overdueRentalsTool: AgentToolImplementation = async () => {
  try {
    const result = await getOverdueRentals()

    if (!result.success || !result.rentals || result.rentals.length === 0) {
      return {
        success: true,
        display: "현재 연체된 대여 건이 없습니다. ✅",
      }
    }

    const list = result.rentals
      .slice(0, 10)
      .map((r, i) => {
        const endDate = r.rental_end_date || "기한 미상"
        const today = new Date()
        const end = new Date(endDate)
        const overdueDays = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
        return `${i + 1}. 대여 ID: \`${r.id.slice(0, 8)}...\`\n   반납 기한: ${endDate} | ⚠️ ${overdueDays}일 연체`
      })
      .join("\n\n")

    return {
      success: true,
      display: `⚠️ 연체 대여 ${result.rentals.length}건:\n\n${list}\n\n즉시 반납 독촉이 필요합니다.`,
      data: result.rentals,
    }
  } catch (error) {
    return {
      success: false,
      display: "연체 대여 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 4: 만료 예정 대여 목록 ───────────────────────────────────────────────

export const EXPIRING_RENTALS_DECLARATION: AgentToolDeclaration = {
  name: "get_expiring_rentals",
  description:
    "곧 반납 기한이 도래하는 대여 목록을 조회합니다. '만료 예정', '반납 예정', '곧 만료되는' 등의 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      days_ahead: {
        type: "number",
        description: "앞으로 며칠 이내 만료되는 건을 조회할지 (기본값: 7일)",
      },
    },
  },
}

export const expiringRentalsTool: AgentToolImplementation = async (args) => {
  try {
    const daysAhead = Math.min(Number(args.days_ahead) || 7, 30)
    const result = await getExpiringRentals(daysAhead)

    if (!result.success || !result.rentals || result.rentals.length === 0) {
      return {
        success: true,
        display: `향후 ${daysAhead}일 내 반납 예정인 대여 건이 없습니다.`,
      }
    }

    const list = result.rentals
      .slice(0, 10)
      .map((r, i) => {
        const endDate = r.rental_end_date || "기한 미상"
        const today = new Date()
        const end = new Date(endDate)
        const daysLeft = Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const urgency = daysLeft <= 2 ? "🔴" : daysLeft <= 5 ? "🟡" : "🟢"
        return `${i + 1}. ${urgency} 대여 ID: \`${r.id.slice(0, 8)}...\`\n   반납 기한: ${endDate} | D-${daysLeft}`
      })
      .join("\n\n")

    return {
      success: true,
      display: `반납 예정 대여 (${daysAhead}일 이내, 총 ${result.rentals.length}건):\n\n${list}`,
      data: result.rentals,
    }
  } catch (error) {
    return {
      success: false,
      display: "만료 예정 대여 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
