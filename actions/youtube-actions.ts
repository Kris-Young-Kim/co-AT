"use server"

import { createClient } from "@/lib/supabase/server"

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  url: string
  videoId: string
}

/**
 * 공개 유튜브 영상 목록 조회
 * notices 테이블에서 category가 'event'이고 attachments에 youtube가 포함된 항목들을 조회
 */
export async function getPublicYouTubeVideos(limit: number = 10): Promise<YouTubeVideo[]> {
  try {
    const supabase = await createClient()

    // notices 테이블에서 활동 소식(event) 카테고리의 공지사항 조회
    // attachments 컬럼이 없을 수 있으므로 먼저 attachments 포함해서 시도
    let { data: notices, error } = await supabase
      .from("notices")
      .select("id, title, attachments")
      .eq("category", "event")
      .order("created_at", { ascending: false })
      .limit(limit)

    // attachments 컬럼이 없어서 에러가 발생한 경우, attachments 없이 재시도
    if (error && (error.code === "42703" || error.message?.includes("column") || error.message?.includes("attachments"))) {
      console.log("attachments 컬럼이 없습니다. 기본 필드만 조회합니다.")
      const retryResult = await supabase
        .from("notices")
        .select("id, title")
        .eq("category", "event")
        .order("created_at", { ascending: false })
        .limit(limit)
      
      notices = retryResult.data
      error = retryResult.error
    }

    if (error) {
      // 에러 상세 정보 로깅
      console.error("유튜브 영상 조회 실패:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return []
    }

    if (!notices || notices.length === 0) {
      return []
    }

    // attachments에서 youtube 타입만 추출
    const videos: YouTubeVideo[] = []

    for (const notice of notices) {
      // attachments가 null이거나 undefined일 수 있음
      const attachments = (notice as any).attachments
      
      if (!attachments || !Array.isArray(attachments)) {
        continue
      }

      for (const attachment of attachments) {
        if (attachment?.type === "youtube" && attachment?.url) {
          // YouTube embed URL에서 video ID 추출
          const embedUrl = attachment.url
          let videoId: string | null = null

          // 여러 YouTube URL 형식 지원
          const embedMatch = embedUrl.match(/\/embed\/([^?]+)/)
          const watchMatch = embedUrl.match(/[?&]v=([^&]+)/)
          const shortMatch = embedUrl.match(/youtu\.be\/([^?]+)/)

          if (embedMatch) {
            videoId = embedMatch[1]
          } else if (watchMatch) {
            videoId = watchMatch[1]
          } else if (shortMatch) {
            videoId = shortMatch[1]
          }

          if (videoId) {
            const noticeTyped = notice as { id: string; title: string | null }
            videos.push({
              id: `${noticeTyped.id}-${videoId}`,
              title: noticeTyped.title || "제목 없음",
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${videoId}`,
              videoId,
            })
          }
        }
      }
    }

    return videos
  } catch (error) {
    console.error("유튜브 영상 조회 중 예외 발생:", error)
    return []
  }
}

