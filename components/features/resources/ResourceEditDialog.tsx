"use client"

import { useState, useEffect } from "react"
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
import { updateResource, type Resource } from "@/actions/resource-actions"
import type { ReactNode } from "react"

interface ResourceEditDialogProps {
  resource: Resource
  children: ReactNode
}

export function ResourceEditDialog({ resource, children }: ResourceEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || "")
  const [resourceDate, setResourceDate] = useState(resource.resource_date || "")
  const [youtubeIdsRaw, setYoutubeIdsRaw] = useState(
    (resource.youtube_ids || []).join("\n")
  )
  const [fileUrl, setFileUrl] = useState(resource.file_url || "")
  const [fileName, setFileName] = useState(resource.file_name || "")

  useEffect(() => {
    if (open) {
      setTitle(resource.title)
      setDescription(resource.description || "")
      setResourceDate(resource.resource_date || "")
      setYoutubeIdsRaw((resource.youtube_ids || []).join("\n"))
      setFileUrl(resource.file_url || "")
      setFileName(resource.file_name || "")
    }
  }, [open, resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert("제목을 입력해주세요"); return }

    setIsSubmitting(true)
    try {
      const updateData: Parameters<typeof updateResource>[0] = {
        id: resource.id,
        title: title.trim(),
        description: description.trim() || undefined,
        resource_date: resourceDate || undefined,
      }

      if (resource.type === "video") {
        const ids = youtubeIdsRaw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        if (ids.length === 0) { alert("YouTube ID를 입력해주세요"); return }
        updateData.youtube_ids = ids
      } else {
        if (!fileUrl.trim()) { alert("파일 URL을 입력해주세요"); return }
        updateData.file_url = fileUrl.trim()
        updateData.file_name = fileName.trim() || undefined
      }

      const result = await updateResource(updateData)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "수정에 실패했습니다")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource.type === "video" ? "영상자료" : "문서자료"} 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-res-title">제목 *</Label>
            <Input id="edit-res-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-res-desc">설명</Label>
            <Textarea id="edit-res-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-res-date">자료 날짜</Label>
            <Input id="edit-res-date" type="date" value={resourceDate} onChange={(e) => setResourceDate(e.target.value)} />
          </div>

          {resource.type === "video" && (
            <div className="space-y-2">
              <Label htmlFor="edit-res-youtube">YouTube ID *</Label>
              <Textarea
                id="edit-res-youtube"
                value={youtubeIdsRaw}
                onChange={(e) => setYoutubeIdsRaw(e.target.value)}
                rows={3}
                placeholder="YouTube 영상 ID (여러 개는 줄바꿈으로 구분)"
              />
            </div>
          )}

          {resource.type === "document" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-res-file-url">파일 URL *</Label>
                <Input id="edit-res-file-url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-res-file-name">파일명</Label>
                <Input id="edit-res-file-name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>취소</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "수정 중..." : "수정"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
