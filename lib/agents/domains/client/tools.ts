// lib/agents/domains/client/tools.ts
// Client 도메인 Sub-Agent 도구 구현
// 기존 client-actions.ts Server Action을 래핑

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import {
  searchClients,
  getClientById,
  getClientHistory,
  createClientRecord,
  updateClient,
  type Client,
} from "@/actions/client-actions"

// ── 도구 1: 대상자 검색 ────────────────────────────────────────────────────────

export const CLIENT_SEARCH_DECLARATION: AgentToolDeclaration = {
  name: "search_clients",
  description:
    "이름 또는 생년월일로 대상자(클라이언트)를 검색합니다. 사람 이름이 언급되거나 특정 대상자를 찾을 때 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "검색어: 이름(예: '김철수') 또는 생년월일(YYYY-MM-DD 형식)",
      },
      disability_type: {
        type: "string",
        description: "선택 사항: 장애유형 필터 (예: '지체장애', '시각장애', '청각장애')",
      },
    },
    required: ["query"],
  },
}

export const clientSearchTool: AgentToolImplementation = async (args) => {
  const query = String(args.query || "")
  const disability_type = args.disability_type ? String(args.disability_type) : undefined

  try {
    const result = await searchClients({ query, disability_type, limit: 10 })

    if (!result.success || !result.clients || result.clients.length === 0) {
      return {
        success: false,
        display: `"${query}"에 해당하는 대상자를 찾을 수 없습니다.`,
        error: result.error,
      }
    }

    const clientList = result.clients
      .slice(0, 5)
      .map(
        (c, i) =>
          `${i + 1}. **${c.name}** (ID: \`${c.id.slice(0, 8)}...\`)\n` +
          `   - 생년월일: ${c.birth_date || "미등록"}\n` +
          `   - 장애유형: ${c.disability_type || "미등록"}\n` +
          `   - 신청서 수: ${c.application_count || 0}건`
      )
      .join("\n\n")

    return {
      success: true,
      display: `검색 결과 (총 ${result.total}명 중 상위 ${Math.min(5, result.clients.length)}명):\n\n${clientList}`,
      data: result.clients,
    }
  } catch (error) {
    return {
      success: false,
      display: "대상자 검색 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 서비스 이력 조회 ───────────────────────────────────────────────────

export const SERVICE_HISTORY_DECLARATION: AgentToolDeclaration = {
  name: "get_client_service_history",
  description:
    "특정 대상자의 전체 서비스 이력(신청서, 일정, 서비스 로그)을 조회합니다. 대상자 ID가 필요하므로 먼저 search_clients로 대상자를 검색하세요.",
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "대상자의 UUID (search_clients 결과에서 가져옵니다)",
      },
    },
    required: ["client_id"],
  },
}

export const serviceHistoryTool: AgentToolImplementation = async (args) => {
  const clientId = String(args.client_id || "")

  try {
    const [clientResult, historyResult] = await Promise.all([
      getClientById(clientId),
      getClientHistory(clientId),
    ])

    const clientName = clientResult.client?.name || "해당 대상자"

    if (!historyResult.success || !historyResult.history || historyResult.history.length === 0) {
      return {
        success: false,
        display: `**${clientName}**의 서비스 이력이 없습니다.`,
        error: historyResult.error,
      }
    }

    const typeLabel: Record<string, string> = {
      application: "📋 신청서",
      schedule: "📅 일정",
      service_log: "📝 서비스 로그",
    }

    const historyText = historyResult.history
      .slice(0, 10)
      .map(
        (h) =>
          `- ${typeLabel[h.type] || h.type} **${h.title}** (${h.date.slice(0, 10)})` +
          (h.status ? ` | 상태: ${h.status}` : "") +
          (h.description ? `\n  ${h.description}` : "")
      )
      .join("\n")

    return {
      success: true,
      display: `**${clientName}** 서비스 이력 (최근 ${Math.min(10, historyResult.history.length)}건 / 전체 ${historyResult.history.length}건):\n\n${historyText}`,
      data: historyResult.history,
    }
  } catch (error) {
    return {
      success: false,
      display: "서비스 이력 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 3: 신청 현황 확인 ─────────────────────────────────────────────────────

export const APPLICATION_STATUS_DECLARATION: AgentToolDeclaration = {
  name: "get_client_application_status",
  description:
    "특정 대상자의 신청서 현황(접수/진행중/완료 상태)을 조회합니다. 대상자 ID가 필요합니다.",
  parameters: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "대상자의 UUID",
      },
    },
    required: ["client_id"],
  },
}

