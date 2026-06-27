"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type AssessmentDomainType =
  | "WC"
  | "ADL"
  | "S"
  | "SP"
  | "EC"
  | "CA"
  | "L"
  | "AAC"
  | "AM";

export interface DomainAssessmentInput {
  application_id?: string | null;
  consultation_record_id?: string | null;
  client_id?: string | null;
  domain_type: AssessmentDomainType;
  evaluation_date: string;
  evaluation_data?: Record<string, unknown>;
  measurements?: Record<string, number>;
  evaluator_opinion?: string;
  recommended_device?: string;
  future_plan?: string;
}

export async function createDomainAssessment(
  input: DomainAssessmentInput
): Promise<{ success: boolean; assessmentId?: string; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const { userId } = await auth();
    if (!userId) return { success: false, error: "로그인이 필요합니다" };

    const supabase = createAdminClient();

    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    const profileId = profile ? (profile as { id: string }).id : null;

    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .insert({
        application_id: input.application_id ?? null,
        consultation_record_id: input.consultation_record_id ?? null,
        client_id: input.client_id ?? null,
        evaluator_id: profileId,
        domain_type: input.domain_type,
        evaluation_date: input.evaluation_date,
        evaluation_data: input.evaluation_data ?? null,
        measurements: input.measurements ?? null,
        evaluator_opinion: input.evaluator_opinion ?? null,
        recommended_device: input.recommended_device ?? null,
        future_plan: input.future_plan ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("createDomainAssessment:", error);
      return { success: false, error: "평가 생성에 실패했습니다: " + (error.message ?? "알 수 없는 오류") };
    }

    const clientId = input.client_id ?? null;
    revalidatePath("/clients");
    if (clientId) revalidatePath(`/clients/${clientId}`);

    return { success: true, assessmentId: (data as { id: string }).id };
  } catch (e) {
    console.error("createDomainAssessment:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export async function getDomainAssessments(applicationId: string): Promise<{
  success: boolean;
  assessments?: unknown[];
  error?: string;
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("*")
      .eq("application_id", applicationId)
      .order("evaluation_date", { ascending: false });

    if (error) {
      console.error("getDomainAssessments:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessments: data ?? [] };
  } catch (e) {
    console.error("getDomainAssessments:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export async function getDomainAssessmentsByConsultationRecord(
  consultationRecordId: string
): Promise<{ success: boolean; assessments?: unknown[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("*")
      .eq("consultation_record_id", consultationRecordId)
      .order("evaluation_date", { ascending: false });

    if (error) {
      console.error("getDomainAssessmentsByConsultationRecord:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessments: data ?? [] };
  } catch (e) {
    console.error("getDomainAssessmentsByConsultationRecord:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export async function getDomainAssessmentsByClient(
  clientId: string
): Promise<{ success: boolean; assessments?: unknown[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("*")
      .eq("client_id", clientId)
      .order("evaluation_date", { ascending: false });

    if (error) {
      console.error("getDomainAssessmentsByClient:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessments: data ?? [] };
  } catch (e) {
    console.error("getDomainAssessmentsByClient:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export async function getDomainAssessmentById(assessmentId: string): Promise<{
  success: boolean;
  assessment?: unknown;
  error?: string;
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (error) {
      console.error("getDomainAssessmentById:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessment: data };
  } catch (e) {
    console.error("getDomainAssessmentById:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export async function updateDomainAssessment(
  assessmentId: string,
  updates: Partial<DomainAssessmentInput>
): Promise<{ success: boolean; assessment?: unknown; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.evaluation_date) updateData.evaluation_date = updates.evaluation_date;
    if (updates.evaluation_data !== undefined) updateData.evaluation_data = updates.evaluation_data;
    if (updates.measurements !== undefined) updateData.measurements = updates.measurements;
    if (updates.evaluator_opinion !== undefined) updateData.evaluator_opinion = updates.evaluator_opinion;
    if (updates.recommended_device !== undefined) updateData.recommended_device = updates.recommended_device;
    if (updates.future_plan !== undefined) updateData.future_plan = updates.future_plan;

    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .update(updateData)
      .eq("id", assessmentId)
      .select()
      .single();

    if (error) {
      console.error("updateDomainAssessment:", error);
      return { success: false, error: "평가 수정에 실패했습니다" };
    }

    revalidatePath("/clients");
    return { success: true, assessment: data };
  } catch (e) {
    console.error("updateDomainAssessment:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export interface AssessmentListItem {
  id: string;
  domain_type: string;
  evaluation_date: string;
  application_id: string | null;
  consultation_record_id: string | null;
  client_id: string | null;
  client_name: string;
  birth_date: string | null;
  disability_type: string | null;
}

export async function getAllDomainAssessments(): Promise<{
  success: boolean;
  assessments?: AssessmentListItem[];
  error?: string;
}> {
  const hasPermission = await hasAdminOrStaffPermission();
  if (!hasPermission) return { success: false, error: "권한이 없습니다" };

  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from("domain_assessments")
    .select(`
      id, domain_type, evaluation_date, application_id, consultation_record_id, client_id,
      applications(id, client_id, clients(id, name, birth_date, disability_type)),
      eval_consultation_records(id, client_id, eval_clients(id, name, birth_date, disability_type))
    `)
    .order("evaluation_date", { ascending: false })
    .limit(500);

  if (error) {
    console.error("getAllDomainAssessments:", error);
    return { success: false, error: "평가 목록 조회에 실패했습니다" };
  }

  const assessments: AssessmentListItem[] = (data ?? []).map((row: Record<string, unknown>) => {
    const appRow = row.applications as Record<string, unknown> | null;
    const consultRow = row.eval_consultation_records as Record<string, unknown> | null;
    const appClient = appRow?.clients as Record<string, unknown> | null;
    const consultClient = consultRow?.eval_clients as Record<string, unknown> | null;
    const clientData = appClient ?? consultClient;
    return {
      id: row.id as string,
      domain_type: row.domain_type as string,
      evaluation_date: row.evaluation_date as string,
      application_id: (row.application_id as string | null) ?? null,
      consultation_record_id: (row.consultation_record_id as string | null) ?? null,
      client_id: (row.client_id as string | null) ?? (appRow?.client_id as string | null) ?? null,
      client_name: (clientData?.name as string | null) ?? "—",
      birth_date: (clientData?.birth_date as string | null) ?? null,
      disability_type: (clientData?.disability_type as string | null) ?? null,
    };
  });

  return { success: true, assessments };
}
