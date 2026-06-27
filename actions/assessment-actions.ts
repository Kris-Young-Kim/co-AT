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

export interface ConsultDomainAssessment extends ClientDomainAssessment {
  evaluation_data: Record<string, unknown> | null;
  measurements: Record<string, number> | null;
}

export async function getDomainAssessmentsByConsultationRecord(
  consultationRecordId: string
): Promise<{ success: boolean; assessments?: ConsultDomainAssessment[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("id,domain_type,evaluation_date,consultation_record_id,application_id,client_id,evaluator_opinion,recommended_device,future_plan,evaluation_data,measurements")
      .eq("consultation_record_id", consultationRecordId)
      .order("evaluation_date", { ascending: false });

    if (error) {
      console.error("getDomainAssessmentsByConsultationRecord:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessments: (data ?? []) as ConsultDomainAssessment[] };
  } catch (e) {
    console.error("getDomainAssessmentsByConsultationRecord:", e);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

export interface ClientDomainAssessment {
  id: string;
  domain_type: string;
  evaluation_date: string;
  consultation_record_id: string | null;
  application_id: string | null;
  client_id: string | null;
  evaluator_opinion: string | null;
  recommended_device: string | null;
  future_plan: string | null;
}

export async function getDomainAssessmentsByClient(
  clientId: string
): Promise<{ success: boolean; assessments?: ClientDomainAssessment[]; error?: string }> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) return { success: false, error: "권한이 없습니다" };

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("domain_assessments")
      .select("id,domain_type,evaluation_date,consultation_record_id,application_id,client_id,evaluator_opinion,recommended_device,future_plan")
      .eq("client_id", clientId)
      .order("evaluation_date", { ascending: false });

    if (error) {
      console.error("getDomainAssessmentsByClient:", error);
      return { success: false, error: "평가 조회에 실패했습니다" };
    }
    return { success: true, assessments: (data ?? []) as ClientDomainAssessment[] };
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

  // Step 1: raw domain assessments
  const { data: rows, error } = await (supabase as any)
    .from("domain_assessments")
    .select("id,domain_type,evaluation_date,application_id,consultation_record_id,client_id")
    .order("evaluation_date", { ascending: false })
    .limit(500);

  if (error) {
    console.error("getAllDomainAssessments:", error);
    return { success: false, error: "평가 목록 조회에 실패했습니다" };
  }

  // Step 2: collect unique IDs for batch lookups
  const directClientIds = [...new Set<string>(
    (rows as Record<string, unknown>[]).filter(r => r.client_id).map(r => r.client_id as string)
  )];
  const appIds = [...new Set<string>(
    (rows as Record<string, unknown>[]).filter(r => r.application_id && !r.client_id).map(r => r.application_id as string)
  )];

  interface ClientRow { id: string; name: string; birth_date: string | null; disability_type: string | null }
  const clientMap = new Map<string, ClientRow>();

  // Step 3: direct client lookup
  if (directClientIds.length > 0) {
    const { data: clients } = await (supabase as any)
      .from("clients")
      .select("id,name,birth_date,disability_type")
      .in("id", directClientIds);
    for (const c of clients ?? []) clientMap.set(c.id, c as ClientRow);
  }

  // Step 4: application-linked client lookup
  const appClientMap = new Map<string, { clientId: string } & ClientRow>();
  if (appIds.length > 0) {
    const { data: apps } = await (supabase as any)
      .from("applications")
      .select("id,client_id,clients!inner(id,name,birth_date,disability_type)")
      .in("id", appIds);
    for (const a of apps ?? []) {
      if (a.clients) {
        appClientMap.set(a.id as string, { clientId: a.client_id as string, ...a.clients as ClientRow });
      }
    }
  }

  // Step 5: assemble results
  const assessments: AssessmentListItem[] = (rows as Record<string, unknown>[]).map(row => {
    const clientId = (row.client_id as string | null);
    const appId = (row.application_id as string | null);
    const clientInfo = clientId ? clientMap.get(clientId) : appId ? appClientMap.get(appId) : undefined;
    const resolvedClientId = clientId ?? (appId ? appClientMap.get(appId)?.clientId ?? null : null);
    return {
      id: row.id as string,
      domain_type: row.domain_type as string,
      evaluation_date: row.evaluation_date as string,
      application_id: appId,
      consultation_record_id: (row.consultation_record_id as string | null) ?? null,
      client_id: resolvedClientId,
      client_name: clientInfo?.name ?? "—",
      birth_date: clientInfo?.birth_date ?? null,
      disability_type: clientInfo?.disability_type ?? null,
    };
  });

  return { success: true, assessments };
}
