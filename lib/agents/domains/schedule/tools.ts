// lib/agents/domains/schedule/tools.ts
// Schedule 도메인 Sub-Agent 도구 구현
// 기존 schedule-actions.ts Server Action을 래핑

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { getSchedules } from "@/actions/schedule-actions"
import { format, addDays, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

const SCHEDULE_TYPE_LABEL: Record<string, string> = {
  visit: "방문",
  consult: "상담",
  assessment: "평가",
  delivery: "배송",
  pickup: "수거",
  exhibition: "견학",
  education: "교육",
  custom_make: "맞춤제작",
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "예정",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
}

// ── 도구 1: 오늘 일정 조회 ─────────────────────────────────────────────────────

export const TODAY_SCHEDULE_DECLARATION: AgentToolDeclaration = {
  name: "get_today_schedules",
  description:
    "오늘 날짜의 일정을 조회합니다. '오늘 일정', '오늘 뭐해' 등의 질문에 사용하세요.",
  parameters: {
    type: "object",
    properties: {},
  },
}

export const todayScheduleTool: AgentToolImplementation = async () => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const todayStr = format(now, "yyyy-MM-dd")

    const result = await getSchedules(year, month)

    if (!result.success || !result.data) {
      return {
        success: false,
        display: "일정 조회 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const todaySchedules = result.data.filter((s) => s.scheduled_date === todayStr)

    if (todaySchedules.length === 0) {
      return {
        success: true,
        display: `오늘(${format(now, "M월 d일", { locale: ko })}) 예정된 일정이 없습니다.`,
      }
    }

    const scheduleList = todaySchedules
      .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""))
      .map((s) => {
        const time = s.scheduled_time ? s.scheduled_time.slice(0, 5) : "시간 미정"
        const type = SCHEDULE_TYPE_LABEL[s.schedule_type] || s.schedule_type
        const status = STATUS_LABEL[s.status] || s.status
        const location = s.address ? ` | 📍 ${s.address}` : ""
        const notes = s.notes ? `\n   메모: ${s.notes}` : ""
        return `- **${time}** [${type}] ${status}${location}${notes}`
      })
      .join("\n")

    return {
      success: true,
      display: `오늘(${format(now, "M월 d일(E)", { locale: ko })}) 일정 ${todaySchedules.length}건:\n\n${scheduleList}`,
      data: todaySchedules,
    }
  } catch (error) {
    return {
      success: false,
      display: "일정 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 이번 주 일정 조회 ──────────────────────────────────────────────────

export const WEEK_SCHEDULE_DECLARATION: AgentToolDeclaration = {
  name: "get_week_schedules",
  description:
    "이번 주 또는 향후 7일간의 일정을 조회합니다. '이번 주 일정', '다음 일정' 등의 질문에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      days_ahead: {
        type: "number",
        description: "조회할 일수 (기본값: 7일, 최대 14일)",
      },
    },
  },
}

export const weekScheduleTool: AgentToolImplementation = async (args) => {
  try {
    const daysAhead = Math.min(Number(args.days_ahead) || 7, 14)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const todayStr = format(now, "yyyy-MM-dd")
    const endStr = format(addDays(now, daysAhead), "yyyy-MM-dd")

    const result = await getSchedules(year, month)

    if (!result.success || !result.data) {
      return {
        success: false,
        display: "일정 조회 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const weekSchedules = result.data.filter(
      (s) => s.scheduled_date >= todayStr && s.scheduled_date <= endStr
    )

    if (weekSchedules.length === 0) {
      return {
        success: true,
        display: `향후 ${daysAhead}일간 예정된 일정이 없습니다.`,
      }
    }

    // 날짜별 그룹핑
    const grouped: Record<string, typeof weekSchedules> = {}
    for (const s of weekSchedules) {
      if (!grouped[s.scheduled_date]) grouped[s.scheduled_date] = []
      grouped[s.scheduled_date].push(s)
    }

    const groupedText = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, schedules]) => {
        const dateObj = parseISO(date)
        const dateLabel = format(dateObj, "M월 d일(E)", { locale: ko })
        const items = schedules
          .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""))
          .map((s) => {
            const time = s.scheduled_time ? s.scheduled_time.slice(0, 5) : "시간 미정"
            const type = SCHEDULE_TYPE_LABEL[s.schedule_type] || s.schedule_type
            return `  - ${time} [${type}]${s.address ? ` ${s.address}` : ""}`
          })
          .join("\n")
        return `**${dateLabel}**\n${items}`
      })
      .join("\n\n")

    return {
      success: true,
      display: `향후 ${daysAhead}일간 일정 (총 ${weekSchedules.length}건):\n\n${groupedText}`,
      data: weekSchedules,
    }
  } catch (error) {
    return {
      success: false,
      display: "일정 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
