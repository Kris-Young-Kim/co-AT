import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { schedule_id, category, desired_date } = body

    if (!schedule_id || !category || !desired_date) {
      return NextResponse.json(
        { success: false, error: "?„ìˆ˜ ?•ë³´ê°€ ?„ë½?˜ì—ˆ?µë‹ˆ?? },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // ?¬ìš©???„ë¡œ??ì¡°íšŒ
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "?¬ìš©???•ë³´ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤" },
        { status: 404 }
      )
    }

    // ?´ë¼?´ì–¸???•ë³´ ì¡°íšŒ ?ëŠ” ?ì„±
    const { data: client, error: clientError } = await adminSupabase
      .from("clients")
      .select("id")
      .eq("id", profile.id) // ?„ì‹œë¡?profile.idë¥??¬ìš© (?¤ì œë¡œëŠ” ë³„ë„ clients ?Œì´ë¸?ì¡°íšŒ ?„ìš”)
      .maybeSingle()

    let clientId: string

    if (clientError || !client) {
      // ?´ë¼?´ì–¸?¸ê? ?†ìœ¼ë©??ì„±
      const { data: newClient, error: createClientError } = await adminSupabase
        .from("clients")
        .insert({
          name: "?ˆì•½??, // ?„ì‹œ (?¤ì œë¡œëŠ” ?„ë¡œ?„ì—???´ë¦„ ê°€?¸ì˜¤ê¸?
        })
        .select("id")
        .single()

      if (createClientError || !newClient) {
        console.error("?´ë¼?´ì–¸???ì„± ?¤ë¥˜:", createClientError)
        return NextResponse.json(
          { success: false, error: "?´ë¼?´ì–¸???•ë³´ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤" },
          { status: 500 }
        )
      }

      clientId = newClient.id
    } else {
      clientId = client.id
    }

    // ?¼ì • ?•ë³´ ì¡°íšŒ
    const { data: schedule, error: scheduleError } = await supabase
      .from("schedules")
      .select("id, schedule_type, scheduled_date")
      .eq("id", schedule_id)
      .eq("status", "scheduled")
      .single()

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { success: false, error: "?¼ì •??ì°¾ì„ ???†ê±°???ˆì•½ ê°€?¥í•œ ?íƒœê°€ ?„ë‹™?ˆë‹¤" },
        { status: 404 }
      )
    }

    // ? ì²­???ì„±
    const { data: application, error: applicationError } = await adminSupabase
      .from("applications")
      .insert({
        client_id: clientId,
        category,
        sub_category: (schedule as { schedule_type: string }).schedule_type === "exhibition" ? "exhibition" : "education",
        desired_date: desired_date,
        status: "?‘ìˆ˜",
        service_year: new Date().getFullYear(),
      })
      .select("id")
      .single()

    if (applicationError || !application) {
      console.error("? ì²­???ì„± ?¤ë¥˜:", applicationError)
      return NextResponse.json(
        {
          success: false,
          error: "?ˆì•½ ? ì²­???¤íŒ¨?ˆìŠµ?ˆë‹¤: " + (applicationError?.message || "?????†ëŠ” ?¤ë¥˜"),
        },
        { status: 500 }
      )
    }

    // ?¼ì •ê³?? ì²­???°ê²°
    const { error: updateScheduleError } = await adminSupabase
      .from("schedules")
      .update({ application_id: application.id })
      .eq("id", schedule_id)

    if (updateScheduleError) {
      console.error("?¼ì • ?…ë°?´íŠ¸ ?¤ë¥˜:", updateScheduleError)
      // ? ì²­?œëŠ” ?ì„±?˜ì—ˆ?¼ë?ë¡?ê²½ê³ ë§??˜ê³  ?±ê³µ?¼ë¡œ ì²˜ë¦¬
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: "?ˆì•½???„ë£Œ?˜ì—ˆ?µë‹ˆ??,
    })
  } catch (error) {
    console.error("?ˆì•½ API ?¤ë¥˜:", error)
    return NextResponse.json(
      { success: false, error: "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤" },
      { status: 500 }
    )
  }
}

