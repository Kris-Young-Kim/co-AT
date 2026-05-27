"use server";

import { getGeminiClient } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions";
import {
  chunkMarkdownBySections,
  chunkTextBySize,
  classifyCategory,
} from "@/lib/utils/text-chunker";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { PDFParse } from "pdf-parse";

/**
 * 규정 문서 청크 정보
 */
export interface RegulationChunk {
  id: string;
  title: string;
  content: string;
  section?: string;
  category?: string;
  similarity?: number;
}

/**
 * RAG 답변 결과
 */
export interface RAGAnswer {
  answer: string;
  sources: RegulationChunk[];
  confidence: number;
}

/**
 * Gemini Embedding API로 텍스트를 벡터화
 * 참고: Google Generative AI SDK의 embedContent 메서드 사용
 */
async function getEmbedding(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  try {
    const client = getGeminiClient();

    // Gemini Embedding API 사용
    // 모델: text-embedding-004 또는 gemini-embedding-001
    const model = client.getGenerativeModel({
      model: "models/text-embedding-004",
    });

    // @ts-expect-error - Gemini API 타입 추론 이슈
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType,
    });

    return result.embedding.values as number[];
  } catch (error) {
    console.error("[RAG Actions] Embedding 생성 실패:", error);

    // 에러가 발생하면 간단한 해시 기반 벡터 생성 (임시 방편)
    // 실제 운영 환경에서는 반드시 Gemini Embedding API를 사용해야 합니다
    console.warn(
      "[RAG Actions] Embedding API 실패, 해시 기반 벡터 사용 (임시)"
    );
    return generateHashBasedVector(text);
  }
}

/**
 * 임시 해시 기반 벡터 생성 (개발/테스트용)
 * 실제 운영 환경에서는 Gemini Embedding API를 사용해야 합니다
 */
function generateHashBasedVector(
  text: string,
  dimensions: number = 768
): number[] {
  const vector: number[] = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  words.forEach((word, wordIndex) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
    }

    const index = Math.abs(hash) % dimensions;
    vector[index] += 1 / (wordIndex + 1); // 위치 가중치
  });

  // 정규화
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => (magnitude > 0 ? val / magnitude : 0));
}

