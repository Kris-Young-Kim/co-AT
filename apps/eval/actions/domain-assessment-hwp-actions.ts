"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { getDomainAssessmentById } from "@/actions/assessment-actions"
import { getClientById } from "@/actions/client-actions"
import JSZip from "jszip"

const DOMAIN_LABELS: Record<string, string> = {
  WC: "휠체어",
  ADL: "일상생활",
  S: "착석",
  SP: "서기",
  EC: "환경제어",
  CA: "의사소통 보조",
  L: "이동",
  AAC: "보완대체의사소통",
  AM: "상지보조",
}

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

function buildSection0(
  assessment: {
    domain_type: string
    evaluation_date: string
    evaluator_opinion: string | null
    recommended_device: string | null
    future_plan: string | null
  },
  clientName: string,
  clientBirthDate: string | null
): string {
  const domainLabel = DOMAIN_LABELS[assessment.domain_type] ?? assessment.domain_type
  const lines: string[] = []

  lines.push(para("영역별 보조기기 평가서"))
  lines.push(para(`${assessment.domain_type} — ${domainLabel} 영역`))
  lines.push(para(""))

  lines.push(para("[ 대상자 정보 ]"))
  lines.push(para(`성명: ${clientName}`))
  lines.push(para(`생년월일: ${clientBirthDate ?? "—"}`))
  lines.push(para(`평가일: ${assessment.evaluation_date}`))
  lines.push(para(""))

  if (assessment.evaluator_opinion) {
    lines.push(para("[ 평가자 의견 ]"))
    for (const l of assessment.evaluator_opinion.split("\n")) lines.push(para(l))
    lines.push(para(""))
  }
  if (assessment.recommended_device) {
    lines.push(para("[ 추천 보조기기 ]"))
    for (const l of assessment.recommended_device.split("\n")) lines.push(para(l))
    lines.push(para(""))
  }
  if (assessment.future_plan) {
    lines.push(para("[ 향후 계획 ]"))
    for (const l of assessment.future_plan.split("\n")) lines.push(para(l))
    lines.push(para(""))
  }

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

export async function generateDomainAssessmentHwpx(assessmentId: string): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const assessmentResult = await getDomainAssessmentById(assessmentId)
  if (!assessmentResult.success || !assessmentResult.assessment) {
    return { success: false, error: "평가서를 찾을 수 없습니다" }
  }
  const assessment = assessmentResult.assessment

  let resolvedClientId: string | null = assessment.client_id ?? null

  if (!resolvedClientId && assessment.application_id) {
    const supabase = createAdminClient()
    const { data: app } = await (supabase as any)
      .from("applications")
      .select("client_id")
      .eq("id", assessment.application_id)
      .single()
    resolvedClientId = app?.client_id ?? null
  }

  if (!resolvedClientId) return { success: false, error: "대상자 정보를 찾을 수 없습니다" }

  const clientResult = await getClientById(resolvedClientId)
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: "대상자 정보를 찾을 수 없습니다" }
  }
  const client = clientResult.client

  const section0 = buildSection0(assessment, client.name, client.birth_date ?? null)
  const zip = new JSZip()
  zip.file("mimetype", "application/hwp+zip")
  zip.file("META-INF/container.xml", CONTAINER_XML)
  zip.file("Contents/content.hpf", CONTENT_HPF)
  zip.file("Contents/section0.xml", section0)
  const buffer = await zip.generateAsync({ type: "arraybuffer" })

  const domainLabel = DOMAIN_LABELS[assessment.domain_type] ?? assessment.domain_type
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `영역평가_${client.name}_${domainLabel}`,
  }
}
