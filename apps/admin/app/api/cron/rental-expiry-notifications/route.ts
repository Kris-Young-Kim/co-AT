import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notifyRentalExpiry } from "@/lib/utils/notification-helper"

/**
 * ?€??ë§Œë£Œ ?Œë¦¼ ?¤ì?ì¤„ëŸ¬
 * ë§¤ì¼ 09:00 UTC ?¤í–‰ (Vercel Cron ?ëŠ” ?¸ë? ?¤ì?ì¤„ëŸ¬)
 * 
 * ?˜ê²½ ë³€?˜ì— CRON_SECRET ?¤ì • ?„ìš”
 */
export async function GET(request: Request) {
  try {
    console.log("[Rental Expiry Notifications] ?€??ë§Œë£Œ ?Œë¦¼ ?¤ì?ì¤„ëŸ¬ ?œì‘")

    // ë³´ì•ˆ: Cron Secret ?•ì¸ (Vercel Cron ?¬ìš© ??
    const authHeader = request.headers.get("Authorization")
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

      console.log(`[Rental Expiry Notifications] ${days}????ë§Œë£Œ ?€??ì¡°íšŒ: ${targetDateStr}`)

      // ë§Œë£Œ ?ˆì • ?€??ì¡°íšŒ
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
        console.error(`[Rental Expiry Notifications] ${days}????ë§Œë£Œ ?€??ì¡°íšŒ ?¤íŒ¨:`, error)
        continue
      }

      if (!rentals || rentals.length === 0) {
        console.log(`[Rental Expiry Notifications] ${days}????ë§Œë£Œ ?€???†ìŒ`)
        continue
      }

      // ê°??€?¬ì— ?€???Œë¦¼ ?ì„±
      for (const rental of rentals) {
        const clientId = rental.client_id
        const clerkUserId =
          rental.clients && typeof rental.clients === "object" && "clerk_user_id" in rental.clients
            ? (rental.clients as any).clerk_user_id
            : null
        const deviceName =
          rental.inventory && typeof rental.inventory === "object" && "name" in rental.inventory
            ? (rental.inventory as any).name
            : "ë³´ì¡°ê¸°ê¸°"

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
            `[Rental Expiry Notifications] ?Œë¦¼ ?ì„± ?±ê³µ: ${rental.id} (${days}????ë§Œë£Œ)`
          )
        } else {
          console.error(
            `[Rental Expiry Notifications] ?Œë¦¼ ?ì„± ?¤íŒ¨: ${rental.id}`,
            result.error
          )
        }
      }
    }

    console.log(`[Rental Expiry Notifications] ?„ë£Œ: ì´?${totalNotifications}ê°??Œë¦¼ ?ì„±`)

    return NextResponse.json({
      success: true,
      notificationsCreated: totalNotifications,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Rental Expiry Notifications] ?¤ì?ì¤„ëŸ¬ ?¤í–‰ ì¤??¤ë¥˜:", error)
    return NextResponse.json(
      {
        success: false,
        error: "?€??ë§Œë£Œ ?Œë¦¼ ?¤ì?ì¤„ëŸ¬ ?¤í–‰ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
