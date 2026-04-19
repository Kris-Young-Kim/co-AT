// lib/agents/domains/performance/tools.ts
// Performance 도메인 Sub-Agent 도구 구현
// 실적 정리 - 월별/연도별 통계, 팀 성과, 예산 집행

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { getMonthlyStats, getYearlyStats, getStatsSummary } from "@/actions/stats-actions"
import { getTeamPerformance, getBudgetExecution } from "@/actions/advanced-dashboard-actions"
import { format } from "date-fns"

const CATEGORY_LABEL: Record<string, string> = {
  consultation: "상담",
  experience: "체험",
  custom: "맞춤제작",
  aftercare: "사후관리",
  education: "교육",
}

// ── 도구 1: 월별 실적 통계 ─────────────────────────────────────────────────────

export const MONTHLY_STATS_DECLARATION: AgentToolDeclaration = {
  name: "get_monthly_stats",
  description:
    "특정 연도의 월별 실적 통계를 조회합니다. '올해 실적', '월별 통계', '이달 실적' 등의 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      year: {
        type: "number",
        description: "조회할 연도 (기본값: 현재 연도)",
      },
    },
  },
}

export const monthlyStatsTool: AgentToolImplementation = async (args) => {
  try {
    const year = Number(args.year) || new Date().getFullYear()
    const result = await getMonthlyStats(year)

    if (!result.success || !result.stats || result.stats.length === 0) {
      return {
        success: false,
        display: `${year}년 통계 데이터가 없습니다.`,
        error: result.error,
      }
    }

    // 데이터가 있는 월만 표시
    const activeMonths = result.stats.filter((s) => s.total > 0)

    if (activeMonths.length === 0) {
      return {
        success: true,
        display: `${year}년에 등록된 실적이 없습니다.`,
      }
    }

    const yearTotal = result.stats.reduce((sum, s) => sum + s.total, 0)

    const monthList = activeMonths
      .map((s) => {
        const bar = "█".repeat(Math.min(Math.floor(s.total / 2), 20))
        return `- **${s.monthLabel}**: ${s.total}건 ${bar}\n  상담:${s.consultation} | 체험:${s.experience} | 맞춤:${s.custom} | 사후:${s.aftercare} | 교육:${s.education}`
      })
      .join("\n")

    return {
      success: true,
      display: `**${year}년 월별 실적** (연간 합계: ${yearTotal}건)\n\n${monthList}`,
      data: result.stats,
    }
  } catch (error) {
    return {
      success: false,
      display: "월별 실적 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 2: 기간별 통계 요약 ───────────────────────────────────────────────────

export const STATS_SUMMARY_DECLARATION: AgentToolDeclaration = {
  name: "get_stats_summary",
  description:
    "특정 기간의 실적 통계 요약을 조회합니다. 접수 건수, 완료율, 업무별 현황을 제공합니다.",
  parameters: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "조회 시작일 (YYYY-MM-DD, 기본값: 이번 달 1일)",
      },
      end_date: {
        type: "string",
        description: "조회 종료일 (YYYY-MM-DD, 기본값: 오늘)",
      },
    },
  },
}

