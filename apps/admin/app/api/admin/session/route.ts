import { auth } from "@clerk/nextjs/server"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?¤ì •
 * POST: ê´€ë¦¬ì ë¡œê·¸?????¸ì…˜ ì¿ í‚¤ ?¤ì •
 * GET: ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?•ì¸
 * DELETE: ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?? œ (ë¡œê·¸?„ì›ƒ)
 */
export async function POST() {
  try {
    dbgLog('api/admin/session/POST:start', 'POST ?¸ë“¤???œì‘', {})
    const { userId } = await auth()
    dbgLog('api/admin/session/POST:auth', 'auth() ?„ë£Œ', { hasUserId: !!userId })
    if (!userId) {
      return NextResponse.json(
        { error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? },
        { status: 401 }
      )
    }

    // ê¶Œí•œ ?•ì¸
    console.log("[Admin Session] ê¶Œí•œ ?•ì¸ ?œì‘ - userId:", userId)
    const hasPermission = await hasAdminOrStaffPermission()
    dbgLog('api/admin/session/POST:permission', 'ê¶Œí•œ ?•ì¸ ?„ë£Œ', { hasPermission })
    console.log("[Admin Session] ê¶Œí•œ ?•ì¸ ê²°ê³¼:", hasPermission)
    
    if (!hasPermission) {
      // ???ì„¸???•ë³´ë¥??„í•´ ??•  ?•ì¸
      const { getCurrentUserRole } = await import("@co-at/auth")
      const role = await getCurrentUserRole()
      console.log("[Admin Session] ?„ì¬ ?¬ìš©????• :", role)
      
      return NextResponse.json(
        { 
          error: "ê´€ë¦¬ì ê¶Œí•œ???†ìŠµ?ˆë‹¤",
          details: `?„ì¬ ??• : ${role || "?†ìŒ"}. ê´€ë¦¬ì ê¶Œí•œ???»ìœ¼?¤ë©´ ??• ??"manager", "staff", ?ëŠ” "admin"?´ì–´???©ë‹ˆ??`,
          userId,
        },
        { status: 403 }
      )
    }

    // ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?¤ì •
    const cookieStore = await cookies()
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24?œê°„
      path: '/',
    })

    return NextResponse.json({ 
      success: true,
      message: "ê´€ë¦¬ì ?¸ì…˜???¤ì •?˜ì—ˆ?µë‹ˆ??
    })
  } catch (error) {
    console.error("ê´€ë¦¬ì ?¸ì…˜ ?¤ì • ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "?¸ì…˜ ?¤ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤" },
      { status: 500 }
    )
  }
}

/** ë¡œê·¸ ?¬í¼ - debug ëª¨ë“œ */
function dbgLog(location: string, message: string, data: object) {
  fetch('http://127.0.0.1:7243/ingest/019d36bc-4964-4ab1-b760-13c472a4ead0', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, hypothesisId: 'H4', timestamp: Date.now() }) }).catch(() => {})
}

/**
 * ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?•ì¸
 */
export async function GET() {
  try {
    dbgLog('api/admin/session/GET:start', 'GET ?¸ë“¤???œì‘', {})
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')?.value
    dbgLog('api/admin/session/GET:cookies', 'ì¿ í‚¤ ?•ì¸', { hasAdminSession: !!adminSession })

    if (!adminSession) {
      return NextResponse.json({
        hasAdminSession: false,
        message: "ê´€ë¦¬ì ?¸ì…˜???†ìŠµ?ˆë‹¤"
      })
    }

    // ?¸ì…˜???ˆìœ¼ë©?ê¶Œí•œ???•ì¸
    const { userId } = await auth()
    dbgLog('api/admin/session/GET:auth', 'auth() ?„ë£Œ', { hasUserId: !!userId })
    if (!userId) {
      return NextResponse.json({
        hasAdminSession: false,
        message: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??
      })
    }

    const hasPermission = await hasAdminOrStaffPermission()
    dbgLog('api/admin/session/GET:permission', 'ê¶Œí•œ ?•ì¸ ?„ë£Œ', { hasPermission })
    return NextResponse.json({
      hasAdminSession: true,
      hasPermission,
      message: hasPermission ? "ê´€ë¦¬ì ?¸ì…˜??? íš¨?©ë‹ˆ?? : "ê¶Œí•œ???†ìŠµ?ˆë‹¤"
    })
  } catch (error) {
    dbgLog('api/admin/session/GET:error', 'GET ?ˆì™¸', { error: String(error) })
    console.error("ê´€ë¦¬ì ?¸ì…˜ ?•ì¸ ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "?¸ì…˜ ?•ì¸???¤íŒ¨?ˆìŠµ?ˆë‹¤" },
      { status: 500 }
    )
  }
}

/**
 * ê´€ë¦¬ì ?¸ì…˜ ì¿ í‚¤ ?? œ (ë¡œê·¸?„ì›ƒ)
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')

    return NextResponse.json({
      success: true,
      message: "ê´€ë¦¬ì ?¸ì…˜???? œ?˜ì—ˆ?µë‹ˆ??
    })
  } catch (error) {
    console.error("ê´€ë¦¬ì ?¸ì…˜ ?? œ ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "?¸ì…˜ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤" },
      { status: 500 }
    )
  }
}

