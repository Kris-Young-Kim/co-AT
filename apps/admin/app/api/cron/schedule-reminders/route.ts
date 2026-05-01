import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createNotification } from "@/actions/notification-actions"

/**
 * ?¼ì • ë¦¬ë§ˆ?¸ë” ?Œë¦¼ ?¤ì?ì¤„ëŸ¬
 * ë§¤ì¼ 09:00 UTC ?¤í–‰ (Vercel Cron ?ëŠ” ?¸ë? ?¤ì?ì¤„ëŸ¬)
 * ?¤ìŒ???¼ì •???ˆëŠ” ê²½ìš° ë¦¬ë§ˆ?¸ë” ?Œë¦¼ ë°œì†¡
 * 
 * ?˜ê²½ ë³€?˜ì— CRON_SECRET ?¤ì • ?„ìš”
 */
export async function GET(request: Request) {
  try {
    console.log("[Schedule Reminders] ?¼ì • ë¦¬ë§ˆ?¸ë” ?Œë¦¼ ?¤ì?ì¤„ëŸ¬ ?œì‘")

    // ë³´ì•ˆ: Cron Secret ?•ì¸ (Vercel Cron ?¬ìš© ??
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

    console.log(`[Schedule Reminders] ?¤ìŒ???¼ì • ì¡°íšŒ: ${tomorrowStr}`)

    // ?¤ìŒ???ˆì •???¼ì • ì¡°íšŒ
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
      console.error("[Schedule Reminders] ?¼ì • ì¡°íšŒ ?¤íŒ¨:", error)
      return NextResponse.json(
        {
          success: false,
          error: "?¼ì • ì¡°íšŒ???¤íŒ¨?ˆìŠµ?ˆë‹¤",
          details: String(error),
        },
        { status: 500 }
      )
    }

    if (!schedules || schedules.length === 0) {
      console.log("[Schedule Reminders] ?¤ìŒ???¼ì • ?†ìŒ")
      return NextResponse.json({
        success: true,
        notificationsCreated: 0,
        timestamp: new Date().toISOString(),
      })
    }

    console.log(`[Schedule Reminders] ${schedules.length}ê°??¼ì • ë°œê²¬`)

    let totalNotifications = 0

    // ê°??¼ì •???€??ë¦¬ë§ˆ?¸ë” ?Œë¦¼ ?ì„±
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
            : "ê³ ê°"

        // ?¼ì • ?€???œê? ë³€??        const scheduleTypeMap: Record<string, string> = {
          visit: "ë°©ë¬¸",
          consult: "?ë‹´",
          assessment: "?‰ê?",
          delivery: "ë°°ì†¡",
          pickup: "?½ì—…",
          exhibition: "ê²¬í•™",
          education: "êµìœ¡",
          custom_make: "ë§ì¶¤?œì‘",
        }

        const scheduleTypeName = scheduleTypeMap[schedule.schedule_type] || schedule.schedule_type
        const timeStr = schedule.scheduled_time ? ` ${schedule.scheduled_time}` : ""
        const addressStr = schedule.address ? ` (${schedule.address})` : ""

        // ?´ë‹¹?ì—ê²?ë¦¬ë§ˆ?¸ë” ?Œë¦¼
        if (staffId) {
          const result = await createNotification({
            userId: staffId,
            clerkUserId: clerkUserId || undefined,
            type: "schedule",
            title: "?´ì¼ ?¼ì • ë¦¬ë§ˆ?¸ë”",
            body: `${scheduleTypeName} ?¼ì •???´ì¼${timeStr}???ˆì •?˜ì–´ ?ˆìŠµ?ˆë‹¤.${addressStr}${clientName ? ` (${clientName})` : ""}`,
            link: `/schedule`,
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
            console.log(`[Schedule Reminders] ?´ë‹¹???Œë¦¼ ?ì„± ?±ê³µ: ${schedule.id}`)
          } else {
            console.error(`[Schedule Reminders] ?´ë‹¹???Œë¦¼ ?ì„± ?¤íŒ¨: ${schedule.id}`, result.error)
          }
        }

        // ?´ë¼?´ì–¸?¸ì—ê²Œë„ ë¦¬ë§ˆ?¸ë” ?Œë¦¼ (client_idê°€ ?ˆëŠ” ê²½ìš°)
        if (schedule.client_id) {
          // ?´ë¼?´ì–¸?¸ì˜ clerk_user_id ì¡°íšŒ
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
              title: "?´ì¼ ?¼ì • ?ˆë‚´",
              body: `${scheduleTypeName} ?¼ì •???´ì¼${timeStr}???ˆì •?˜ì–´ ?ˆìŠµ?ˆë‹¤.${addressStr}`,
              link: `/mypage`,
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
              console.log(`[Schedule Reminders] ?´ë¼?´ì–¸???Œë¦¼ ?ì„± ?±ê³µ: ${schedule.id}`)
            } else {
              console.error(`[Schedule Reminders] ?´ë¼?´ì–¸???Œë¦¼ ?ì„± ?¤íŒ¨: ${schedule.id}`, clientResult.error)
            }
          }
        }
      } catch (error) {
        console.error(`[Schedule Reminders] ?¼ì • ${schedule.id} ?Œë¦¼ ?ì„± ì¤??¤ë¥˜:`, error)
        // ê°œë³„ ?¼ì • ?Œë¦¼ ?¤íŒ¨?´ë„ ê³„ì† ì§„í–‰
      }
    }

    console.log(`[Schedule Reminders] ?„ë£Œ: ì´?${totalNotifications}ê°??Œë¦¼ ?ì„±`)

    return NextResponse.json({
      success: true,
      notificationsCreated: totalNotifications,
      schedulesProcessed: schedules.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Schedule Reminders] ?¤ì?ì¤„ëŸ¬ ?¤í–‰ ì¤??¤ë¥˜:", error)
    return NextResponse.json(
      {
        success: false,
        error: "?¼ì • ë¦¬ë§ˆ?¸ë” ?Œë¦¼ ?¤ì?ì¤„ëŸ¬ ?¤í–‰ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