export const statsSummaryTool: AgentToolImplementation = async (args) => {
  try {
    const now = new Date()
    const startDate = String(args.start_date || format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd"))
    const endDate = String(args.end_date || format(now, "yyyy-MM-dd"))

    const result = await getStatsSummary(startDate, endDate)

    if (!result.success || !result.summary) {
      return {
        success: false,
        display: "통계 요약 조회 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const s = result.summary
    const completionRate = s.completionRate.toFixed(1)

    const businessLines = Object.entries(s.businessSummary)
      .map(([key, val]) => `  - ${CATEGORY_LABEL[key] || key}: ${val}건`)
      .join("\n")

    const display = [
      `**실적 요약** (${startDate} ~ ${endDate})`,
      "",
      `📋 **전체 신청**: ${s.totalApplications}건`,
      `👥 **대상자 수**: ${s.totalClients}명`,
      `✅ **완료**: ${s.totalCompleted}건 (완료율 ${completionRate}%)`,
      "",
      "**업무별 현황:**",
      businessLines,
    ].join("\n")

    return {
      success: true,
      display,
      data: result.summary,
    }
  } catch (error) {
    return {
      success: false,
      display: "통계 요약 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 3: 팀 성과 지표 ──────────────────────────────────────────────────────

export const TEAM_PERFORMANCE_DECLARATION: AgentToolDeclaration = {
  name: "get_team_performance",
  description:
    "팀별 성과 지표를 조회합니다. 담당자별 신청 처리 건수, 완료율, 서비스 비용 현황을 확인할 수 있습니다.",
  parameters: {
    type: "object",
    properties: {
      year: {
        type: "number",
        description: "조회할 연도 (기본값: 현재 연도)",
      },
    },
  },
}

export const teamPerformanceTool: AgentToolImplementation = async (args) => {
  try {
    const year = Number(args.year) || new Date().getFullYear()
    const result = await getTeamPerformance(year)

    if (!result.success || !result.teams || result.teams.length === 0) {
      return {
        success: false,
        display: "팀 성과 데이터가 없습니다.",
        error: result.error,
      }
    }

    const teamLines = result.teams
      .map((t) => {
        const completionRate =
          t.applications.total > 0
            ? ((t.applications.completed / t.applications.total) * 100).toFixed(0)
            : "0"
        const cost = t.serviceLogs.totalCost
          ? `${(t.serviceLogs.totalCost / 10000).toFixed(0)}만원`
          : "0원"
        return [
          `- **${t.teamName}** (${t.staffCount}명)`,
          `  신청: ${t.applications.total}건 (완료율 ${completionRate}%) | 서비스비용: ${cost}`,
          `  일정: ${t.schedules.total}건 (완료 ${t.schedules.completed}건)`,
        ].join("\n")
      })
      .join("\n\n")

    return {
      success: true,
      display: `**${year}년 팀 성과 현황** (${result.teams.length}개 팀):\n\n${teamLines}`,
      data: result.teams,
    }
  } catch (error) {
    return {
      success: false,
      display: "팀 성과 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── 도구 4: 예산 집행 현황 ─────────────────────────────────────────────────────

export const BUDGET_EXECUTION_DECLARATION: AgentToolDeclaration = {
  name: "get_budget_execution",
  description:
    "예산 집행 현황을 조회합니다. 업무별 지출 현황과 월별 예산 집행 내역을 확인할 수 있습니다.",
  parameters: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "조회 시작일 (YYYY-MM-DD, 기본값: 올해 1월 1일)",
      },
      end_date: {
        type: "string",
        description: "조회 종료일 (YYYY-MM-DD, 기본값: 오늘)",
      },
    },
  },
}

export const budgetExecutionTool: AgentToolImplementation = async (args) => {
  try {
    const now = new Date()
    const startDate = args.start_date ? String(args.start_date) : `${now.getFullYear()}-01-01`
    const endDate = args.end_date ? String(args.end_date) : format(now, "yyyy-MM-dd")

    const result = await getBudgetExecution(startDate, endDate)

    if (!result.success || !result.budget) {
      return {
        success: false,
        display: "예산 집행 현황 조회 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const b = result.budget
    const totalSpent = (b.total.spent / 10000).toFixed(0)
    const utilizationText = b.total.utilizationRate != null
      ? ` (집행률 ${b.total.utilizationRate.toFixed(1)}%)`
      : ""

    // 카테고리별 상위 5개
    const categoryLines = b.byCategory
      .sort((a, v) => v.spent - a.spent)
      .slice(0, 5)
      .map((c) => `  - ${c.category}: ${(c.spent / 10000).toFixed(0)}만원 (${c.count}건)`)
      .join("\n")

    const display = [
      `**예산 집행 현황** (${startDate} ~ ${endDate})`,
      "",
      `💰 **총 지출**: ${totalSpent}만원${utilizationText}`,
      "",
      "**업무별 집행 (상위 5개):**",
      categoryLines,
    ].join("\n")

    return {
      success: true,
      display,
      data: result.budget,
    }
  } catch (error) {
    return {
      success: false,
      display: "예산 집행 현황 조회 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