/**
 * 코사인 유사도 계산
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("벡터 차원이 일치하지 않습니다");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** 파일에서 텍스트 추출 (PDF/MD/TXT) */
async function extractTextFromFile(
  filePath: string,
  buffer?: Buffer
): Promise<{ content: string; title: string }> {
  const baseName = filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") || "문서";
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const data = buffer || readFileSync(filePath);
    const parser = new PDFParse({ data: Buffer.isBuffer(data) ? data : Buffer.from(data) });
    try {
      const result = await parser.getText();
      await parser.destroy();
      return { content: result.text, title: baseName };
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (ext === ".md" || ext === ".txt") {
    const content = buffer
      ? buffer.toString("utf-8")
      : readFileSync(filePath, "utf-8");
    return { content, title: baseName };
  }

  throw new Error(`지원하지 않는 형식: ${ext}`);
}

/**
 * docs/ 및 docs/regulations/ 폴더의 문서(PDF, MD, TXT)를 벡터화하여 저장
 */
export async function embedRegulations(options?: {
  filePaths?: string[];
}): Promise<{
  success: boolean;
  message: string;
  chunksCount?: number;
  error?: string;
}> {
  try {
    console.log("[RAG Actions] 규정 문서 벡터화 시작");

    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, message: "권한이 없습니다" };
    }

    const docsDir = join(process.cwd(), "docs");
    const regulationsDir = join(docsDir, "regulations");
    const allowedExt = [".pdf", ".md", ".txt"];

    let filesToProcess: Array<{ path: string; fullPath: string; buffer?: Buffer }> = [];

    if (options?.filePaths?.length) {
      for (const p of options.filePaths) {
        const full = p.startsWith("regulations/")
          ? join(regulationsDir, p.replace("regulations/", ""))
          : join(docsDir, p);
        if (existsSync(full)) {
          const ext = full.toLowerCase().slice(full.lastIndexOf("."));
          if (allowedExt.includes(ext))
            filesToProcess.push({ path: p, fullPath: full });
        }
      }
    }

    if (filesToProcess.length === 0) {
      // 기본: docs/ 및 docs/regulations/ 전체 스캔
      const scan = (dir: string, prefix: string) => {
        if (!existsSync(dir)) return;
        try {
          const entries = readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            if (e.isFile()) {
              const ext = e.name.toLowerCase().slice(e.name.lastIndexOf("."));
              if (allowedExt.includes(ext))
                filesToProcess.push({
                  path: prefix ? `${prefix}/${e.name}` : e.name,
                  fullPath: join(dir, e.name),
                });
            }
          }
        } catch {}
      };
      scan(docsDir, "");
      scan(regulationsDir, "regulations");
    }

    // Storage에서 추가 파일 가져오기 (선택적)
    try {
      const supabase = createAdminClient();
      const { data: list } = await supabase.storage
        .from("regulations")
        .list("regulations", { limit: 50 });
      if (list) {
        for (const f of list) {
          if (f.name && allowedExt.some((e) => f.name!.toLowerCase().endsWith(e))) {
            const { data } = await supabase.storage
              .from("regulations")
              .download(`regulations/${f.name}`);
            if (data) {
              const buf = Buffer.from(await data.arrayBuffer());
              filesToProcess.push({
                path: `regulations/${f.name}`,
                fullPath: "",
                buffer: buf,
              });
            }
          }
        }
      }
    } catch {
      // 버킷 없으면 무시
    }

    const allChunks: Array<{
      title: string
      content: string
      section?: string
      chunkIndex: number
      source_file?: string
    }> = []
    for (const file of filesToProcess) {
      try {
        const { content, title } = await extractTextFromFile(
          file.fullPath || file.path,
          file.buffer
        );
        const trimmed = content.trim();
        if (!trimmed) continue;

        const chs =
          file.path.endsWith(".md") && trimmed.includes("#")
            ? chunkMarkdownBySections(trimmed, 200, 1000)
            : chunkTextBySize(trimmed, title, 200, 1000);

        const srcName = file.path.split("/").pop() || file.path
        for (let i = 0; i < chs.length; i++) {
          allChunks.push({
            title: chs[i].title,
            content: chs[i].content,
            section: chs[i].section,
            chunkIndex: allChunks.length + i,
            source_file: srcName,
          })
        }
      } catch (err) {
        console.error(`[RAG Actions] 파일 처리 실패 ${file.path}:`, err);
      }
    }

    const chunks = allChunks;
    console.log(`[RAG Actions] ${chunks.length}개의 청크 생성`);

    const supabase = await createClient();

    // 기존 데이터 삭제 (재생성 시)
    await supabase
      .from("regulations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // 각 청크를 벡터화하여 저장
    let successCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // 벡터 생성
        const embedding = await getEmbedding(chunk.content);

        // 카테고리 자동 분류
        const category = classifyCategory(chunk.title, chunk.content);

        // 데이터베이스에 저장
        // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
        const { error } = await supabase.from("regulations").insert({
          title: chunk.title,
          content: chunk.content,
          section: chunk.section,
          category,
          embedding: embedding,
          embedding_model: "text-embedding-004",
          chunk_index: chunk.chunkIndex,
          chunk_size: chunk.content.length,
          source_file: chunk.source_file,
        });

        if (error) {
          console.error(`[RAG Actions] 청크 ${i} 저장 실패:`, error);
          continue;
        }

        successCount++;

        // 진행 상황 로그 (10개마다)
        if ((i + 1) % 10 === 0) {
          console.log(`[RAG Actions] 진행: ${i + 1}/${chunks.length}`);
        }
      } catch (error) {
        console.error(`[RAG Actions] 청크 ${i} 처리 실패:`, error);
        continue;
      }
    }

    console.log(
      `[RAG Actions] 벡터화 완료: ${successCount}/${chunks.length}개 저장`
    );

    return {
      success: true,
      message: `${successCount}개의 청크를 벡터화하여 저장했습니다`,
      chunksCount: successCount,
    };
  } catch (error) {
    console.error("[RAG Actions] 규정 문서 벡터화 실패:", error);
    return {
      success: false,
      message: "규정 문서 벡터화에 실패했습니다",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 질문과 유사한 규정 청크 검색
 */
export async function searchRegulations(
  query: string,
  limit: number = 5
): Promise<{
  success: boolean;
  chunks?: RegulationChunk[];
  error?: string;
}> {
  try {
    console.log("[RAG Actions] 규정 검색 시작:", { query, limit });

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" };
    }

    // 질문을 벡터화 (RETRIEVAL_QUERY 타입 사용)
    const queryEmbedding = await getEmbedding(query, "RETRIEVAL_QUERY");

    // 모든 규정 청크 가져오기
    const supabase = await createClient();
    const { data: regulations, error } = await supabase
      .from("regulations")
      .select("id, title, content, section, category, embedding");

    if (error) {
      console.error("[RAG Actions] 규정 조회 실패:", error);

      // 테이블이 없는 경우 명확한 안내 메시지
      if (error.code === "PGRST205") {
        return {
          success: false,
          error:
            "regulations 테이블이 존재하지 않습니다. 먼저 마이그레이션을 실행해주세요: migrations/012_create_regulations.sql",
        };
      }

      return {
        success: false,
        error: `규정 조회에 실패했습니다: ${error.message}`,
      };
    }

    if (!regulations || regulations.length === 0) {
      return {
        success: false,
        error: "저장된 규정이 없습니다. 먼저 벡터화를 실행해주세요.",
      };
    }

    // 유사도 계산
    const similarities = (regulations || [])
      .map((reg: any) => {
        const embedding = reg.embedding as number[];
        if (!embedding || embedding.length === 0) {
          return null;
        }

        const similarity = cosineSimilarity(queryEmbedding, embedding);
        return {
          id: reg.id,
          title: reg.title,
          content: reg.content,
          section: reg.section || undefined,
          category: reg.category || undefined,
          similarity,
        };
      })
      .filter(
        (item: any): item is RegulationChunk & { similarity: number } =>
          item !== null
      )
      .sort((a: any, b: any) => (b?.similarity || 0) - (a?.similarity || 0))
      .slice(0, limit);

    console.log(`[RAG Actions] ${similarities.length}개의 유사 청크 발견`);

    return {
      success: true,
      chunks: similarities as RegulationChunk[],
    };
  } catch (error) {
    console.error("[RAG Actions] 규정 검색 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * RAG를 활용하여 질문에 답변 생성
 */
export async function generateRegulationAnswer(query: string): Promise<{
  success: boolean;
  answer?: RAGAnswer;
  error?: string;
}> {
  try {
    console.log("[RAG Actions] RAG 답변 생성 시작:", { query });

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" };
    }

    // 유사한 규정 청크 검색
    const searchResult = await searchRegulations(query, 5);
    if (
      !searchResult.success ||
      !searchResult.chunks ||
      searchResult.chunks.length === 0
    ) {
      return {
        success: false,
        error: searchResult.error || "관련 규정을 찾을 수 없습니다",
      };
    }

    // 컨텍스트 구성
    const context = searchResult.chunks
      .map((chunk, index) => {
        return `[참고 ${index + 1}] ${chunk.title}\n${chunk.content}`;
      })
      .join("\n\n");

    // Gemini로 답변 생성
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `당신은 보조기기센터의 운영 지침서 전문가입니다. 
다음 규정 문서를 참고하여 사용자의 질문에 정확하고 명확하게 답변해주세요.

규정 문서:
${context}

답변 시 다음 사항을 준수해주세요:
1. 규정 문서에 명시된 내용을 정확히 인용하여 답변
2. 불확실한 내용은 추측하지 말고 "규정 문서에 명시되지 않았습니다"라고 답변
3. 한국어로 자연스럽고 이해하기 쉽게 답변
4. 필요시 관련 섹션을 언급`;

    const prompt = `${systemPrompt}\n\n질문: ${query}\n\n답변:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    // 평균 유사도 계산 (신뢰도)
    const avgSimilarity =
      searchResult.chunks.reduce(
        (sum, chunk) => sum + (chunk.similarity || 0),
        0
      ) / searchResult.chunks.length;

    console.log("[RAG Actions] RAG 답변 생성 완료");

    return {
      success: true,
      answer: {
        answer,
        sources: searchResult.chunks,
        confidence: avgSimilarity,
      },
    };
  } catch (error) {
    console.error("[RAG Actions] RAG 답변 생성 실패:", error);

    // 에러 타입별 처리
    if (error instanceof Error) {
      // API 키 관련 에러
      if (
        error.message.includes("GOOGLE_AI_API_KEY") ||
        error.message.includes("API key not valid") ||
        error.message.includes("API_KEY_INVALID")
      ) {
        return {
          success: false,
          error:
            "Google AI API 키가 유효하지 않습니다. .env.local 파일의 GOOGLE_AI_API_KEY를 확인하고 개발 서버를 재시작해주세요.",
        };
      }

      // API 키 미설정 에러
      if (error.message.includes("환경 변수가 설정되지 않았습니다")) {
        return {
          success: false,
          error:
            "Google AI API 키가 설정되지 않았습니다. .env.local 파일에 GOOGLE_AI_API_KEY를 추가하고 개발 서버를 재시작해주세요.",
        };
      }

      return {
        success: false,
        error: `답변 생성 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    return {
      success: false,
      error: "예상치 못한 오류가 발생했습니다",
    };
  }
}
