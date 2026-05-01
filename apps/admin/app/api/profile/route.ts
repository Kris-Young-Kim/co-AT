import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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
      console.error("[Profile GET] ?„ë¡œ??ì¡°íšŒ ?¤ë¥˜:", error)
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

