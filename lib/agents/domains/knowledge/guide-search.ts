// lib/agents/domains/knowledge/guide-search.ts
// 2026년 보조기기센터 사업안내 문서 직접 검색 엔진
// 벡터화 없이 섹션 파싱 + 키워드 스코어링으로 작동

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { getGeminiModel } from "@/lib/gemini/client"

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface DocumentSection {
  title: string      // 섹션 제목 (헤더 텍스트)
  content: string    // 섹션 내용
  level: number      // 헤더 레벨 (1=# 2=## 3=### ...)
  path: string[]     // 상위 헤더 경로 (breadcrumb)
}

// ── 문서 경로 설정 ────────────────────────────────────────────────────────────

const GUIDE_FILE_NAME = "2026년 보조기기센터 사업안내(최종).md"
const GUIDE_FILE_PATH = join(process.cwd(), "docs", GUIDE_FILE_NAME)

// ── 마크다운 섹션 파서 ────────────────────────────────────────────────────────

export function parseMarkdownSections(markdown: string): DocumentSection[] {
  const sections: DocumentSection[] = []
  const lines = markdown.split("\n")

  let currentSection: { title: string; level: number; path: string[]; lines: string[] } | null = null
  const headerStack: Array<{ title: string; level: number }> = []

  const flushSection = () => {
    if (!currentSection) return
    const content = currentSection.lines.join("\n").trim()
    if (content.length > 20) {
      sections.push({
        title: currentSection.title,
        content,
        level: currentSection.level,
        path: currentSection.path,
      })
    }
  }

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headerMatch) {
      flushSection()

      const level = headerMatch[1].length
      const title = headerMatch[2].trim()

      // 스택에서 현재 레벨 이상 제거
      while (headerStack.length > 0 && headerStack[headerStack.length - 1].level >= level) {
        headerStack.pop()
      }
      const path = headerStack.map((h) => h.title)
      headerStack.push({ title, level })

      currentSection = { title, level, path, lines: [] }
    } else if (currentSection) {
      currentSection.lines.push(line)
    }
  }
  flushSection()

  return sections
}

// ── 키워드 스코어링 ───────────────────────────────────────────────────────────

// 한국어 불용어 (검색에서 제외)
const STOP_WORDS = new Set([
  "이", "가", "을", "를", "은", "는", "이", "가", "의", "에", "에서", "로", "으로",
  "와", "과", "도", "만", "까지", "부터", "에게", "에서", "한", "하", "수", "있",
  "및", "또", "또한", "등", "것", "그", "이", "저", "우리", "본", "해당", "각",
  "다음", "아래", "위", "같", "따라", "위한", "위해", "대한", "대해", "하여", "되어",
])

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
}

function scoreSection(section: DocumentSection, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0

  const titleLower = section.title.toLowerCase()
  const contentLower = section.content.toLowerCase()
  const pathText = section.path.join(" ").toLowerCase()
  let score = 0

  for (const token of queryTokens) {
    const lowerToken = token.toLowerCase()

    // 제목 일치: 가중치 3배
    if (titleLower.includes(lowerToken)) score += 3
    // 상위 경로 일치: 가중치 2배
    if (pathText.includes(lowerToken)) score += 2
    // 본문 내 빈도 (최대 5회 카운트)
    const regex = new RegExp(lowerToken, "g")
    const matches = (contentLower.match(regex) || []).length
    score += Math.min(matches, 5)
  }

  // 섹션이 너무 짧으면 패널티
  if (section.content.length < 100) score *= 0.5
  // 목차 섹션 패널티
  if (section.title.includes("목차") || section.title.includes("Contents")) score *= 0.1

  return score
}

// ── 문서 로드 + 캐싱 ──────────────────────────────────────────────────────────

let _cachedSections: DocumentSection[] | null = null
let _cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5분 캐싱

function loadGuideDocument(): DocumentSection[] {
  const now = Date.now()
  if (_cachedSections && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedSections
  }

  if (!existsSync(GUIDE_FILE_PATH)) {
    throw new Error(
      `사업안내 문서를 찾을 수 없습니다: ${GUIDE_FILE_NAME}\n` +
      `파일 경로: docs/${GUIDE_FILE_NAME}`
    )
  }

  const content = readFileSync(GUIDE_FILE_PATH, "utf-8")
  _cachedSections = parseMarkdownSections(content)
  _cacheTimestamp = now

  return _cachedSections
}

// ── 메인 검색 함수 ────────────────────────────────────────────────────────────

export async function searchGuideDocument(
  query: string,
  topK = 7
): Promise<{
  success: boolean
  answer?: string
  sections?: Array<{ title: string; path: string[]; snippet: string }>
  error?: string
}> {
  try {
    // 1. 문서 로드 및 섹션 파싱
    const sections = loadGuideDocument()
    if (sections.length === 0) {
      return { success: false, error: "문서 섹션을 파싱할 수 없습니다." }
    }

    // 2. 쿼리 토크나이징 + 스코어링
    const queryTokens = tokenize(query)
    const scored = sections
      .map((section) => ({ section, score: scoreSection(section, queryTokens) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    if (scored.length === 0) {
      // 키워드 매칭 없으면 전체 문서 범위 검색
      // 상위 레벨 섹션(## 이상)만 수집해서 제공
      const topLevelSections = sections
        .filter((s) => s.level <= 2 && s.content.length > 200)
        .slice(0, 5)

      if (topLevelSections.length === 0) {
        return {
          success: false,
          error: "관련 내용을 문서에서 찾을 수 없습니다.",
        }
      }

      scored.push(...topLevelSections.map((section) => ({ section, score: 0 })))
    }

    // 3. 컨텍스트 구성
    const contextBlocks = scored.map(({ section }, i) => {
      const pathStr = section.path.length > 0 ? `[${section.path.join(" > ")}]` : ""
      const truncatedContent =
        section.content.length > 1500
          ? section.content.slice(0, 1500) + "\n...(이하 생략)"
          : section.content
      return `### [${i + 1}] ${pathStr} ${section.title}\n${truncatedContent}`
    })

    const context = contextBlocks.join("\n\n---\n\n")

    // 4. Gemini로 답변 생성
    const model = getGeminiModel("gemini-2.0-flash")
    const systemPrompt = `당신은 강원도 보조기기센터의 업무 지침 전문 AI입니다.
아래 제공된 2026년 보조기기센터 사업안내 문서의 관련 섹션을 바탕으로 질문에 정확하고 실용적으로 답변하세요.

**답변 원칙:**
1. 문서에 명시된 내용만 답변하고, 없는 내용은 "문서에 명시되지 않았습니다"라고 안내
2. 수치, 기준, 절차 등은 정확히 인용
3. 관련 장/절 위치를 언급하면 더욱 좋음
4. 한국어로 간결하고 명확하게 답변

**참고 문서 섹션:**
${context}`

    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents: [{ role: "user" as const, parts: [{ text: query }] }],
    })

    const answer = result.response.text()

    const sectionSummaries = scored.slice(0, 3).map(({ section }) => ({
      title: section.title,
      path: section.path,
      snippet: section.content.slice(0, 120) + (section.content.length > 120 ? "..." : ""),
    }))

    return {
      success: true,
      answer,
      sections: sectionSummaries,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    }
  }
}
