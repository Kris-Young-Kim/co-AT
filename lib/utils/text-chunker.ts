/**
 * 텍스트 청크 분할 유틸리티
 * 문서를 의미 있는 단위로 분할하여 RAG에 활용
 */

export interface TextChunk {
  title: string;
  content: string;
  section?: string;
  category?: string;
  chunkIndex: number;
}

/**
 * 마크다운 문서를 섹션별로 분할
 */
export function chunkMarkdownBySections(
  content: string,
  minChunkSize: number = 200,
  maxChunkSize: number = 1000,
): TextChunk[] {
  const chunks: TextChunk[] = [];

  // 섹션 구분자로 분할 (##, ###, [제X장] 등)
  const sectionRegex = /(^#{1,3}\s+.+$|^\[제\d+장\].+$|^[IVX]+\.\s+.+$)/gm;
  const lines = content.split("\n");

  let currentSection = "";
  let currentTitle = "";
  let currentContent: string[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 섹션 헤더 감지
    if (sectionRegex.test(line) || line.match(/^[IVX]+\.\s+/)) {
      // 이전 청크 저장
      if (currentContent.length > 0) {
        const content = currentContent.join("\n").trim();
        if (content.length >= minChunkSize) {
          chunks.push({
            title: currentTitle || currentSection || "일반",
            content,
            section: currentSection,
            chunkIndex: chunkIndex++,
          });
        }
      }

      // 새 섹션 시작
      currentSection = extractSection(line);
      currentTitle = extractTitle(line);
      currentContent = [line];
    } else {
      currentContent.push(line);

      // 최대 크기 초과 시 청크 분할
      const currentText = currentContent.join("\n");
      if (currentText.length > maxChunkSize) {
        // 문장 단위로 분할
        const sentences = currentText.split(/[.!?]\s+/);
        let tempContent: string[] = [];

        for (const sentence of sentences) {
          tempContent.push(sentence);
          const tempText = tempContent.join(" ");

          if (tempText.length >= maxChunkSize) {
            chunks.push({
              title: currentTitle || currentSection || "일반",
              content: tempContent.join(" ").trim(),
              section: currentSection,
              chunkIndex: chunkIndex++,
            });
            tempContent = [];
          }
        }

        currentContent = tempContent;
      }
    }
  }

  // 마지막 청크 저장
  if (currentContent.length > 0) {
    const content = currentContent.join("\n").trim();
    if (content.length >= minChunkSize) {
      chunks.push({
        title: currentTitle || currentSection || "일반",
        content,
        section: currentSection,
        chunkIndex: chunkIndex++,
      });
    }
  }

  return chunks;
}

/**
 * 섹션 정보 추출 (예: "제2장", "제3장")
 */
function extractSection(line: string): string {
  const match = line.match(/\[(제\d+장)\]/);
  if (match) return match[1];

  const chapterMatch = line.match(/제(\d+)장/);
  if (chapterMatch) return `제${chapterMatch[1]}장`;

  return "";
}

/**
 * 제목 추출
 */
function extractTitle(line: string): string {
  // 마크다운 헤더 제거
  let title = line.replace(/^#{1,6}\s+/, "").trim();

  // 섹션 표기 제거
  title = title.replace(/\[제\d+장\]\s*/, "");

  // 로마숫자 제거
  title = title.replace(/^[IVX]+\.\s+/, "");

  return title || "일반";
}

/**
 * 일반 텍스트를 고정 크기로 분할 (MD/TXT, 섹션 구분 없을 때)
 */
export function chunkTextBySize(
  content: string,
  sourceTitle: string,
  minChunkSize: number = 200,
  maxChunkSize: number = 1000
): TextChunk[] {
  const trimmed = content.trim().replace(/\r\n/g, "\n")
  if (!trimmed) return []

  const chunks: TextChunk[] = []
  let start = 0
  let chunkIndex = 0

  while (start < trimmed.length) {
    let end = Math.min(start + maxChunkSize, trimmed.length)
    let slice = trimmed.slice(start, end)

    if (end < trimmed.length) {
      const lastNewline = slice.lastIndexOf("\n")
      const lastSentence = Math.max(
        slice.lastIndexOf("."),
        slice.lastIndexOf("?"),
        slice.lastIndexOf("!")
      )
      const breakAt = Math.max(lastNewline, lastSentence, maxChunkSize / 2)
      if (breakAt > minChunkSize) {
        slice = trimmed.slice(start, start + breakAt + 1)
        end = start + breakAt + 1
      }
    }

    if (slice.trim().length >= minChunkSize) {
      chunks.push({
        title: sourceTitle,
        content: slice.trim(),
        section: undefined,
        chunkIndex: chunkIndex++,
      })
    }

    start = end
  }

  return chunks
}

/**
 * 카테고리 자동 분류
 */
export function classifyCategory(title: string, content: string): string {
  const text = (title + " " + content).toLowerCase();

  if (text.includes("대여") || text.includes("rental")) return "대여";
  if (text.includes("수리") || text.includes("repair")) return "수리";
  if (text.includes("맞춤") || text.includes("제작") || text.includes("custom"))
    return "맞춤제작";
  if (text.includes("평가") || text.includes("assessment")) return "평가";
  if (text.includes("예산") || text.includes("budget")) return "예산";
  if (text.includes("인력") || text.includes("staff") || text.includes("인원"))
    return "인력";
  if (text.includes("보고") || text.includes("report")) return "보고";
  if (text.includes("상담") || text.includes("consult")) return "상담";
  if (text.includes("체험") || text.includes("experience")) return "체험";
  if (text.includes("교육") || text.includes("education")) return "교육";
  if (text.includes("홍보") || text.includes("promotion")) return "홍보";

  return "일반";
}
