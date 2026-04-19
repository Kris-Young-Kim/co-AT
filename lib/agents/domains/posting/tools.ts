// lib/agents/domains/posting/tools.ts
// Posting 도메인 Sub-Agent 도구 구현
// 공개 게시 자동화 - 공지사항 조회/생성/수정

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import {
  getRecentNotices,
  getNoticesByCategory,
  createNotice,
  updateNotice,
} from "@/actions/notice-actions"

const CATEGORY_LABEL: Record<string, string> = {
  notice: "공지사항",
  activity: "활동소식",
  support: "지원정보",
  case: "사례나눔",
}

// ── 도구 1: 최근 공지사항 조회 ─────────────────────────────────────────────────

export const RECENT_NOTICES_DECLARATION: AgentToolDeclaration = {
  name: "get_recent_notices",
  description:
    "최근 공지사항 목록을 조회합니다. '최근 공지', '공지사항 목록', '게시물 확인' 등의 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 5, 최대 20)",
      },
    },
  },
}

export const recentNoticesTool: AgentToolImplementation = async (args) => {
  try {
    const limit = Math.min(Number(args.limit) || 5, 20)
    const notices = await getRecentNotices(limit)

    if (!notices || notices.length === 0) {
      return { success: true, display: "등록된 공지사항이 없습니다." }
    }

    const list = notices
      .map((n, i) => {
        const category = n.category ? CATEGORY_LABEL[n.category] || n.category : "기타"
        const pinned = n.is_pinned ? " 📌" : ""
        const date = n.created_at ? n.created_at.slice(0, 10) : "날짜 미상"
        return `${i + 1}. ${pinned}[${category}] **${n.title}** (${date})\n   ID: \`${n.id.slice(0, 8)}...\``
      })
      .join("\n\n")

    return {
      success: true,
      display: `최근 공지사항 ${notices.length}건:\n\n${list}`,
      data: notices,
    }
  } catch (error) {
    return {
      success: false,
      display: "공지사항 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 카테고리별 공지사항 조회 ──────────────────────────────────────────

export const NOTICES_BY_CATEGORY_DECLARATION: AgentToolDeclaration = {
  name: "get_notices_by_category",
  description:
    "특정 카테고리의 공지사항을 조회합니다. 카테고리: notice(공지사항), activity(활동소식), support(지원정보), case(사례나눔)",
  parameters: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "카테고리 코드: notice | activity | support | case",
        enum: ["notice", "activity", "support", "case"],
      },
      limit: {
        type: "number",
        description: "조회할 최대 건수 (기본값: 10)",
      },
    },
    required: ["category"],
  },
}

export const noticesByCategoryTool: AgentToolImplementation = async (args) => {
  const category = String(args.category || "notice") as "notice" | "activity" | "support" | "case"
  const limit = Math.min(Number(args.limit) || 10, 20)

  try {
    const notices = await getNoticesByCategory(category, limit)

    if (!notices || notices.length === 0) {
      return {
        success: true,
        display: `[${CATEGORY_LABEL[category]}] 카테고리에 등록된 게시물이 없습니다.`,
      }
    }

    const list = notices
      .map((n, i) => {
        const pinned = n.is_pinned ? " 📌" : ""
        const date = n.created_at ? n.created_at.slice(0, 10) : "날짜 미상"
        return `${i + 1}.${pinned} **${n.title}** (${date})\n   ID: \`${n.id.slice(0, 8)}...\``
      })
      .join("\n\n")

    return {
      success: true,
      display: `[${CATEGORY_LABEL[category]}] 게시물 ${notices.length}건:\n\n${list}`,
      data: notices,
    }
  } catch (error) {
    return {
      success: false,
      display: "카테고리별 공지사항 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 3: 공지사항 게시 ─────────────────────────────────────────────────────

export const CREATE_NOTICE_DECLARATION: AgentToolDeclaration = {
  name: "create_notice",
  description:
    "새 공지사항을 게시합니다. 제목과 내용이 필요합니다. 카테고리는 선택 사항입니다.",
  parameters: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "공지사항 제목",
      },
      content: {
        type: "string",
        description: "공지사항 본문 내용",
      },
      category: {
        type: "string",
        description: "카테고리: notice(공지사항) | activity(활동소식) | support(지원정보) | case(사례나눔)",
        enum: ["notice", "activity", "support", "case"],
      },
      is_pinned: {
        type: "boolean",
        description: "상단 고정 여부 (기본값: false)",
      },
    },
    required: ["title", "content"],
  },
}

export const createNoticeTool: AgentToolImplementation = async (args) => {
  const title = String(args.title || "").trim()
  const content = String(args.content || "").trim()

  if (!title || !content) {
    return {
      success: false,
      display: "제목과 내용을 모두 입력해주세요.",
    }
  }

  try {
    const result = await createNotice({
      title,
      content,
      category: args.category as "notice" | "activity" | "support" | "case" | null ?? null,
      is_pinned: Boolean(args.is_pinned),
    })

    if (!result.success) {
      return {
        success: false,
        display: result.error || "공지사항 게시 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const categoryLabel = args.category ? CATEGORY_LABEL[String(args.category)] : ""
    return {
      success: true,
      display: `✅ 공지사항이 성공적으로 게시되었습니다!\n\n- 제목: **${title}**\n- 카테고리: ${categoryLabel || "미지정"}\n- 상단 고정: ${args.is_pinned ? "예" : "아니오"}\n- ID: \`${result.noticeId}\``,
      data: { noticeId: result.noticeId },
    }
  } catch (error) {
    return {
      success: false,
      display: "공지사항 게시 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 4: 공지사항 수정 ─────────────────────────────────────────────────────

export const UPDATE_NOTICE_DECLARATION: AgentToolDeclaration = {
  name: "update_notice",
  description:
    "기존 공지사항을 수정합니다. 공지사항 ID가 필요합니다. 수정할 항목만 입력하세요.",
  parameters: {
    type: "object",
    properties: {
      notice_id: {
        type: "string",
        description: "수정할 공지사항의 UUID",
      },
      title: {
        type: "string",
        description: "새 제목 (변경하지 않을 경우 생략)",
      },
      content: {
        type: "string",
        description: "새 본문 내용 (변경하지 않을 경우 생략)",
      },
      category: {
        type: "string",
        description: "새 카테고리: notice | activity | support | case",
        enum: ["notice", "activity", "support", "case"],
      },
      is_pinned: {
        type: "boolean",
        description: "상단 고정 여부",
      },
    },
    required: ["notice_id"],
  },
}

export const updateNoticeTool: AgentToolImplementation = async (args) => {
  const id = String(args.notice_id || "").trim()

  if (!id) {
    return {
      success: false,
      display: "수정할 공지사항의 ID를 입력해주세요.",
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateInput: any = { id }
    if (args.title) updateInput.title = String(args.title)
    if (args.content) updateInput.content = String(args.content)
    if (args.category) updateInput.category = String(args.category)
    if (args.is_pinned !== undefined) updateInput.is_pinned = Boolean(args.is_pinned)

    const result = await updateNotice(updateInput)

    if (!result.success) {
      return {
        success: false,
        display: result.error || "공지사항 수정 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    return {
      success: true,
      display: `✅ 공지사항(ID: \`${id.slice(0, 8)}...\`)이 성공적으로 수정되었습니다.`,
    }
  } catch (error) {
    return {
      success: false,
      display: "공지사항 수정 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
