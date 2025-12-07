"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileUploader } from "@/components/common/file-uploader"
import { X, Image as ImageIcon, FileText, Youtube, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface Attachment {
  type: "image" | "pdf" | "youtube"
  url: string
  name: string
  size?: number
}

interface NoticeAttachmentManagerProps {
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
}

export function NoticeAttachmentManager({
  attachments,
  onChange,
}: NoticeAttachmentManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")

  const handleFileUpload = async (files: File[]) => {
    setUploading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/notices/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          // 응답 본문을 먼저 텍스트로 읽기
          let responseText = ""
          try {
            responseText = await response.text()
          } catch (e) {
            console.error("응답 본문 읽기 실패:", e)
            responseText = `응답을 읽을 수 없습니다 (${response.status})`
          }
          
          let errorData: any = null
          
          // JSON으로 파싱 시도
          if (responseText && responseText.trim()) {
            try {
              errorData = JSON.parse(responseText)
            } catch (e) {
              // JSON 파싱 실패 - 텍스트를 그대로 사용
              console.warn("JSON 파싱 실패, 텍스트 사용:", responseText)
              errorData = { error: responseText }
            }
          } else {
            // 응답 본문이 비어있음
            errorData = { error: `서버 오류 (${response.status} ${response.statusText})` }
          }
          
          // 에러 메시지 추출
          const errorMessage = 
            errorData?.error || 
            errorData?.details || 
            errorData?.message ||
            responseText ||
            `업로드 실패 (${response.status} ${response.statusText})`
          
          // 상세한 에러 정보 로깅 (개별적으로 로깅하여 직렬화 문제 방지)
          console.error("=== 파일 업로드 API 오류 ===")
          console.error("HTTP Status:", response.status)
          console.error("HTTP Status Text:", response.statusText)
          console.error("Response Text:", responseText || "(비어있음)")
          console.error("Response Text Length:", responseText?.length || 0)
          console.error("Error Data:", errorData)
          console.error("Error Data Type:", typeof errorData)
          console.error("Error Data Keys:", errorData ? Object.keys(errorData) : [])
          console.error("File Name:", file.name)
          console.error("File Size:", file.size)
          console.error("File Type:", file.type)
          console.error("===========================")
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        return {
          type: data.type as "image" | "pdf",
          url: data.url,
          name: data.name,
          size: data.size,
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      onChange([...attachments, ...uploadedFiles])
    } catch (error) {
      console.error("파일 업로드 오류:", error)
      const errorMessage = error instanceof Error ? error.message : "파일 업로드에 실패했습니다"
      
      // Storage 버킷 관련 에러인 경우 더 자세한 안내
      if (errorMessage.includes("버킷") || errorMessage.includes("Bucket")) {
        alert(
          "파일 업로드를 사용하려면 Supabase Storage 버킷을 생성해야 합니다.\n\n" +
          "생성 방법:\n" +
          "1. Supabase 대시보드 접속\n" +
          "2. Storage 메뉴로 이동\n" +
          "3. 'Create a new bucket' 클릭\n" +
          "4. 버킷 이름: 'notices'\n" +
          "5. Public bucket 활성화\n" +
          "6. 생성 후 다시 시도해주세요."
        )
      } else {
        alert(errorMessage)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleAddYoutube = () => {
    if (!youtubeUrl.trim()) return

    // 유튜브 URL에서 비디오 ID 추출
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = youtubeUrl.match(youtubeRegex)

    if (!match) {
      alert("올바른 유튜브 링크를 입력해주세요")
      return
    }

    const videoId = match[1]
    const embedUrl = `https://www.youtube.com/embed/${videoId}`

    onChange([
      ...attachments,
      {
        type: "youtube",
        url: embedUrl,
        name: `유튜브 동영상 (${videoId})`,
      },
    ])

    setYoutubeUrl("")
  }

  const handleRemove = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">첨부파일</label>
          <span className="text-xs text-muted-foreground">
            이미지, PDF, 유튜브 링크
          </span>
        </div>
        
        {/* 파일 업로드 */}
        <FileUploader
          onUpload={handleFileUpload}
          accept="image/*,application/pdf"
          multiple={true}
          maxSize={10 * 1024 * 1024} // 10MB
        />
        
        <p className="text-xs text-muted-foreground">
          💡 파일 업로드를 사용하려면 Supabase Storage에 'notices' 버킷이 필요합니다.
        </p>

        {/* 유튜브 링크 추가 */}
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="유튜브 링크를 입력하세요 (예: https://www.youtube.com/watch?v=...)"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddYoutube}
            disabled={!youtubeUrl.trim() || uploading}
            variant="outline"
          >
            <Youtube className="mr-2 h-4 w-4" />
            추가
          </Button>
        </div>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            업로드 중...
          </div>
        )}
      </div>

      {/* 첨부파일 목록 */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">첨부된 파일 ({attachments.length})</p>
          <div className="grid gap-2">
            {attachments.map((attachment, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {attachment.type === "image" && (
                      <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {attachment.type === "pdf" && (
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {attachment.type === "youtube" && (
                      <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{attachment.name}</span>
                    {attachment.size && (
                      <span className="text-xs text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

