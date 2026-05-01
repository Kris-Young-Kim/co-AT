import { NextResponse } from "next/server"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { runBackup } from "@/scripts/backup"

type BackupType = "daily" | "weekly" | "monthly" | "manual"

/**
 * ë°±ì—… ?¤í–‰ API
 * POST /api/backup?type=daily|weekly|monthly|manual
 */
export async function POST(request: Request) {
  try {
    console.log("[Backup API] ë°±ì—… ?”ì²­ ?˜ì‹ ")

    // ê¶Œí•œ ?•ì¸
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "ê¶Œí•œ???†ìŠµ?ˆë‹¤" },
        { status: 403 }
      )
    }

    // ë°±ì—… ?€???•ì¸
    const { searchParams } = new URL(request.url)
    const backupType = (searchParams.get("type") || "manual") as BackupType

    if (!["daily", "weekly", "monthly", "manual"].includes(backupType)) {
      return NextResponse.json(
        { error: "? íš¨?˜ì? ?Šì? ë°±ì—… ?€?…ì…?ˆë‹¤. daily, weekly, monthly, manual ì¤??˜ë‚˜ë¥?? íƒ?˜ì„¸??" },
        { status: 400 }
      )
    }

    // ë°±ì—… ?¤í–‰
    const result = await runBackup(backupType)

    if (result.success) {
      console.log("[Backup API] ë°±ì—… ?±ê³µ:", result.backupName)
      return NextResponse.json({
        success: true,
        backupId: result.backupId,
        backupName: result.backupName,
        tablesCount: result.tablesCount,
        recordsCount: result.recordsCount,
      })
    } else {
      console.error("[Backup API] ë°±ì—… ?¤íŒ¨:", result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Backup API] ë°±ì—… ?”ì²­ ì²˜ë¦¬ ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "ë°±ì—… ?”ì²­ ì²˜ë¦¬???¤íŒ¨?ˆìŠµ?ˆë‹¤", details: String(error) },
      { status: 500 }
    )
  }
}
