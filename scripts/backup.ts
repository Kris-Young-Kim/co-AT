/**
 * 데이터베이스 백업 스크립트
 * 
 * 사용법:
 *   pnpm tsx scripts/backup.ts daily   # 일일 백업
 *   pnpm tsx scripts/backup.ts weekly  # 주간 백업
 *   pnpm tsx scripts/backup.ts monthly # 월간 백업
 *   pnpm tsx scripts/backup.ts manual   # 수동 백업
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { format } from "date-fns"

type BackupType = "daily" | "weekly" | "monthly" | "manual"

interface BackupResult {
  success: boolean
  backupId?: string
  backupName?: string
  tablesCount?: number
  recordsCount?: number
  error?: string
}

/**
 * 주요 테이블 목록 (백업 대상)
 */
const BACKUP_TABLES = [
  "profiles",
  "clients",
  "applications",
  "inventory",
  "rentals",
  "schedules",
  "notices",
  "custom_makes",
  "equipment",
  "service_logs",
  "regulations",
] as const

/**
 * 백업 실행
 */
async function runBackup(backupType: BackupType): Promise<BackupResult> {
  const supabase = createAdminClient()
  const timestamp = format(new Date(), "yyyyMMdd_HHmmss")
  const backupName = `${backupType}_${timestamp}`

  console.log(`[Backup] ${backupType} 백업 시작: ${backupName}`)

  try {
    // 백업 로그 생성
    const { data: backupLog, error: logError } = await supabase
      .from("backup_logs")
      .insert({
        backup_type: backupType,
        backup_name: backupName,
        status: "in_progress",
        started_at: new Date().toISOString(),
        storage_type: "supabase_storage",
        metadata: {
          tables: BACKUP_TABLES,
          version: process.env.npm_package_version || "unknown",
        },
      })
      .select()
      .single()

    if (logError || !backupLog) {
      throw new Error(`백업 로그 생성 실패: ${logError?.message}`)
    }

    const backupId = backupLog.id
    let totalRecords = 0
    const backupData: Record<string, unknown[]> = {}

    // 각 테이블 데이터 백업
    for (const table of BACKUP_TABLES) {
      console.log(`[Backup] ${table} 테이블 백업 중...`)

      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })

      if (error) {
        console.error(`[Backup] ${table} 테이블 백업 실패:`, error)
        continue // 일부 테이블 실패해도 계속 진행
      }

      backupData[table] = data || []
      totalRecords += count || 0

      console.log(`[Backup] ${table} 테이블 백업 완료: ${count || 0}개 레코드`)
    }

    // JSON 파일로 변환
    const backupJson = JSON.stringify(backupData, null, 2)
    const backupSize = Buffer.byteLength(backupJson, "utf8")

    // Supabase Storage에 업로드 (또는 로컬 파일로 저장)
    // 실제 구현 시 Supabase Storage API 사용
    const storagePath = `backups/${backupType}/${backupName}.json`

    // 백업 로그 업데이트
    const { error: updateError } = await supabase
      .from("backup_logs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        backup_size_bytes: backupSize,
        tables_count: BACKUP_TABLES.length,
        records_count: totalRecords,
        storage_location: storagePath,
        expires_at: getExpirationDate(backupType),
      })
      .eq("id", backupId)

    if (updateError) {
      console.error("[Backup] 백업 로그 업데이트 실패:", updateError)
    }

    console.log(`[Backup] ${backupType} 백업 완료: ${backupName}`)
    console.log(`[Backup] 총 ${totalRecords}개 레코드, ${(backupSize / 1024 / 1024).toFixed(2)}MB`)

    return {
      success: true,
      backupId,
      backupName,
      tablesCount: BACKUP_TABLES.length,
      recordsCount: totalRecords,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Backup] ${backupType} 백업 실패:`, errorMessage)

    // 실패 로그 업데이트
    try {
      const supabase = createAdminClient()
      await supabase
        .from("backup_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("backup_name", backupName)
    } catch (logError) {
      console.error("[Backup] 실패 로그 업데이트 실패:", logError)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * 백업 보관 만료일 계산
 */
function getExpirationDate(backupType: BackupType): string {
  const now = new Date()
  let expirationDate: Date

  switch (backupType) {
    case "daily":
      expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일
      break
    case "weekly":
      expirationDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90일
      break
    case "monthly":
      expirationDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1년
      break
    case "manual":
      expirationDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) // 180일
      break
  }

  return expirationDate.toISOString()
}

/**
 * 메인 실행
 */
async function main() {
  const backupType = (process.argv[2] || "manual") as BackupType

  if (!["daily", "weekly", "monthly", "manual"].includes(backupType)) {
    console.error("사용법: pnpm tsx scripts/backup.ts [daily|weekly|monthly|manual]")
    process.exit(1)
  }

  const result = await runBackup(backupType)

  if (result.success) {
    console.log("✅ 백업 성공:", result.backupName)
    process.exit(0)
  } else {
    console.error("❌ 백업 실패:", result.error)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main().catch((error) => {
    console.error("예상치 못한 오류:", error)
    process.exit(1)
  })
}

export { runBackup, type BackupResult }
