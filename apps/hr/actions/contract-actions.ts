'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import { revalidatePath } from 'next/cache'
import { getResend, FROM_EMAIL } from '@/lib/email/resend'
import type {
  HrContract,
  ContractWithEmployee,
  CreateContractInput,
  UpdateContractInput,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

// Extended contract type including e-sign fields added in migration 110
export interface ContractWithSign extends ContractWithEmployee {
  status: 'draft' | 'pending_employee' | 'employee_signed' | 'completed' | 'cancelled'
  employee_token: string
  employee_signature_data: string | null
  employer_signature_data: string | null
  employee_signed_at: string | null
  employer_signed_at: string | null
  sent_to: string | null
  sent_at: string | null
}

export async function getAllContracts(): Promise<Result<ContractWithSign[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*, employee:hr_employees(name,department)')
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as ContractWithSign[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getContractsByEmployee(employeeId: string): Promise<Result<HrContract[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as HrContract[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function getExpiringContracts(withinDays = 30): Promise<Result<ContractWithEmployee[]>> {
  try {
    const supabase = createSupabaseAdmin()
    const today = new Date()
    const limit = new Date(today)
    limit.setDate(limit.getDate() + withinDays)

    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*, employee:hr_employees(name,department)')
      .not('end_date', 'is', null)
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', limit.toISOString().split('T')[0])
      .order('end_date')

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as unknown as ContractWithEmployee[] }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createContract(input: CreateContractInput): Promise<Result<HrContract>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .insert({
        employee_id:     input.employee_id,
        contract_type:   input.contract_type,
        start_date:      input.start_date,
        end_date:        input.end_date ?? null,
        employment_type: input.employment_type,
        position:        input.position,
        department:      input.department,
        base_salary:     input.base_salary,
        work_hours:      input.work_hours ?? 40,
        signed_at:       input.signed_at ?? null,
        note:            input.note ?? null,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true, data: data as HrContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateContract(id: string, input: UpdateContractInput): Promise<Result<HrContract>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true, data: data as HrContract }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteContract(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from('hr_contracts').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/contracts')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// --- E-Signature actions ---

export async function sendSigningRequest(
  contractId: string,
  employeeEmail: string,
  employeeName: string
): Promise<{ success: boolean; error?: string }> {
  await assertRole('admin')
  const supabase = createSupabaseAdmin()

  const { data: contract, error: fetchErr } = await supabase
    .from('hr_contracts')
    .select('id, employee_token, status')
    .eq('id', contractId)
    .single()

  if (fetchErr || !contract) return { success: false, error: fetchErr?.message ?? '계약서를 찾을 수 없습니다' }
  if (contract.status === 'completed') return { success: false, error: '이미 완료된 계약서입니다' }

  const hrBaseUrl = process.env.NEXT_PUBLIC_HR_URL ?? 'https://hr.gwatc.cloud'
  const signUrl = `${hrBaseUrl}/contracts/sign/${contract.employee_token}`

  try {
    const resend = getResend()
    await resend.emails.send({
      from: FROM_EMAIL,
      to: employeeEmail,
      subject: '[GWATC] 근로계약서 전자서명 요청',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">근로계약서 서명 요청</h2>
          <p style="color:#475569">${employeeName}님, 근로계약서 검토 및 전자서명을 요청드립니다.</p>
          <p style="margin:24px 0">
            <a href="${signUrl}"
               style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              계약서 서명하기
            </a>
          </p>
          <p style="color:#94a3b8;font-size:13px">
            위 버튼이 작동하지 않을 경우 아래 링크를 복사하여 접속해 주세요:<br/>
            <a href="${signUrl}" style="color:#7c3aed">${signUrl}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
          <p style="color:#94a3b8;font-size:12px">본 메일은 GWATC 인사관리시스템에서 자동 발송되었습니다.</p>
        </div>
      `,
    })
  } catch (e) {
    return { success: false, error: `이메일 발송 실패: ${String(e)}` }
  }

  const { error: updateErr } = await supabase
    .from('hr_contracts')
    .update({
      status: 'pending_employee',
      sent_to: employeeEmail,
      sent_at: new Date().toISOString(),
    })
    .eq('id', contractId)

  if (updateErr) return { success: false, error: updateErr.message }
  revalidatePath('/contracts')
  return { success: true }
}

/** Public action — no auth required, verified by token */
export async function signAsEmployee(
  token: string,
  signatureData: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdmin()

  const { data: contract, error: fetchErr } = await supabase
    .from('hr_contracts')
    .select('id, status')
    .eq('employee_token', token)
    .single()

  if (fetchErr || !contract) return { success: false, error: '유효하지 않은 서명 링크입니다' }
  if (contract.status === 'completed') return { success: false, error: '이미 완료된 계약서입니다' }
  if (contract.status === 'cancelled') return { success: false, error: '취소된 계약서입니다' }

  const { error } = await supabase
    .from('hr_contracts')
    .update({
      status: 'employee_signed',
      employee_signature_data: signatureData,
      employee_signed_at: new Date().toISOString(),
    })
    .eq('id', contract.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function signAsEmployer(
  contractId: string,
  signatureData: string
): Promise<{ success: boolean; error?: string }> {
  await assertRole('admin')
  const supabase = createSupabaseAdmin()

  const { data: contract, error: fetchErr } = await supabase
    .from('hr_contracts')
    .select('id, status')
    .eq('id', contractId)
    .single()

  if (fetchErr || !contract) return { success: false, error: '계약서를 찾을 수 없습니다' }
  if (contract.status !== 'employee_signed') {
    return { success: false, error: '직원 서명 완료 후 사업주 서명이 가능합니다' }
  }

  const { error } = await supabase
    .from('hr_contracts')
    .update({
      status: 'completed',
      employer_signature_data: signatureData,
      employer_signed_at: new Date().toISOString(),
      signed_at: new Date().toISOString().split('T')[0],
    })
    .eq('id', contractId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/contracts')
  return { success: true }
}

export async function cancelSigning(
  contractId: string
): Promise<{ success: boolean; error?: string }> {
  await assertRole('admin')
  const supabase = createSupabaseAdmin()

  const { error } = await supabase
    .from('hr_contracts')
    .update({
      status: 'draft',
      sent_to: null,
      sent_at: null,
      employee_signature_data: null,
      employee_signed_at: null,
    })
    .eq('id', contractId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/contracts')
  return { success: true }
}

export async function getContractByToken(token: string): Promise<Result<ContractWithSign>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('hr_contracts')
      .select('*, employee:hr_employees(name,department)')
      .eq('employee_token', token)
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, data: data as unknown as ContractWithSign }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
