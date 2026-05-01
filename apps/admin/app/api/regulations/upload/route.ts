import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const ALLOWED_EXTENSIONS = [".pdf", ".md", ".txt"]
const ALLOWED_TYPES = [
  "application/pdf",
  "text/markdown",
  "text/plain",
  "text/x-markdown",
]
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(req: Request) {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `지원 형식: ${ALLOWED_EXTENSIONS.join(", ")} (pdf, md, txt)`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 20MB를 초과할 수 없습니다" },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, "_")}`

    // 1) Supabase Storage 시도
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
      .from("regulations")
      .upload(`regulations/${safeName}`, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (!error) {
      return NextResponse.json({
        success: true,
        path: data.path,
        name: file.name,
        size: file.size,
        source: "storage",
      })
    }

    // 2) Storage 버킷 없으면 로컬 docs/regulations/에 저장 (개발용)
    if (
      error.message?.includes("Bucket") ||
      error.message?.includes("not found")
    ) {
      try {
        const localDir = join(process.cwd(), "docs", "regulations")
        await mkdir(localDir, { recursive: true })
        const localPath = join(localDir, safeName)
        await writeFile(localPath, fileBuffer)
        return NextResponse.json({
          success: true,
          path: `regulations/${safeName}`,
          name: file.name,
          size: file.size,
          source: "local",
        })
      } catch (localErr) {
        console.error("[규정 문서 업로드] 로컬 저장 실패:", localErr)
        return NextResponse.json(
          {
            error:
              "Storage 버킷 'regulations'가 없습니다. Supabase 대시보드에서 버킷을 생성하거나, docs/regulations/ 폴더에 직접 파일을 넣어주세요.",
            code: "BUCKET_NOT_FOUND",
          },
          { status: 500 }
        )
      }
    }

    console.error("[규정 문서 업로드] 실패:", error)
    return NextResponse.json(
      { error: "업로드 실패: " + error.message },
      { status: 500 }
    )
  } catch (err) {
    console.error("[규정 문서 업로드] 오류:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "예상치 못한 오류가 발생했습니다",
      },
      { status: 500 }
    )
  }
}
