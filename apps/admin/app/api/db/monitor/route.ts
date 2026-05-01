import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSlowQueryLogs } from "@/lib/utils/query-logger"
import { hasAdminOrStaffPermission } from "@co-at/auth"

/**
 * ?°ì´?°ë² ?´ìŠ¤ ëª¨ë‹ˆ?°ë§ ?•ë³´ ì¡°íšŒ
 * - ?¬ë¡œ??ì¿¼ë¦¬ ë¡œê·¸
 * - ?°ê²° ?€ ?íƒœ (Supabase??ì§ì ‘ ?œê³µ?˜ì? ?Šìœ¼ë¯€ë¡?ê¸°ë³¸ ?•ë³´ë§?
 */
export async function GET() {
  try {
    console.log("[DB Monitor] ëª¨ë‹ˆ?°ë§ ?•ë³´ ì¡°íšŒ ?œì‘")

    // ê¶Œí•œ ?•ì¸
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "ê¶Œí•œ???†ìŠµ?ˆë‹¤" },
        { status: 403 }
      )
    }

    // ?¬ë¡œ??ì¿¼ë¦¬ ë¡œê·¸ ì¡°íšŒ
    const slowQueries = getSlowQueryLogs(50)

    // ?°ì´?°ë² ?´ìŠ¤ ?°ê²° ?ŒìŠ¤??(ê°„ì ‘?ì¸ ?°ê²° ?€ ?íƒœ ?•ì¸)
    const supabase = await createClient()
    const connectionTestStart = Date.now()
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)

    const connectionLatency = Date.now() - connectionTestStart

    // ?°ê²° ?€ ?íƒœ ì¶”ì • (?¤ì œ Supabase???°ê²° ?€ ?•ë³´ë¥?ì§ì ‘ ?œê³µ?˜ì? ?ŠìŒ)
    const poolStatus = {
      connected: !error,
      latency: connectionLatency,
      status: error ? "error" : connectionLatency > 1000 ? "slow" : "healthy",
      error: error?.message,
    }

    const response = {
      slowQueries: {
        count: slowQueries.length,
        threshold: "1000ms",
        logs: slowQueries,
      },
      connectionPool: poolStatus,
      timestamp: new Date().toISOString(),
    }

    console.log("[DB Monitor] ëª¨ë‹ˆ?°ë§ ?•ë³´ ì¡°íšŒ ?±ê³µ:", {
      slowQueriesCount: slowQueries.length,
      connectionStatus: poolStatus.status,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("[DB Monitor] ëª¨ë‹ˆ?°ë§ ?•ë³´ ì¡°íšŒ ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "ëª¨ë‹ˆ?°ë§ ?•ë³´ ì¡°íšŒ???¤íŒ¨?ˆìŠµ?ˆë‹¤", details: String(error) },
      { status: 500 }
    )
  }
}
