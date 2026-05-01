import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { hasManagerPermission } from "@co-at/auth"

/**
 * ?¹ì • ?¬ìš©?ì˜ ??•  ë³€ê²?(admin, managerë§??‘ê·¼ ê°€??
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasPermission = await hasManagerPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "ê´€ë¦¬ì ?ëŠ” ë§¤ë‹ˆ?€ ê¶Œí•œ???„ìš”?©ë‹ˆ?? },
        { status: 403 }
      )
    }

    const { id } = await params
    const { role } = await req.json()

    if (!role || !["user", "staff", "manager", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "? íš¨????• ??ì§€?•í•´ì£¼ì„¸??(user, staff, manager, admin)" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // ?„ë¡œ???…ë°?´íŠ¸
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Users] ??•  ?…ë°?´íŠ¸ ?¤íŒ¨:", error)
      return NextResponse.json(
        { 
          error: "??•  ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤", 
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      )
    }

    console.log("[Admin Users] ??•  ?…ë°?´íŠ¸ ?±ê³µ:", updatedProfile)

    return NextResponse.json({
      success: true,
      message: `??• ??"${role}"ë¡?ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤`,
      profile: updatedProfile,
    })
  } catch (error) {
    console.error("[Admin Users] ?ˆì™¸ ë°œìƒ:", error)
    return NextResponse.json(
      { 
        error: "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤", 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

