import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { readdirSync, existsSync } from "fs"
import { join } from "path"

const ALLOWED_EXT = [".pdf", ".md", ".txt"]

export async function GET() {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const docsDir = join(process.cwd(), "docs")
    const regulationsDir = join(docsDir, "regulations")
    const files: Array<{ name: string; path: string; source: "local" | "storage" }> = []

    // 1. docs/regulations 폴더 (로컬)
    if (existsSync(regulationsDir)) {
      try {
        const entries = readdirSync(regulationsDir, { withFileTypes: true })
        for (const e of entries) {
          if (e.isFile()) {
            const ext = e.name.toLowerCase().slice(e.name.lastIndexOf("."))
            if (ALLOWED_EXT.includes(ext)) {
              files.push({
                name: e.name,
                path: `regulations/${e.name}`,
                source: "local",
              })
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. docs/ 직접 (보조기기센터사업안내.md 등)
    if (existsSync(docsDir)) {
      try {
        const entries = readdirSync(docsDir, { withFileTypes: true })
        for (const e of entries) {
          if (e.isFile()) {
            const ext = e.name.toLowerCase().slice(e.name.lastIndexOf("."))
            if (ALLOWED_EXT.includes(ext)) {
              files.push({
                name: e.name,
                path: e.name,
                source: "local",
              })
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 3. Supabase Storage regulations 버킷
    try {
      const supabase = createAdminClient()
      const { data: list } = await supabase.storage
        .from("regulations")
        .list("regulations", { limit: 100 })

      if (list) {
        for (const f of list) {
          if (f.name && !f.name.startsWith(".")) {
            const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."))
            if (ALLOWED_EXT.includes(ext)) {
              files.push({
                name: f.name.replace(/^\d+-/, ""),
                path: `regulations/${f.name}`,
                source: "storage",
              })
            }
          }
        }
      }
    } catch {
      // 버킷 없으면 무시
    }

    const unique = Array.from(
      new Map(files.map((f) => [f.path, f])).values()
    ).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ success: true, files: unique })
  } catch (err) {
    console.error("[규정 문서 목록] 오류:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다",
      },
      { status: 500 }
    )
  }
}
