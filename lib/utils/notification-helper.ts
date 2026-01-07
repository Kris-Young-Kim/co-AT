/**
 * 알림 발송 헬퍼 함수
 * 다양한 이벤트에서 알림을 생성하는 유틸리티
 */

import { createNotification, type CreateNotificationParams } from "@/actions/notification-actions"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * 신청 관련 알림 생성
 */
export async function notifyApplicationCreated(applicationId: string, clientName: string) {
  return createNotification({
    type: "application",
    title: "새로운 서비스 신청",
    body: `${clientName}님의 서비스 신청이 접수되었습니다.`,
    link: `/admin/applications/${applicationId}`,
    priority: 1,
    metadata: {
      applicationId,
      clientName,
    },
  })
}

/**
 * 대여 만료 알림 생성
 */
export async function notifyRentalExpiry(
  rentalId: string,
  clientId: string,
  clerkUserId: string | null,
  daysUntilExpiry: number,
  deviceName: string
) {
  const title =
    daysUntilExpiry === 0
      ? "대여 기간 만료"
      : daysUntilExpiry === 3
      ? "대여 기간 3일 남음"
      : "대여 기간 7일 남음"

  return createNotification({
    userId: clientId,
    clerkUserId: clerkUserId || undefined,
    type: "rental_expiry",
    title,
    body: `${deviceName} 대여 기간이 ${daysUntilExpiry === 0 ? "오늘" : `${daysUntilExpiry}일 후`} 만료됩니다.`,
    link: `/admin/rentals/${rentalId}`,
    priority: daysUntilExpiry === 0 ? 3 : daysUntilExpiry === 3 ? 2 : 1,
    metadata: {
      rentalId,
      daysUntilExpiry,
      deviceName,
    },
  })
}

/**
 * 일정 관련 알림 생성
 */
export async function notifyScheduleCreated(
  scheduleId: string,
  staffId: string,
  clerkUserId: string | null,
  scheduleType: string,
  scheduledDate: string
) {
  return createNotification({
    userId: staffId,
    clerkUserId: clerkUserId || undefined,
    type: "schedule",
    title: "새로운 일정이 배정되었습니다",
    body: `${scheduleType} 일정이 ${new Date(scheduledDate).toLocaleDateString("ko-KR")}에 예정되어 있습니다.`,
    link: `/admin/schedule/${scheduleId}`,
    priority: 1,
    metadata: {
      scheduleId,
      scheduleType,
      scheduledDate,
    },
  })
}

/**
 * 브로드캐스트 알림 생성 (공지사항 등)
 */
export async function notifyBroadcast(title: string, body: string, link?: string) {
  return createNotification({
    type: "broadcast",
    title,
    body,
    link,
    priority: 1,
  })
}

/**
 * 시스템 알림 생성
 */
export async function notifySystem(title: string, body: string, type: "info" | "success" | "warning" | "error" = "info") {
  return createNotification({
    type: "system",
    title,
    body,
    priority: type === "error" ? 3 : type === "warning" ? 2 : 1,
    metadata: {
      systemType: type,
    },
  })
}
