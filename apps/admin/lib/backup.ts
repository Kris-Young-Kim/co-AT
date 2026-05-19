import { createAdminClient } from "@/lib/supabase/admin"
import { format } from "date-fns"

type BackupType = "daily" | "weekly" | "monthly" | "manual"

export interface BackupResult {
  success: boolean
  backupId?: string
  backupName?: string
  tablesCount?: number
  recordsCount?: number
  error?: string
}

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

function getExpirationDate(backupType: BackupType): string {
  const now = new Date()
  let days: number
  switch (backupType) {
    case "daily":   days = 30;  break
    case "weekly":  days = 90;  break
    case "monthly": days = 365; break
    case "manual":  days = 180; break
  }
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

export async function runBackup(backupType: BackupType): Promise<BackupResult> {
  const supabase = createAdminClient()
  const timestamp = format(new Date(), "yyyyMMdd_HHmmss")
  const backupName = `${backupType}_${timestamp}`

  try {
    const { data: backupLog, error: logError } = await supabase
      .from("backup_logs" as never)
      .insert({
        backup_type: backupType,
        backup_name: backupName,
        status: "in_progress",
        started_at: new Date().toISOString(),
        storage_type: "supabase_storage",
        metadata: { tables: BACKUP_TABLES, version: process.env.npm_package_version || "unknown" },
      })
      .select()
      .single()

    if (logError || !backupLog) {
      throw new Error(`백업 로그 생성 실패: ${logError?.message}`)
    }

    const backupId = (backupLog as { id?: string })?.id || ""
    let totalRecords = 0
    const backupData: Record<string, unknown[]> = {}

    for (const table of BACKUP_TABLES) {
      const { data, error, count } = await supabase
        .from(table as never)
        .select("*", { count: "exact" })
      if (error) continue
      backupData[table] = data || []
      totalRecords += count || 0
    }

    const backupJson = JSON.stringify(backupData, null, 2)
    const backupSize = Buffer.byteLength(backupJson, "utf8")
    const storagePath = `backups/${backupType}/${backupName}.json`

    await supabase
      .from("backup_logs" as never)
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

    return { success: true, backupId, backupName, tablesCount: BACKUP_TABLES.length, recordsCount: totalRecords }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    try {
      const supabase = createAdminClient()
      await supabase
        .from("backup_logs" as never)
        .update({ status: "failed", completed_at: new Date().toISOString(), error_message: errorMessage })
        .eq("backup_name", backupName)
    } catch {}
    return { success: false, error: errorMessage }
  }
}
