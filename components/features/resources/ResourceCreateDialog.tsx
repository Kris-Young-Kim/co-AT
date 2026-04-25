"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createResource, type CreateResourceInput } from "@/actions/resource-actions"
import type { ReactNode } from "react"

interface ResourceCreateDialogProps {
  children: ReactNode
}

export function ResourceCreateDialog({ children }: ResourceCreateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<"video" | "document">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [resourceDate, setResourceDate] = useState("")
  const [youtubeIdsRaw, setYoutubeIdsRaw] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")

  const resetForm = () => {
    setType("video")
    setTitle("")
    setDescription("")
    setResourceDate("")
    setYoutubeIdsRaw("")
    setFileUrl("")
    setFileName("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert("제목을 입력해주세요"); return }

    setIsSubmitting(true)
    try {
      const input: CreateResourceInput = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        resource_date: resourceDate || undefined,
      }

      if (type === "video") {
        const ids = youtubeIdsRaw
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (ids.length === 0) { alert("YouTube ID를 입력해주세요"); return }
        input.youtube_ids = ids
      } else {
        if (!fileUrl.trim()) { alert("파일 URL을 입력해주세요"); return }
        input.file_url = fileUrl.trim()
        input.file_name = fileName.trim() || undefined
      }

      const result = await createResource(input)
      if (result.success) {
        resetForm()
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "등록에 실패했습니다")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>자료 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>자료 유형 *</Label>
            <Select value={type} onValueChange={(v) => setType(v as "video" | "document")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">영상자료</SelectItem>
                <SelectItem value="document">문서자료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-title">제목 *</Label>
            <Input
              id="res-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="자료 제목을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-desc">설명</Label>
            <Textarea
              id="res-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="자료에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="res-date">자료 날짜</Label>
            <Input
              id="res-date"
              type="date"
              value={resourceDate}
              onChange={(e) => setResourceDate(e.target.value)}
            />
          </div>

          {type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="res-youtube">YouTube ID *</Label>
              <Textarea
                id="res-youtube"
                value={youtubeIdsRaw}
                onChange={(e) => setYoutubeIdsRaw(e.target.value)}
                placeholder={"YouTube 영상 ID를 입력하세요\n여러 개는 쉼표 또는 줄바꿈으로 구분\n예: dQw4w9WgXcQ"}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                YouTube URL에서 v= 뒤의 ID만 입력하세요
              </p>
            </div>
          )}

          {type === "document" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="res-file-url">파일 URL *</Label>
                <Input
                  id="res-file-url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Supabase Storage 또는 외부 URL
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-file-name">파일명</Label>
                <Input
                  id="res-file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="예: 2025_보조기기_안내서.pdf"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false) }} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