export const applicationStatusTool: AgentToolImplementation = async (args) => {
  const clientId = String(args.client_id || "")

  try {
    const [clientResult, historyResult] = await Promise.all([
      getClientById(clientId),
      getClientHistory(clientId),
    ])

    const clientName = clientResult.client?.name || "해당 대상자"

    if (!historyResult.success) {
      return {
        success: false,
        display: "신청 현황 조회 중 오류가 발생했습니다.",
        error: historyResult.error,
      }
    }

    const applications = (historyResult.history || []).filter((h) => h.type === "application")

    if (applications.length === 0) {
      return {
        success: true,
        display: `**${clientName}**의 등록된 신청서가 없습니다.`,
      }
    }

    const statusLabel: Record<string, string> = {
      received: "🟡 접수",
      in_progress: "🔵 진행중",
      completed: "🟢 완료",
      cancelled: "⚫ 취소",
      pending: "⚪ 대기",
    }

    const statusSummary = applications
      .slice(0, 8)
      .map(
        (a) =>
          `- ${statusLabel[a.status || ""] || a.status || "접수"} **${a.title}** | ${a.date.slice(0, 10)}` +
          (a.category ? ` | 분류: ${a.category}` : "")
      )
      .join("\n")

    return {
      success: true,
      display: `**${clientName}** 신청 현황 (총 ${applications.length}건):\n\n${statusSummary}`,
      data: applications,
    }
  } catch (error) {
    return {
      success: false,
      display: "신청 현황 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 4: 대상자 신규 등록 ────────────────────────────────────────────────────

export const CREATE_CLIENT_DECLARATION: AgentToolDeclaration = {
  name: "create_client_record",
  description:
    "새 대상자(클라이언트)를 시스템에 등록합니다. 이름은 필수이며, 생년월일·장애유형·연락처·주소를 함께 입력할 수 있습니다.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "대상자 이름 (필수)",
      },
      birth_date: {
        type: "string",
        description: "생년월일 (YYYY-MM-DD 형식, 예: '1985-03-15')",
      },
      disability_type: {
        type: "string",
        description: "장애유형 (예: '지체장애', '시각장애', '청각장애', '뇌병변장애')",
      },
      contact: {
        type: "string",
        description: "연락처 (예: '010-1234-5678')",
      },
      address: {
        type: "string",
        description: "주소",
      },
    },
    required: ["name"],
  },
}

export const createClientTool: AgentToolImplementation = async (args) => {
  const name = String(args.name || "").trim()
  if (!name) {
    return { success: false, display: "대상자 이름은 필수 입력 항목입니다." }
  }

  try {
    const clientData: Omit<Client, "id" | "created_at" | "updated_at"> = {
      name,
      birth_date: args.birth_date ? String(args.birth_date) : null,
      disability_type: args.disability_type ? String(args.disability_type) : null,
      contact: args.contact ? String(args.contact) : null,
      address: args.address ? String(args.address) : null,
      disability_cause: null,
      disability_grade: null,
      disability_onset_date: null,
      economic_status: null,
      gender: null,
      guardian_contact: null,
      has_elevator: null,
      housing_type: null,
      obstacles: null,
      registration_number: null,
    }

    const result = await createClientRecord(clientData)

    if (!result.success || !result.client) {
      return {
        success: false,
        display: `대상자 등록에 실패했습니다: ${result.error || "알 수 없는 오류"}`,
        error: result.error,
      }
    }

    const c = result.client
    return {
      success: true,
      display:
        `✅ **${c.name}** 대상자가 성공적으로 등록되었습니다.\n\n` +
        `- ID: \`${c.id.slice(0, 8)}...\`\n` +
        `- 생년월일: ${c.birth_date || "미입력"}\n` +
        `- 장애유형: ${c.disability_type || "미입력"}\n` +
        `- 연락처: ${c.contact || "미입력"}`,
      data: c,
    }
  } catch (error) {
    return {
      success: false,
      display: "대상자 등록 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 5: 전체 대상자 목록 조회 ──────────────────────────────────────────────

export const GET_ALL_CLIENTS_DECLARATION: AgentToolDeclaration = {
  name: "get_all_clients",
  description:
    "전체 대상자 목록을 조회합니다. 검색어 없이 모든 대상자를 확인하거나 특정 장애유형 대상자만 필터링할 때 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      disability_type: {
        type: "string",
        description: "선택 사항: 장애유형 필터 (예: '지체장애', '시각장애')",
      },
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 20, 최대: 50)",
      },
    },
  },
}

export const getAllClientsTool: AgentToolImplementation = async (args) => {
  const disability_type = args.disability_type ? String(args.disability_type) : undefined
  const limit = Math.min(Number(args.limit) || 20, 50)

  try {
    const result = await searchClients({ query: "", disability_type, limit })

    if (!result.success || !result.clients || result.clients.length === 0) {
      return {
        success: true,
        display: disability_type
          ? `장애유형 '${disability_type}' 대상자가 없습니다.`
          : "등록된 대상자가 없습니다.",
      }
    }

    const clientList = result.clients
      .map(
        (c, i) =>
          `${i + 1}. **${c.name}** | ${c.disability_type || "미등록"} | ${c.birth_date || "생년월일 미등록"}`
      )
      .join("\n")

    return {
      success: true,
      display: `대상자 목록 (총 ${result.total}명 중 ${result.clients.length}명 표시):\n\n${clientList}`,
      data: result.clients,
    }
  } catch (error) {
    return {
      success: false,
      display: "대상자 목록 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
