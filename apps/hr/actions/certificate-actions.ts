'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { assertRole } from '@co-at/auth'
import type { HrCertificate, CreateCertificateInput } from '@co-at/types'

const STAFF = 'staff' as const

export type CertWithRelations = HrCertificate & {
  hr_employees?: { name: string }
  issued_by_employee?: { name: string }
}

export async function getCertificates(employeeId?: string): Promise<CertWithRelations[]> {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('hr_certificates')
    .select('*, hr_employees!hr_certificates_employee_id_fkey(name), issued_by_employee:hr_employees!hr_certificates_issued_by_fkey(name)')
    .order('issued_at', { ascending: false })
  if (employeeId) query = query.eq('employee_id', employeeId)
  const { data, error } = await query
  if (error) {
    console.error('[getCertificates]', error)
    return []
  }
  return data ?? []
}

export async function issueCertificate(input: CreateCertificateInput): Promise<HrCertificate | null> {
  await assertRole(STAFF)
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()

  // Resolve issuer employee record from Clerk user ID
  const { data: issuer, error: issuerError } = await supabase
    .from('hr_employees')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (issuerError) {
    console.error('[issueCertificate] Failed to fetch issuer:', issuerError)
    return null
  }
  if (!issuer) {
    console.error('[issueCertificate] Issuer not found in hr_employees for clerk_user_id:', userId)
    return null
  }

  const { data, error } = await supabase
    .from('hr_certificates')
    .insert({
      employee_id: input.employee_id,
      type:        input.type,
      purpose:     input.purpose ?? null,
      issued_by:   issuer.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[issueCertificate]', error)
    return null
  }
  return data
}
