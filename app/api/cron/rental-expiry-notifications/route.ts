import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyRentalExpiry } from "@/lib/utils/notification-helper"

/**
 * 대여 만료 알림 스케줄러
 * 매일 09:00 UTC 실행 (Vercel Cron 또는 외부 스케줄러)
 * 
 * 환경 변수에 CRON_SECRET 설정 필요
 */
export async function GET(request: Request) {
  try {
    console.log("[Rental Expiry Notifications] 대여 만료 알림 스케줄러 시작")

    // 보안: Cron Secret 확인 (Vercel Cron 사용 시)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()
    const today = new Date()
    const daysToCheck = [7, 3, 0] // D-7, D-3, D-0

    let totalNotifications = 0

    for (const days of daysToCheck) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + days)
      const targetDateStr = targetDate.toISOString().split("T")[0] // YYYY-MM-DD

      console.log(`[Rental Expiry Notifications] ${days}일 후 만료 대여 조회: ${targetDateStr}`)

      // 만료 예정 대여 조회
      const { data: rentals, error } = await supabase
        .from("rentals")
        .select(
          `
          id,
          client_id,
          rental_end_date,
          inventory:inventory_id (
            name
          ),
          clients:client_id (
            id,
            clerk_user_id:profiles!rentals_client_id_fkey (
              clerk_user_id
            )
          )
        `
        )
        .eq("status", "rented")
        .eq("rental_end_date", targetDateStr)

      if (error) {
        console.error(`[Rental Expiry Notifications] ${days}일 후 만료 대여 조회 실패:`, error)
        continue
      }

      if (!rentals || rentals.length === 0) {
        console.log(`[Rental Expiry Notifications] ${days}일 후 만료 대여 없음`)
        continue
      }

      // 각 대여에 대해 알림 생성
      for (const rental of rentals) {
        const clientId = rental.client_id
        const clerkUserId =
          rental.clients && typeof rental.clients === "object" && "clerk_user_id" in rental.clients
            ? (rental.clients as any).clerk_user_id
            : null
        const deviceName =
          rental.inventory && typeof rental.inventory === "object" && "name" in rental.inventory
            ? (rental.inventory as any).name
            : "보조기기"

        const result = await notifyRentalExpiry(
          rental.id,
          clientId,
          clerkUserId,
          days,
          deviceName
        )

        if (result.success) {
          totalNotifications++
          console.log(
            `[Rental Expiry Notifications] 알림 생성 성공: ${rental.id} (${days}일 후 만료)`
          )
        } else {
          console.error(
            `[Rental Expiry Notifications] 알림 생성 실패: ${rental.id}`,
            result.error
          )
        }
      }
    }

    console.log(`[Rental Expiry Notifications] 완료: 총 ${totalNotifications}개 알림 생성`)

    return NextResponse.json({
      success: true,
      notificationsCreated: totalNotifications,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Rental Expiry Notifications] 스케줄러 실행 중 오류:", error)
    return NextResponse.json(
      {
        success: false,
        error: "대여 만료 알림 스케줄러 실행 중 오류가 발생했습니다",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
