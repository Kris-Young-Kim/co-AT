import { auth } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // 권한 확인
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다" },
        { status: 400 }
      )
    }

    // 파일 타입 확인 (이미지만)
    const fileType = file.type
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다" },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 5MB를 초과할 수 없습니다" },
        { status: 400 }
      )
    }

    // RLS를 우회하기 위해 서비스 역할 사용
    const supabase = createAdminClient()

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `inventory/${userId}/${fileName}`

    // Supabase Storage에 업로드
    const fileBuffer = await file.arrayBuffer()
    
    console.log("[재고 이미지 업로드] 시도:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType,
      filePath: filePath,
      userId: userId,
    })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("inventory")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      })

    if (uploadError) {
      console.error("[재고 이미지 업로드] 실패:", {
        error: uploadError,
        message: uploadError.message,
        statusCode: (uploadError as any).statusCode,
        errorCode: (uploadError as any).error,
      })
      
      // 버킷이 없는 경우 더 명확한 에러 메시지
      const errorMessage = uploadError.message || String(uploadError)
      if (
        errorMessage.includes("Bucket") || 
        errorMessage.includes("not found") ||
        errorMessage.includes("does not exist") ||
        (uploadError as any).statusCode === 404
      ) {
        return NextResponse.json(
          { 
            error: "Storage 버킷이 설정되지 않았습니다. Supabase 대시보드에서 'inventory' 버킷을 생성해주세요.",
            details: errorMessage,
            code: "BUCKET_NOT_FOUND"
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "파일 업로드에 실패했습니다", 
          details: errorMessage,
          code: (uploadError as any).error || "UPLOAD_FAILED"
        },
        { status: 500 }
      )
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("inventory")
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      name: file.name,
      size: file.size,
      type: "image",
    })
  } catch (error) {
    console.error("[재고 이미지 업로드] 예상치 못한 오류:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: "예상치 못한 오류가 발생했습니다", 
        details: errorMessage,
        ...(errorStack && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
