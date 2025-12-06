"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Check, Copy } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NoticeShareButtonProps {
  noticeId: string
  noticeTitle: string
}

export function NoticeShareButton({
  noticeId,
  noticeTitle,
}: NoticeShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/notices/${noticeId}`
    : ""

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("링크 복사 실패:", error)
      alert("링크 복사에 실패했습니다")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: noticeTitle,
          text: noticeTitle,
          url: shareUrl,
        })
      } catch (error) {
        // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
        if ((error as Error).name !== "AbortError") {
          console.error("공유 실패:", error)
        }
      }
    } else {
      // Web Share API를 지원하지 않는 경우 링크 복사
      handleCopyLink()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          공유
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          공유하기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              링크 복사
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

