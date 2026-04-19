// lib/agents/domains/document/tools.ts
// Document 도메인 Sub-Agent 도구 구현
// 기존 ai-actions.ts의 SOAP 노트 생성 기능을 래핑

import type { AgentToolDeclaration, AgentToolImplementation } from "../../types"
import { generateSoapNote } from "@/actions/ai-actions"

// ── 도구 1: SOAP 노트 생성 ─────────────────────────────────────────────────────

export const SOAP_NOTE_DECLARATION: AgentToolDeclaration = {
  name: "generate_soap_note",
  description:
    "상담 내용을 SOAP 형식(주관적/객관적/평가/계획)으로 변환합니다. 상담 노트 작성 요청이나 SOAP 노트 생성 요청에 사용하세요.",
  parameters: {
    type: "object",
    properties: {
      consultation_text: {
        type: "string",
        description: "SOAP 노트로 변환할 상담 내용 원문 (최소 50자 이상 권장)",
      },
    },
    required: ["consultation_text"],
  },
}

export const soapNoteTool: AgentToolImplementation = async (args) => {
  const text = String(args.consultation_text || "")

  if (!text || text.trim().length < 10) {
    return {
      success: false,
      display: "SOAP 노트를 생성하려면 상담 내용을 입력해주세요 (최소 10자 이상).",
    }
  }

  try {
    const result = await generateSoapNote(text)

    if (!result.success || !result.soapNote) {
      return {
        success: false,
        display: result.error || "SOAP 노트 생성 중 오류가 발생했습니다.",
        error: result.error,
      }
    }

    const { subjective, objective, assessment, plan } = result.soapNote

    const soapDisplay = [
      "## SOAP 노트",
      "",
      "### S (주관적 정보, Subjective)",
      subjective,
      "",
      "### O (객관적 정보, Objective)",
      objective,
      "",
      "### A (평가, Assessment)",
      assessment,
      "",
      "### P (계획, Plan)",
      plan,
    ].join("\n")

    return {
      success: true,
      display: soapDisplay,
      data: result.soapNote,
    }
  } catch (error) {
    return {
      success: false,
      display: "SOAP 노트 생성 중 오류가 발생했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
