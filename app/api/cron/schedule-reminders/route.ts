import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createNotification } from "@/actions/notification-actions"

/**
 * 일정 리마인더 알림 스케줄러
 * 매일 09:00 UTC 실행 (Vercel Cron 또는 외부 스케줄러)
 * 다음날 일정이 있는 경우 리마인더 알림 발송
 * 
 * 환경 변수에 CRON_SECRET 설정 필요
 */
export async function GET(request: Request) {
  try {
    console.log("[Schedule Reminders] 일정 리마인더 알림 스케줄러 시작")

    // 보안: Cron Secret 확인 (Vercel Cron 사용 시)
    const authHeader = request.headers.get("Authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0] // YYYY-MM-DD

    console.log(`[Schedule Reminders] 다음날 일정 조회: ${tomorrowStr}`)

    // 다음날 예정된 일정 조회
    const { data: schedules, error } = await supabase
      .from("schedules")
      .select(
        `
        id,
        application_id,
        staff_id,
        client_id,
        schedule_type,
        scheduled_date,
        scheduled_time,
        address,
        notes,
        status,
        profiles:staff_id (
          id,
          clerk_user_id
        ),
        clients:client_id (
          id,
          name
        )
      `
      )
      .eq("scheduled_date", tomorrowStr)
      .eq("status", "scheduled")

    if (error) {
      console.error("[Schedule Reminders] 일정 조회 실패:", error)
      return NextResponse.json(
        {
          success: false,
          error: "일정 조회에 실패했습니다",
          details: String(error),
        },
        { status: 500 }
      )
    }

    if (!schedules || schedules.length === 0) {
      console.log("[Schedule Reminders] 다음날 일정 없음")
      return NextResponse.json({
        success: true,
        notificationsCreated: 0,
        timestamp: new Date().toISOString(),
      })
    }

    console.log(`[Schedule Reminders] ${schedules.length}개 일정 발견`)

    let totalNotifications = 0

    // 각 일정에 대해 리마인더 알림 생성
    for (const schedule of schedules) {
      try {
        const staffId = schedule.staff_id
        const clerkUserId =
          schedule.profiles && typeof schedule.profiles === "object" && "clerk_user_id" in schedule.profiles
            ? (schedule.profiles as any).clerk_user_id
            : null

        const clientName =
          schedule.clients && typeof schedule.clients === "object" && "name" in schedule.clients
            ? (schedule.clients as any).name
            : "고객"

        // 일정 타입 한글 변환
        const scheduleTypeMap: Record<string, string> = {
          visit: "방문",
          consult: "상담",
          assessment: "평가",
          delivery: "배송",
          pickup: "픽업",
          exhibition: "견학",
          education: "교육",
          custom_make: "맞춤제작",
        }

        const scheduleTypeName = scheduleTypeMap[schedule.schedule_type] || schedule.schedule_type
        const timeStr = schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ""
        const addressStr = schedule.address ? ` (${schedule.address})` : ""

        // 담당자에게 리마인더 알림
        if (staffId) {
          const result = await createNotification({
            userId: staffId,
            clerkUserId: clerkUserId || undefined,
            type: "schedule",
            title: "내일 일정 리마인더",
            body: `${scheduleTypeName} 일정이 내일${timeStr}에 예정되어 있습니다.${addressStr}${clientName ? ` (${clientName})` : ""}`,
            link: `/admin/schedule`,
            priority: 2,
            metadata: {
              scheduleId: schedule.id,
              scheduleType: schedule.schedule_type,
              scheduledDate: schedule.scheduled_date,
              scheduledTime: schedule.scheduled_time,
            },
          })

          if (result.success) {
            totalNotifications++
            console.log(`[Schedule Reminders] 담당자 알림 생성 성공: ${schedule.id}`)
          } else {
            console.error(`[Schedule Reminders] 담당자 알림 생성 실패: ${schedule.id}`, result.error)
          }
        }

        // 클라이언트에게도 리마인더 알림 (client_id가 있는 경우)
        if (schedule.client_id) {
          // 클라이언트의 clerk_user_id 조회
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("id, clerk_user_id")
            .eq("id", schedule.client_id)
            .single()

          if (clientProfile && clientProfile.clerk_user_id) {
            const clientResult = await createNotification({
              userId: schedule.client_id,
              clerkUserId: clientProfile.clerk_user_id,
              type: "schedule",
              title: "내일 일정 안내",
              body: `${scheduleTypeName} 일정이 내일${timeStr}에 예정되어 있습니다.${addressStr}`,
              link: `/portal/mypage`,
              priority: 1,
              metadata: {
                scheduleId: schedule.id,
                scheduleType: schedule.schedule_type,
                scheduledDate: schedule.scheduled_date,
                scheduledTime: schedule.scheduled_time,
              },
            })

            if (clientResult.success) {
              totalNotifications++
              console.log(`[Schedule Reminders] 클라이언트 알림 생성 성공: ${schedule.id}`)
            } else {
              console.error(`[Schedule Reminders] 클라이언트 알림 생성 실패: ${schedule.id}`, clientResult.error)
            }
          }
        }
      } catch (error) {
        console.error(`[Schedule Reminders] 일정 ${schedule.id} 알림 생성 중 오류:`, error)
        // 개별 일정 알림 실패해도 계속 진행
      }
    }

    console.log(`[Schedule Reminders] 완료: 총 ${totalNotifications}개 알림 생성`)

    return NextResponse.json({
      success: true,
      notificationsCreated: totalNotifications,
      schedulesProcessed: schedules.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Schedule Reminders] 스케줄러 실행 중 오류:", error)
    return NextResponse.json(
      {
        success: false,
        error: "일정 리마인더 알림 스케줄러 실행 중 오류가 발생했습니다",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
