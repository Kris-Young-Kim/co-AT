"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import JSZip from "jszip"
import type { AssessmentNote } from "@/actions/case-record-actions"

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

const ASSESSMENT_FIELDS: { key: keyof AssessmentNote; label: string }[] = [
  { key: "physical_function", label: "신체기능 평가" },
  { key: "cognitive_function", label: "인지기능 평가" },
  { key: "environment", label: "환경 요인" },
  { key: "device_needs", label: "보조기기 필요도" },
  { key: "recommendations", label: "추천 사항" },
  { key: "notes", label: "비고" },
]

function buildSection0(notes: AssessmentNote[], client: ClientInfo): string {
  const lines: string[] = []

  lines.push(para("평  가  지"))
  lines.push(para(""))

  lines.push(para("[ 대상자 정보 ]"))
  lines.push(para(`성명: ${client.name ?? "—"}`))
  lines.push(para(`생년월일: ${client.birth_date ?? "—"}`))
  const disabilityLabel = [client.disability_type, client.disability_grade].filter(Boolean).join(" ")
  lines.push(para(`장애유형: ${disabilityLabel || "—"}`))
  lines.push(para(""))

  for (const n of notes) {
    lines.push(para("─────────────────────────────────────────────────"))
    lines.push(para(`평가일: ${n.assessment_date}   평가자: ${n.assessor ?? "—"}`))
    lines.push(para(""))

    for (const { key, label } of ASSESSMENT_FIELDS) {
      const value = n[key]
      if (value && typeof value === "string") {
        lines.push(para(`[ ${label} ]`))
        for (const l of value.split("\n")) lines.push(para(l))
        lines.push(para(""))
      }
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

async function buildHwpx(notes: AssessmentNote[], client: ClientInfo): Promise<ArrayBuffer> {
  const zip = new JSZip()
  zip.file("mimetype", "application/hwp+zip")
  zip.file("META-INF/container.xml", CONTAINER_XML)
  zip.file("Contents/content.hpf", CONTENT_HPF)
  zip.file("Contents/section0.xml", buildSection0(notes, client))
  return zip.generateAsync({ type: "arraybuffer" })
}

// ──────────────────────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────────────────────

export async function generateAssessmentNoteHwpx(noteId: string): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: "권한이 없습니다" }

  const supabase = createAdminClient()

  const { data: note, error: nErr } = await (supabase as any)
    .from("eval_assessment_notes")
    .select("*")
    .eq("id", noteId)
    .single()

  if (nErr || !note) return { success: false, error: "평가지를 찾을 수 없습니다" }

  const { data: client, error: cErr } = await (supabase as any)
    .from("clients")
    .select("name, birth_date, disability_type, disability_grade")
    .eq("id", note.client_id)
    .single()

  if (cErr || !client) return { success: false, error: "대상자 정보를 찾을 수 없습니다" }

  const buffer = await buildHwpx([note], client)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `평가지_${client.name}_${note.assessment_date}`,
  }
}

export async function generateClientAssessmentNotesHwpx(clientId: string): Promise<{
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

  const { data: notes, error: nErr } = await (supabase as any)
    .from("eval_assessment_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("assessment_date", { ascending: true })

  if (nErr) return { success: false, error: "평가지를 불러올 수 없습니다" }
  if (!notes?.length) return { success: false, error: "평가지가 없습니다" }

  const buffer = await buildHwpx(notes, client)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `평가지_${client.name}_전체`,
  }
}
