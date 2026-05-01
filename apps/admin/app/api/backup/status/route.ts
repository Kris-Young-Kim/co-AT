import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@co-at/auth"

/**
 * 백업 ?�태 조회 API
 * GET /api/backup/status?type=daily|weekly|monthly&limit=10
 */
export async function GET(request: Request) {
  try {
    console.log("[Backup Status API] 백업 ?�태 조회")

    // 권한 ?�인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "권한???�습?�다" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const backupType = searchParams.get("type") as "daily" | "weekly" | "monthly" | null
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const supabase = await createClient()

    // 백업 로그 조회
    let query = supabase
      .from("backup_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit)

    if (backupType) {
      query = query.eq("backup_type", backupType)
    }

    const { data: backups, error } = await query

    if (error) {
      console.error("[Backup Status API] 백업 로그 조회 ?�패:", error)
      return NextResponse.json(
        { error: "백업 로그 조회???�패?�습?�다", details: error.message },
        { status: 500 }
      )
    }

    // ?�계 ?�보 계산
    const stats = {
      total: backups?.length || 0,
      byType: {
        daily: backups?.filter((b: any) => b.backup_type === "daily").length || 0,
        weekly: backups?.filter((b: any) => b.backup_type === "weekly").length || 0,
        monthly: backups?.filter((b: any) => b.backup_type === "monthly").length || 0,
        manual: backups?.filter((b: any) => b.backup_type === "manual").length || 0,
      },
      byStatus: {
        completed: backups?.filter((b: any) => b.status === "completed").length || 0,
        failed: backups?.filter((b: any) => b.status === "failed").length || 0,
        in_progress: backups?.filter((b: any) => b.status === "in_progress").length || 0,
      },
      latestBackup: backups?.[0] || null,
      restoreTestStatus: {
        passed: backups?.filter((b: any) => b.restore_test_status === "passed").length || 0,
        failed: backups?.filter((b: any) => b.restore_test_status === "failed").length || 0,
        not_tested: backups?.filter((b: any) => b.restore_test_status === "not_tested" || !b.restore_test_status).length || 0,
      },
    }

    console.log("[Backup Status API] 백업 ?�태 조회 ?�공:", stats)

    return NextResponse.json({
      backups: backups || [],
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Backup Status API] 백업 ?�태 조회 ?�패:", error)
    return NextResponse.json(
      { error: "백업 ?�태 조회???�패?�습?�다", details: String(error) },
      { status: 500 }
    )
  }
}
