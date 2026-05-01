import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * ?„ì¬ ë¡œê·¸?¸í•œ ?¬ìš©?ì˜ ?„ë¡œ?„ì„ ?˜ë™?¼ë¡œ ?ì„±?˜ëŠ” API
 * ?ŒìŠ¤??ê°œë°œ?©ìœ¼ë¡œë§Œ ?¬ìš©?˜ì„¸?? */
export async function POST() {
  try {
    console.log("[Profile Create] ?„ë¡œ???ì„± ?”ì²­ ?œì‘")
    const { userId } = await auth()
    
    if (!userId) {
      console.log("[Profile Create] ?¬ìš©??ID ?†ìŒ")
      return NextResponse.json(
        { error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? },
        { status: 401 }
      )
    }

    console.log("[Profile Create] ?¬ìš©??ID:", userId)

    // Clerk?ì„œ ?¬ìš©???•ë³´ ê°€?¸ì˜¤ê¸?    const user = await currentUser()
    
    if (!user) {
      console.log("[Profile Create] Clerk ?¬ìš©???•ë³´ ?†ìŒ")
      return NextResponse.json(
        { error: "?¬ìš©???•ë³´ë¥?ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤" },
        { status: 400 }
      )
    }

    // Clerk ë©”í??°ì´?°ì—??role ?•ì¸
    const clerkRole = (user.publicMetadata?.role as string) || 
                      (user.privateMetadata?.role as string) || 
                      null

    console.log("[Profile Create] Clerk ?¬ìš©???•ë³´:", {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      clerkRole,
    })

    // ?„ë¡œ???ì„±?€ ?œë¹„????• ???¬ìš©?˜ì—¬ RLS ?°íšŒ
    const supabase = createAdminClient()

    // ?´ë? ?„ë¡œ?„ì´ ?ˆëŠ”ì§€ ?•ì¸
    console.log("[Profile Create] ê¸°ì¡´ ?„ë¡œ???•ì¸ ì¤?..")
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, role, clerk_user_id")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[Profile Create] ?„ë¡œ???•ì¸ ì¤??¤ë¥˜:", checkError)
      return NextResponse.json(
        { 
          error: "?„ë¡œ???•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤", 
          details: checkError.message,
          code: checkError.code,
        },
        { status: 500 }
      )
    }

    if (existingProfile) {
      console.log("[Profile Create] ?„ë¡œ???´ë? ì¡´ì¬:", existingProfile)
      
      // ??• ??"user"??ê²½ìš° "manager"ë¡??…ë°?´íŠ¸ ?œì•ˆ
      if (existingProfile.role === "user") {
        return NextResponse.json({
          success: false,
          message: "?„ë¡œ?„ì´ ?´ë? ì¡´ì¬?˜ì?ë§???• ??'user'?…ë‹ˆ?? ê´€ë¦¬ì ê¶Œí•œ???»ìœ¼?¤ë©´ ??• ???…ë°?´íŠ¸?˜ì„¸??",
          profile: existingProfile,
          clerkUserId: userId,
          needsRoleUpdate: true,
        })
      }
      
      return NextResponse.json({
        success: true,
        message: "?„ë¡œ?„ì´ ?´ë? ì¡´ì¬?©ë‹ˆ??,
        profile: existingProfile,
        clerkUserId: userId,
      })
    }

    // ?„ë¡œ???ì„±
    const fullName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || null
    
    const email = user.emailAddresses?.[0]?.emailAddress || null

    // Clerk ë©”í??°ì´?°ì˜ role???°ë¼ ?„ë¡œ??role ?¤ì •
    const profileRole =
      clerkRole === "admin"
        ? "admin"
        : clerkRole === "staff"
          ? "staff"
          : clerkRole === "manager"
            ? "manager"
            : "user"

    console.log("[Profile Create] ?„ë¡œ???ì„± ?œë„:", {
      clerk_user_id: userId,
      email,
      full_name: fullName,
      clerkRole,
      profileRole,
    })

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        clerk_user_id: userId,
        email,
        full_name: fullName,
        role: profileRole,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[Profile Create] ?„ë¡œ???ì„± ?¤íŒ¨:", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      })
      return NextResponse.json(
        { 
          error: "?„ë¡œ???ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤", 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      )
    }

    console.log("[Profile Create] ?„ë¡œ???ì„± ?±ê³µ:", newProfile)

    return NextResponse.json({
      success: true,
      message: "?„ë¡œ?„ì´ ?ì„±?˜ì—ˆ?µë‹ˆ??,
      profile: newProfile,
      clerkUserId: userId,
    })
  } catch (error) {
    console.error("[Profile Create] ?ˆì™¸ ë°œìƒ:", error)
    return NextResponse.json(
      { 
        error: "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * ?„ì¬ ?¬ìš©?ì˜ Clerk ID?€ ?„ë¡œ???íƒœ ?•ì¸
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? },
        { status: 401 }
      )
    }

    const user = await currentUser()
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle()

    // PGRST116?€ "ê²°ê³¼ ?†ìŒ"???˜ë??˜ëŠ” ?•ìƒ?ì¸ ì½”ë“œ?…ë‹ˆ??    if (error && error.code !== 'PGRST116') {
      console.error("[Profile Create GET] ?„ë¡œ??ì¡°íšŒ ?¤ë¥˜:", error)
      return NextResponse.json({
        clerkUserId: userId,
        clerkUser: {
          id: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
        },
        profile: null,
        profileExists: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      clerkUserId: userId,
      clerkUser: {
        id: user?.id,
        email: user?.emailAddresses?.[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      profile: profile || null,
      profileExists: !!profile,
      error: null,
    })
  } catch (error) {
    console.error("?„ë¡œ??ì¡°íšŒ ì¤??¤ë¥˜:", error)
    return NextResponse.json(
      { error: "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤", details: String(error) },
      { status: 500 }
    )
  }
}

