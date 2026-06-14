"use server"

import { renderToBuffer } from '@react-pdf/renderer'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDomainAssessmentById } from '@/actions/assessment-actions'
import { getClientById } from '@/actions/client-actions'
import {
  getConsultationRecordById,
  getConsultationRecordsByClient,
  getAssessmentNoteById,
  getAssessmentNotesByClient,
} from '@/actions/case-record-actions'
import { getGrantAssessmentById } from '@/actions/grant-assessment-actions'
import { getChecklistTemplates, type ChecklistTemplate } from '@/actions/checklist-template-actions'
import { AssessmentPdf } from '@/eval/components/pdf/AssessmentPdf'
import { ConsultationPdf } from '@/eval/components/pdf/ConsultationPdf'
import { AssessmentNotePdf } from '@/eval/components/pdf/AssessmentNotePdf'
import { GrantAssessmentPdf } from '@/eval/components/pdf/GrantAssessmentPdf'

type PdfResult = { success: boolean; buffer?: number[]; filename?: string; error?: string }

const DOMAIN_SHORT: Record<string, string> = {
  WC: '휠체어', ADL: '일상생활', S: '감각', SP: '앉기', EC: '환경', CA: '컴퓨터', L: '레저', AAC: 'AAC', AM: '자동차',
}

export async function generateAssessmentPdf(assessmentId: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const assessmentResult = await getDomainAssessmentById(assessmentId)
  if (!assessmentResult.success || !assessmentResult.assessment) {
    return { success: false, error: '평가서를 찾을 수 없습니다' }
  }
  const assessment = assessmentResult.assessment

  const supabase = createAdminClient()
  const { data: app } = await (supabase as any)
    .from('applications')
    .select('client_id')
    .eq('id', assessment.application_id)
    .single()
  if (!app) return { success: false, error: '신청 정보를 찾을 수 없습니다' }

  const clientResult = await getClientById(app.client_id)
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: '대상자 정보를 찾을 수 없습니다' }
  }
  const client = clientResult.client

  const buffer = await renderToBuffer(<AssessmentPdf assessment={assessment} client={client} />)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `영역평가_${client.name}_${DOMAIN_SHORT[assessment.domain_type] ?? assessment.domain_type}`,
  }
}

export async function generateConsultationPdf(recordId: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const recordResult = await getConsultationRecordById(recordId)
  if (!recordResult.success || !recordResult.record) {
    return { success: false, error: '상담기록지를 찾을 수 없습니다' }
  }
  const record = recordResult.record

  const clientResult = await getClientById(record.client_id)
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: '대상자 정보를 찾을 수 없습니다' }
  }
  const client = clientResult.client

  const buffer = await renderToBuffer(<ConsultationPdf records={[record]} client={client} />)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `상담기록지_${client.name}_${record.consultation_date}`,
  }
}

export async function generateClientConsultationsPdf(clientId: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const [clientResult, recordsResult] = await Promise.all([
    getClientById(clientId),
    getConsultationRecordsByClient(clientId),
  ])
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: '대상자 정보를 찾을 수 없습니다' }
  }
  if (!recordsResult.success || !recordsResult.records?.length) {
    return { success: false, error: '상담기록지가 없습니다' }
  }
  const client = clientResult.client
  const records = [...recordsResult.records].sort((a, b) => a.consultation_date.localeCompare(b.consultation_date))

  const buffer = await renderToBuffer(<ConsultationPdf records={records} client={client} />)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `상담기록지_전체_${client.name}`,
  }
}

export async function generateAssessmentNotePdf(noteId: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const noteResult = await getAssessmentNoteById(noteId)
  if (!noteResult.success || !noteResult.note) {
    return { success: false, error: '평가지를 찾을 수 없습니다' }
  }
  const note = noteResult.note

  const clientResult = await getClientById(note.client_id)
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: '대상자 정보를 찾을 수 없습니다' }
  }
  const client = clientResult.client

  const buffer = await renderToBuffer(<AssessmentNotePdf notes={[note]} client={client} />)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `평가지_${client.name}_${note.assessment_date}`,
  }
}

export async function generateClientAssessmentNotesPdf(clientId: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const [clientResult, notesResult] = await Promise.all([
    getClientById(clientId),
    getAssessmentNotesByClient(clientId),
  ])
  if (!clientResult.success || !clientResult.client) {
    return { success: false, error: '대상자 정보를 찾을 수 없습니다' }
  }
  if (!notesResult.success || !notesResult.notes?.length) {
    return { success: false, error: '평가지가 없습니다' }
  }
  const client = clientResult.client
  const notes = [...notesResult.notes].sort((a, b) => a.assessment_date.localeCompare(b.assessment_date))

  const buffer = await renderToBuffer(<AssessmentNotePdf notes={notes} client={client} />)
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `평가지_전체_${client.name}`,
  }
}

export async function generateGrantAssessmentPdf(id: string): Promise<PdfResult> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const result = await getGrantAssessmentById(id)
  if (!result.success || !result.assessment) {
    return { success: false, error: '교부평가를 찾을 수 없습니다' }
  }
  const assessment = result.assessment

  const clientResult = await getClientById(assessment.client_id)
  const client = clientResult.success ? clientResult.client : null

  const checklistMap: Record<string, ChecklistTemplate[]> = {}
  await Promise.all(
    assessment.items.map(async (item: { item_category: string }) => {
      const r = await getChecklistTemplates(item.item_category)
      checklistMap[item.item_category] = r.templates ?? []
    })
  )

  const buffer = await renderToBuffer(
    <GrantAssessmentPdf assessment={assessment} client={client ?? null} checklistMap={checklistMap} />
  )
  return {
    success: true,
    buffer: Array.from(new Uint8Array(buffer)),
    filename: `교부평가_${client?.name ?? '대상자'}_${assessment.assessment_year}`,
  }
}
