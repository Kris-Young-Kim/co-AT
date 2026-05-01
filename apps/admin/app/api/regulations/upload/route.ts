import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@co-at/auth"
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
      return NextResponse.json({ error: "ê¶Œí•œ???†ìŠµ?ˆë‹¤" }, { status: 403 })
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "?Œì¼???†ìŠµ?ˆë‹¤" }, { status: 400 })
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `ì§€???•ì‹: ${ALLOWED_EXTENSIONS.join(", ")} (pdf, md, txt)`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "?Œì¼ ?¬ê¸°??20MBë¥?ì´ˆê³¼?????†ìŠµ?ˆë‹¤" },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9ê°€-??_-]/g, "_")}`

    // 1) Supabase Storage ?œë„
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

    // 2) Storage ë²„í‚· ?†ìœ¼ë©?ë¡œì»¬ docs/regulations/???€??(ê°œë°œ??
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
        console.error("[ê·œì • ë¬¸ì„œ ?…ë¡œ?? ë¡œì»¬ ?€???¤íŒ¨:", localErr)
        return NextResponse.json(
          {
            error:
              "Storage ë²„í‚· 'regulations'ê°€ ?†ìŠµ?ˆë‹¤. Supabase ?€?œë³´?œì—??ë²„í‚·???ì„±?˜ê±°?? docs/regulations/ ?´ë”??ì§ì ‘ ?Œì¼???£ì–´ì£¼ì„¸??",
            code: "BUCKET_NOT_FOUND",
          },
          { status: 500 }
        )
      }
    }

    console.error("[ê·œì • ë¬¸ì„œ ?…ë¡œ?? ?¤íŒ¨:", error)
    return NextResponse.json(
      { error: "?…ë¡œ???¤íŒ¨: " + error.message },
      { status: 500 }
    )
  } catch (err) {
    console.error("[ê·œì • ë¬¸ì„œ ?…ë¡œ?? ?¤ë¥˜:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤",
      },
      { status: 500 }
    )
  }
}
