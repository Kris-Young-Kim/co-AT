"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import JSZip from "jszip"
import type { ConsultationRecord } from "@/actions/case-record-actions"

// ──────────────────────────────────────────────────────────────
// HWPX XML builders
// ──────────────────────────────────────────────────────────────

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

interface ClientInfo {
  name: string | null
  birth_date: string | null
  disability_type: string | null
  disability_grade: string | null
}

function buildSection0(records: ConsultationRecord[], client: ClientInfo): string {
  const lines: string[] = []

  lines.push(para("상  담  기  록  지"))
  lines.push(para(""))

  lines.push(para("[ 대상자 정보 ]"))
  lines.push(para(`성명: ${client.name ?? "—"}`))
  lines.push(para(`생년월일: ${client.birth_date ?? "—"}`))
  const disabilityLabel = [client.disability_type, client.disability_grade].filter(Boolean).join(" ")
  lines.push(para(`장애유형: ${disabilityLabel || "—"}`))
  lines.push(para(""))

  for (const r of records) {
    lines.push(para("─────────────────────────────────────────────────"))
    lines.push(para(`상담일: ${r.consultation_date}   유형: ${r.consultation_type}   상담자: ${r.consultant ?? "—"}`))
    lines.push(para(""))

    if (r.purpose) {
      lines.push(para("[ 방문·상담 목적 / 주호소 ]"))
      for (const l of r.purpose.split("\n")) lines.push(para(l))
      lines.push(para(""))
    }
    if (r.current_situation) {
      lines.push(para("[ 현재 상황 ]"))
      for (const l of r.current_situation.split("\n")) lines.push(para(l))
      lines.push(para(""))
    }
    if (r.content) {
      lines.push(para("[ 상담 내용 ]"))
      for (const l of r.content.split("\n")) lines.push(para(l))
      lines.push(para(""))
    }
    if (r.result) {
      lines.push(para("[ 결과 및 조치사항 ]"))
      for (const l of r.result.split("\n")) lines.push(para(l))
      lines.push(para(""))
    }
    if (r.next_plan) {
      lines.push(para("[ 향후 계획 ]"))
      for (const l of r.next_plan.split("\n")) lines.push(para(l))
      lines.push(para(""))
    }
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

async function buildHwpx(records: ConsultationRecord[], client: ClientInfo): Promise<ArrayBuffer> {
  const zip = new JSZip()
  zip.file("mimetype", "application/hwp+zip")
  zip.file("META-INF/container.xml", CONTAINER_XML)
  zip.file("Contents/content.hpf", CONTENT_HPF)
  zip.file("Contents/section0.xml", buildSection0(records, client))
  return zip.generateAsync({ type: "arraybuffer" })
}

// ──────────────────────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────────────────────

export async function generateConsultationHwpx(recordId: string): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { data: record, error: rErr } = await (supabase as any)
    .from("eval_consultation_records")
    .select("*")
    .eq("id", recordId)
    .single()

  if (rErr || !record) return { success: false, error: "상담기록지를 찾을 수 없습니다" }

  const { data: client, error: cErr } = await (supabase as any)
    .from("clients")
    .select("name, birth_date, disability_type, disability_grade")
    .eq("id", record.client_id)
    .single()

  if (cErr || !client) return { success: false, error: "대상자 정보를 찾을 수 없습니다" }

  const buffer = await buildHwpx([record], client)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `상담기록지_${client.name}_${record.consultation_date}`,
  }
}

export async function generateClientConsultationsHwpx(clientId: string): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { data: client, error: cErr } = await (supabase as any)
    .from("clients")
    .select("name, birth_date, disability_type, disability_grade")
    .eq("id", clientId)
    .single()

  if (cErr || !client) return { success: false, error: "대상자 정보를 찾을 수 없습니다" }

  const { data: records, error: rErr } = await (supabase as any)
    .from("eval_consultation_records")
    .select("*")
    .eq("client_id", clientId)
    .order("consultation_date", { ascending: true })

  if (rErr) return { success: false, error: "상담기록지를 불러올 수 없습니다" }
  if (!records?.length) return { success: false, error: "상담기록지가 없습니다" }

  const buffer = await buildHwpx(records, client)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `상담기록지_${client.name}_전체`,
  }
}
