import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type HealthStatus = "ok" | "degraded" | "error"

const getVersion = () =>
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  "local"

export async function GET() {
  const startedAt = Date.now()

  // 기본 상태
  let db: { status: HealthStatus; latencyMs?: number; error?: string } = {
    status: "degraded",
  }
  let auth: HealthStatus = "degraded"
  let ai: HealthStatus = "degraded"

  // DB 체크: 가벼운 select 1
  try {
    const dbStart = performance.now()
    const supabase = await createClient()
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).limit(1)

    if (error) {
      db = { status: "error", error: error.message }
    } else {
      db = { status: "ok", latencyMs: Math.round(performance.now() - dbStart) }
    }
  } catch (error) {
    db = { status: "error", error: error instanceof Error ? error.message : String(error) }
  }

  // Auth 체크: 필수 키 존재 여부
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)
  auth = hasClerkKeys ? "ok" : "degraded"

  // AI 체크: 필수 키 존재 여부
  const hasAiKey = Boolean(process.env.GOOGLE_AI_API_KEY)
  ai = hasAiKey ? "ok" : "degraded"

  const overall: HealthStatus = [db.status, auth, ai].every((s) => s === "ok") ? "ok" : "degraded"

  const payload = {
    status: overall,
    app: "ok",
    db,
    auth,
    ai,
    version: getVersion(),
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  }

  console.log("[/api/health] status:", payload) // 핵심 기능 로그

  return NextResponse.json(payload, {
    status: overall === "ok" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
