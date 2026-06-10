"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { revalidatePath } from "next/cache"

export interface CaseService {
  service_type: 'grant_eval' | 'rental' | 'custom_make' | 'application'
  service_id: string
  label: string
}

export interface EvalCase {
  id: string
  client_id: string
  title: string
  case_type: string
  status: string
  services: CaseService[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateCaseInput {
  title: string
  case_type?: string
  notes?: string | null
}

export interface UpdateCaseInput {
  title?: string
  case_type?: string
  status?: string
  notes?: string | null
}

export async function getClientCases(clientId: string): Promise<{
  success: boolean
  cases?: EvalCase[]
  error?: string
}> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "Permission denied" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_cases")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, cases: data as EvalCase[] }
}

export async function createCase(
  clientId: string,
  input: CreateCaseInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "Permission denied" }

  const supabase = createAdminClient()
  const { data, error } = await (supabase as any)
    .from("eval_cases")
    .insert({
      client_id: clientId,
      title: input.title,
      case_type: input.case_type ?? "multi",
      notes: input.notes ?? null,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath("/clients/" + clientId)
  return { success: true, id: data.id }
}

export async function updateCase(
  caseId: string,
  clientId: string,
  updates: UpdateCaseInput
): Promise<{ success: boolean; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "Permission denied" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_cases")
    .update(updates)
    .eq("id", caseId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/clients/" + clientId)
  return { success: true }
}

export async function deleteCase(
  caseId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "Permission denied" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_cases")
    .delete()
    .eq("id", caseId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/clients/" + clientId)
  return { success: true }
}

export async function updateCaseServices(
  caseId: string,
  clientId: string,
  services: CaseService[]
): Promise<{ success: boolean; error?: string }> {
  const allowed = await hasAdminOrStaffPermission()
  if (!allowed) return { success: false, error: "Permission denied" }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from("eval_cases")
    .update({ services })
    .eq("id", caseId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/clients/" + clientId)
  return { success: true }
}
