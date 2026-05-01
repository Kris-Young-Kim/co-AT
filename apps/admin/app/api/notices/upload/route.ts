import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@co-at/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // ê¶Œí•œ ?•ì¸
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "ê¶Œí•œ???†ìŠµ?ˆë‹¤" },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "?Œì¼???†ìŠµ?ˆë‹¤" },
        { status: 400 }
      )
    }

    // ?Œì¼ ?€???•ì¸
    const fileType = file.type
    const isImage = fileType.startsWith("image/")
    const isPDF = fileType === "application/pdf"
    
    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: "?´ë?ì§€ ?ëŠ” PDF ?Œì¼ë§??…ë¡œ??ê°€?¥í•©?ˆë‹¤" },
        { status: 400 }
      )
    }

    // ?Œì¼ ?¬ê¸° ?œí•œ (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "?Œì¼ ?¬ê¸°??10MBë¥?ì´ˆê³¼?????†ìŠµ?ˆë‹¤" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ?Œì¼ëª??ì„± (?€?„ìŠ¤?¬í”„ + ?ë³¸ ?Œì¼ëª?
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `notices/${userId}/${fileName}`

    // Supabase Storage???…ë¡œ??    const fileBuffer = await file.arrayBuffer()
    
    console.log("?Œì¼ ?…ë¡œ???œë„:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType,
      filePath: filePath,
      userId: userId,
    })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("notices")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      })

    if (uploadError) {
      console.error("?Œì¼ ?…ë¡œ???¤íŒ¨:", {
        error: uploadError,
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        errorCode: (uploadError as any).error,
      })
      
      // ë²„í‚·???†ëŠ” ê²½ìš° ??ëª…í™•???ëŸ¬ ë©”ì‹œì§€
      const errorMessage = uploadError.message || String(uploadError)
      if (
        errorMessage.includes("Bucket") || 
        errorMessage.includes("not found") ||
        errorMessage.includes("does not exist") ||
        (uploadError as any).statusCode === 404
      ) {
        return NextResponse.json(
          { 
            error: "Storage ë²„í‚·???¤ì •?˜ì? ?Šì•˜?µë‹ˆ?? Supabase ?€?œë³´?œì—??'notices' ë²„í‚·???ì„±?´ì£¼?¸ìš”.",
            details: errorMessage,
            code: "BUCKET_NOT_FOUND"
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "?Œì¼ ?…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤", 
          details: errorMessage,
          code: (uploadError as any).error || "UPLOAD_FAILED"
        },
        { status: 500 }
      )
    }

    // ê³µê°œ URL ?ì„±
    const { data: urlData } = supabase.storage
      .from("notices")
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: isImage ? "image" : "pdf",
    })
  } catch (error) {
    console.error("?Œì¼ ?…ë¡œ??ì¤??¤ë¥˜:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: "?ˆìƒì¹?ëª»í•œ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤", 
        details: errorMessage,
        ...(errorStack && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

