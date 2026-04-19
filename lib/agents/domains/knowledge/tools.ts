// lib/agents/domains/knowledge/tools.ts
// Knowledge 도메인 Sub-Agent 도구 구현
// 2026년 보조기기센터 사업안내 문서를 직접 파싱하여 검색

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { searchGuideDocument } from "./guide-search"

// ── 도구 1: 사업안내 문서 검색 ────────────────────────────────────────────────

export const GUIDE_SEARCH_DECLARATION: AgentToolDeclaration = {
  name: "search_business_guide",
  description:
    "2026년 보조기기센터 사업안내 문서에서 업무 지침, 기준, 절차를 검색합니다. " +
    "대여 기간/조건, 맞춤제작 지원 금액, 수리 기준, 인력 자격, 예산 집행 기준, " +
    "신청 절차, 복무 규정 등 센터 운영 전반에 관한 질문에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "검색할 질문 또는 키워드. 구체적일수록 정확합니다. " +
          "(예: '대여 기간 몇 개월', '맞춤제작 지원 상한액', '팀장 자격요건', '예산 집행 기준', " +
          "'배우자 출산휴가 일수', '보조기기 수리 비용 한도')",
      },
    },
    required: ["query"],
  },
}

export const guideSearchTool: AgentToolImplementation = async (args) => {
  const query = String(args.query || "").trim()
  if (!query) {
    return { success: false, display: "검색어를 입력해주세요." }
  }

  try {
    const result = await searchGuideDocument(query, 7)

    if (!result.success || !result.answer) {
      if (result.error?.includes("찾을 수 없습니다")) {
        return {
          success: false,
          display: `"${query}"에 관한 내용을 사업안내 문서에서 찾을 수 없습니다. 더 구체적인 키워드로 검색해보세요.`,
          error: result.error,
        }
      }
      if (result.error?.includes("사업안내 문서를 찾을 수 없습니다")) {
        return {
          success: false,
          display: "사업안내 문서 파일이 없습니다. docs/ 폴더에 문서가 있는지 확인해주세요.",
          error: result.error,
        }
      }
      return {
        success: false,
        display: "문서 검색 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    // 참고 섹션 포맷팅
    const sourcesText =
      result.sections && result.sections.length > 0
        ? "\n\n**📖 참고 섹션 (2026년 보조기기센터 사업안내):**\n" +
          result.sections
            .map((s) => {
              const pathStr = s.path.length > 0 ? `${s.path.join(" > ")} > ` : ""
              return `- **${pathStr}${s.title}**`
            })
            .join("\n")
        : ""

    return {
      success: true,
      display: `${result.answer}${sourcesText}`,
      data: { answer: result.answer, sections: result.sections },
    }
  } catch (error) {
    return {
      success: false,
      display: "문서 검색 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
