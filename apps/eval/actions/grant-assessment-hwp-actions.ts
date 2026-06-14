"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { getGrantAssessmentById } from "@/actions/grant-assessment-actions"
import JSZip from "jszip"

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function para(text: string): string {
  return `<hml:P><hml:TEXT><hml:CHAR>${escXml(text)}</hml:CHAR></hml:TEXT></hml:P>`
}

const SCORE_LABELS = ["환경 적합성", "조작 능력", "장애 특성", "활용 계획", "기대 효과"]

function buildSection0(
  assessment: Awaited<ReturnType<typeof getGrantAssessmentById>>["assessment"] & object,
  clientName: string,
  clientBirthDate: string | null,
  disabilityType: string | null
): string {
  const lines: string[] = []

  lines.push(para("보조기기 교부사업 적합성 평가 기록지"))
  lines.push(para(`${assessment.assessment_year}년`))
  lines.push(para(""))

  lines.push(para("[ 대상자 정보 ]"))
  lines.push(para(`성명: ${clientName}`))
  lines.push(para(`생년월일: ${clientBirthDate ?? "—"}`))
  lines.push(para(`장애유형: ${disabilityType ?? "—"}`))
  lines.push(para(`의뢰기관: ${assessment.referral_org ?? "—"}`))
  lines.push(para(`평가일: ${assessment.evaluation_date ?? "—"}`))
  lines.push(para(`평가자: ${assessment.evaluator_name ?? "—"}`))
  lines.push(para(""))

  for (const item of assessment.items) {
    lines.push(para("─────────────────────────────────────────────────"))
    lines.push(para(`품목 ${item.item_order} — ${item.item_category}`))
    if (item.item_name) lines.push(para(`품목명: ${item.item_name}`))
    if (item.use_plan) lines.push(para(`활용 계획: ${item.use_plan}`))

    const scores = [
      item.score_env,
      item.score_operation,
      item.score_disability,
      item.score_use_plan,
      item.score_effectiveness,
    ]
    const scoreText = SCORE_LABELS.map((l, i) => `${l}: ${scores[i] ?? "—"}`).join("  /  ")
    lines.push(para(`적정성 평가: ${scoreText}`))
    lines.push(para(`합계: ${item.total_score ?? 0}점`))

    if (item.item_opinion) {
      lines.push(para(`품목 의견: ${item.item_opinion}`))
    }
    lines.push(para(`결과: ${item.item_result ?? "—"}  /  추천 모델: ${item.recommended_model ?? "—"}`))
    if (item.support_amount) {
      lines.push(para(`지원금액: ${item.support_amount.toLocaleString()}원`))
    }
    lines.push(para(""))
  }

  if (assessment.general_opinion) {
    lines.push(para("[ 종합 의견 ]"))
    for (const l of assessment.general_opinion.split("\n")) lines.push(para(l))
    lines.push(para(""))
  }

  lines.push(para(`최종 결과: ${assessment.final_result ?? "미결정"}`))

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hml:HWPMLBody xmlns:hml="urn:hwpml:NameSpace:hwpml" hmlVersion="1.0" secCnt="1">
  <hml:SECTION>
    ${lines.join("\n    ")}
  </hml:SECTION>
</hml:HWPMLBody>`
}

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="Contents/content.hpf" media-type="application/hwp+zip"/>
  </rootfiles>
</container>`

const CONTENT_HPF = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hpf:package xmlns:hpf="urn:hwpml:NameSpace:hpf" version="1.0">
  <hpf:manifest>
    <hpf:item id="section0" MediaType="application/xml" HRef="section0.xml"/>
  </hpf:manifest>
  <hpf:spine>
    <hpf:itemref idref="section0" IsLinear="Yes"/>
  </hpf:spine>
</hpf:package>`

export async function generateGrantAssessmentHwpx(assessmentId: string): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const assessmentResult = await getGrantAssessmentById(assessmentId)
  if (!assessmentResult.success || !assessmentResult.assessment) {
    return { success: false, error: "교부사업 평가를 찾을 수 없습니다" }
  }
  const assessment = assessmentResult.assessment

  const supabase = createAdminClient()
  const { data: client } = await (supabase as any)
    .from("clients")
    .select("name, birth_date, disability_type")
    .eq("id", assessment.client_id)
    .single()

  if (!client) return { success: false, error: "대상자 정보를 찾을 수 없습니다" }

  const section0 = buildSection0(assessment, client.name, client.birth_date, client.disability_type)
  const zip = new JSZip()
  zip.file("mimetype", "application/hwp+zip")
  zip.file("META-INF/container.xml", CONTAINER_XML)
  zip.file("Contents/content.hpf", CONTENT_HPF)
  zip.file("Contents/section0.xml", section0)
  const buffer = await zip.generateAsync({ type: "arraybuffer" })

  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `교부평가_${client.name}_${assessment.assessment_year}`,
  }
}
