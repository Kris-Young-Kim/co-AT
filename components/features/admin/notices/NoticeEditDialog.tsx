"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox"
import { updateNotice, type Notice } from "@/actions/notice-actions"
import { useRouter } from "next/navigation"

const noticeSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 200자 이하여야 합니다"),
  content: z.string().min(1, "내용을 입력해주세요"),
  category: z.enum(["notice", "support", "event"]).nullable(),
  is_pinned: z.boolean().default(false),
})

type NoticeFormData = z.infer<typeof noticeSchema>

interface NoticeEditDialogProps {
  notice: Notice
  children: React.ReactNode
  onSuccess?: () => void
}

export function NoticeEditDialog({
  notice,
  children,
  onSuccess,
}: NoticeEditDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice.title,
      content: notice.content,
      category: notice.category,
      is_pinned: notice.is_pinned,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: notice.title,
        content: notice.content,
        category: notice.category,
        is_pinned: notice.is_pinned,
      })
    }
  }, [open, notice, reset])

  const category = watch("category")
  const isPinned = watch("is_pinned")

  const onSubmit = async (data: NoticeFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateNotice({
        id: notice.id,
        title: data.title,
        content: data.content,
        category: data.category,
        is_pinned: data.is_pinned,
      })

      if (result.success) {
        setOpen(false)
        onSuccess?.()
        router.refresh()
      } else {
        alert(result.error || "공지사항 수정에 실패했습니다")
      }
    } catch (error) {
      console.error("Error updating notice:", error)
      alert("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>공지사항 수정</DialogTitle>
          <DialogDescription>
            공지사항 내용을 수정할 수 있습니다
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">제목 *</Label>
            <Input
              id="edit-title"
              {...register("title")}
              placeholder="공지사항 제목을 입력하세요"
              aria-invalid={errors.title ? "true" : "false"}
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">카테고리</Label>
            <Select
              value={category || ""}
              onValueChange={(value) =>
                setValue("category", value === "null" ? null : (value as "notice" | "support" | "event"))
              }
            >
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="카테고리 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">카테고리 없음</SelectItem>
                <SelectItem value="notice">공지사항</SelectItem>
                <SelectItem value="support">지원사업</SelectItem>
                <SelectItem value="event">행사/이벤트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">내용 *</Label>
            <Textarea
              id="edit-content"
              {...register("content")}
              placeholder="공지사항 내용을 입력하세요"
              rows={10}
              className="font-mono text-sm"
              aria-invalid={errors.content ? "true" : "false"}
            />
            {errors.content && (
              <p className="text-sm text-destructive" role="alert">
                {errors.content.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              HTML 태그를 사용할 수 있습니다
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-is_pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setValue("is_pinned", checked === true)}
            />
            <Label
              htmlFor="edit-is_pinned"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              공지사항 고정
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

