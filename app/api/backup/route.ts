import { NextResponse } from "next/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { runBackup } from "@/scripts/backup"

type BackupType = "daily" | "weekly" | "monthly" | "manual"

/**
 * 백업 실행 API
 * POST /api/backup?type=daily|weekly|monthly|manual
 */
export async function POST(request: Request) {
  try {
    console.log("[Backup API] 백업 요청 수신")

    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      )
    }

    // 백업 타입 확인
    const { searchParams } = new URL(request.url)
    const backupType = (searchParams.get("type") || "manual") as BackupType

    if (!["daily", "weekly", "monthly", "manual"].includes(backupType)) {
      return NextResponse.json(
        { error: "유효하지 않은 백업 타입입니다. daily, weekly, monthly, manual 중 하나를 선택하세요." },
        { status: 400 }
      )
    }

    // 백업 실행
    const result = await runBackup(backupType)

    if (result.success) {
      console.log("[Backup API] 백업 성공:", result.backupName)
      return NextResponse.json({
        success: true,
        backupId: result.backupId,
        backupName: result.backupName,
        tablesCount: result.tablesCount,
        recordsCount: result.recordsCount,
      })
    } else {
      console.error("[Backup API] 백업 실패:", result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Backup API] 백업 요청 처리 실패:", error)
    return NextResponse.json(
      { error: "백업 요청 처리에 실패했습니다", details: String(error) },
      { status: 500 }
    )
  }
}
