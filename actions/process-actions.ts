"use server";

import { createClient } from "@/lib/supabase/server";
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type {
  ProgressItem,
} from "@/components/features/process/ServiceProgressDashboard";

export interface ProcessLogInput {
  application_id: string;
  client_id: string;
  log_date: string;
  service_area?: string;
  funding_source?: string;
  funding_detail?: string;
  process_step?: string;
  item_name?: string;
  content?: string;
  remarks?: string;
}

/**
 * 서비스 진행 기록지 생성 (첨부 20)
 */
export async function createProcessLog(input: ProcessLogInput): Promise<{
  success: boolean;
  processLogId?: string;
  error?: string;
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" };
    }

    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "로그인이 필요합니다" };
    }

    const supabase = await createClient();

    // 담당자 ID 조회
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    const { data, error } = await supabase
      .from("process_logs")
      // @ts-expect-error - Supabase 타입 추론 이슈 (Next.js 16)
      .insert({
        application_id: input.application_id,
        staff_id: profile ? (profile as { id: string }).id : null,
        log_date: input.log_date,
        service_area: input.service_area || null,
        funding_source: input.funding_source || null,
        process_step: input.process_step || null,
        item_name: input.item_name || null,
        content: input.content || null,
        remarks: input.remarks || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("서비스 진행 기록 생성 실패:", error);
      return {
        success: false,
        error:
          "서비스 진행 기록 생성에 실패했습니다: " +
          (error.message || "알 수 없는 오류"),
      };
    }

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${input.client_id}`);
    revalidatePath("/clients");
    revalidatePath(`/clients/${input.client_id}`);

    return { success: true, processLogId: (data as { id: string }).id };
  } catch (error) {
    console.error("Unexpected error in createProcessLog:", error);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

/**
 * 서비스 진행 데이터 통합 조회 (상담 기록, 평가, 일정, 진행 기록)
 */
export async function getServiceProgressData(
  clientId: string,
  applicationId?: string
): Promise<{
  success: boolean;
  items?: ProgressItem[];
  error?: string;
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" };
    }

    const supabase = await createClient();
    const items: ProgressItem[] = [];

    // 1. 신청서 ID 목록 조회
    let applicationIds: string[] = [];
    if (applicationId) {
      applicationIds = [applicationId];
    } else {
      const { data: applications } = await supabase
        .from("applications")
        .select("id")
        .eq("client_id", clientId);

      applicationIds = applications?.map((app: { id: string }) => app.id) || [];
    }

    // 2. 상담 기록 (intake_records)
    if (applicationIds.length > 0) {
      const { data: intakeRecords } = await supabase
        .from("intake_records")
        .select(
          "id, consult_date, created_at, application_id, consultation_content"
        )
        .in("application_id", applicationIds)
        .order("consult_date", { ascending: false });

      if (intakeRecords) {
        intakeRecords.forEach((record: any) => {
          items.push({
            id: record.id,
            type: "intake",
            date: record.consult_date || record.created_at,
            title: "상담 기록",
            description: record.consultation_content
              ? record.consultation_content.substring(0, 100) + "..."
              : undefined,
            metadata: {
              상담일: record.consult_date || record.created_at,
            },
          });
        });
      }
    }

    // 3. 평가 기록 (domain_assessments)
    if (applicationIds.length > 0) {
      const { data: assessments } = await supabase
        .from("domain_assessments")
        .select(
          "id, evaluation_date, created_at, application_id, domain_type, evaluator_opinion"
        )
        .in("application_id", applicationIds)
        .order("evaluation_date", { ascending: false });

      if (assessments) {
        const domainNames: Record<string, string> = {
          WC: "휠체어 및 이동",
          ADL: "일상생활동작",
          S: "감각",
          SP: "자세",
          EC: "주택 및 환경개조",
          CA: "컴퓨터 접근",
          L: "레저",
          AAC: "보완대체의사소통",
          AM: "자동차 개조",
        };

        assessments.forEach((assessment: any) => {
          items.push({
            id: assessment.id,
            type: "assessment",
            date: assessment.evaluation_date || assessment.created_at,
            title: `${
              domainNames[assessment.domain_type] || assessment.domain_type
            } 평가`,
            description: assessment.evaluator_opinion
              ? assessment.evaluator_opinion.substring(0, 100) + "..."
              : undefined,
            metadata: {
              평가영역:
                domainNames[assessment.domain_type] || assessment.domain_type,
              평가일: assessment.evaluation_date || assessment.created_at,
            },
          });
        });
      }
    }

    // 4. 일정 (schedules)
    const { data: schedules } = await supabase
      .from("schedules")
      .select(
        "id, scheduled_date, scheduled_time, schedule_type, status, address, notes, created_at"
      )
      .eq("client_id", clientId)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false });

    if (schedules) {
      const scheduleTypeNames: Record<string, string> = {
        visit: "방문",
        consult: "상담",
        assessment: "평가",
        delivery: "배송",
        pickup: "픽업",
        exhibition: "견학",
        education: "교육",
      };

      const statusNames: Record<string, string> = {
        scheduled: "예정",
        completed: "완료",
        cancelled: "취소",
      };

      schedules.forEach((schedule: any) => {
        items.push({
          id: schedule.id,
          type: "schedule",
          date: schedule.scheduled_date || schedule.created_at,
          title: `${
            scheduleTypeNames[schedule.schedule_type] || schedule.schedule_type
          } 일정`,
          description: schedule.address || schedule.notes || undefined,
          status: statusNames[schedule.status] || schedule.status,
          metadata: {
            일정유형:
              scheduleTypeNames[schedule.schedule_type] ||
              schedule.schedule_type,
            일정일시: schedule.scheduled_time
              ? `${schedule.scheduled_date} ${schedule.scheduled_time.substring(
                  0,
                  5
                )}`
              : schedule.scheduled_date,
            주소: schedule.address || "-",
            상태: statusNames[schedule.status] || schedule.status || "-",
            메모: schedule.notes || "-",
          },
        });
      });
    }

    // 5. 진행 기록 (process_logs)
    if (applicationIds.length > 0) {
      const { data: processLogs } = await supabase
        .from("process_logs")
        .select(
          "id, log_date, created_at, application_id, service_area, process_step, item_name, content"
        )
        .in("application_id", applicationIds)
        .order("log_date", { ascending: false });

      if (processLogs) {
        processLogs.forEach((log: any) => {
          items.push({
            id: log.id,
            type: "process_log",
            date: log.log_date || log.created_at,
            title: log.item_name || "서비스 진행 기록",
            description: log.content
              ? log.content.substring(0, 100) + "..."
              : undefined,
            metadata: {
              서비스영역: log.service_area || "-",
              과정: log.process_step || "-",
              품목명: log.item_name || "-",
            },
          });
        });
      }
    }

    return { success: true, items };
  } catch (error) {
    console.error("Unexpected error in getServiceProgressData:", error);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}

/**
 * 진행 기록 조회
 */
export async function getProcessLogs(applicationId: string): Promise<{
  success: boolean;
  logs?: any[];
  error?: string;
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission();
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("process_logs")
      .select("*")
      .eq("application_id", applicationId)
      .order("log_date", { ascending: false });

    if (error) {
      console.error("진행 기록 조회 실패:", error);
      return { success: false, error: "진행 기록 조회에 실패했습니다" };
    }

    return { success: true, logs: data || [] };
  } catch (error) {
    console.error("Unexpected error in getProcessLogs:", error);
    return { success: false, error: "예상치 못한 오류가 발생했습니다" };
  }
}
