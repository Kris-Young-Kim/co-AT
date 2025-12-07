"use client"

import { useState } from "react"
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
import { createNotice } from "@/actions/notice-actions"
import { useRouter } from "next/navigation"
import { NoticeAttachmentManager, type Attachment } from "./NoticeAttachmentManager"

const noticeSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 200자 이하여야 합니다"),
  content: z.string().min(1, "내용을 입력해주세요"),
  category: z.enum(["notice", "activity", "support", "case"]).nullable(),
  is_pinned: z.boolean().default(false),
})

type NoticeFormData = z.infer<typeof noticeSchema>

interface NoticeCreateDialogProps {
  children: React.ReactNode
}

export function NoticeCreateDialog({ children }: NoticeCreateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])

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
      category: null,
      is_pinned: false,
    },
  })

  const category = watch("category")
  const isPinned = watch("is_pinned")

  const onSubmit = async (data: NoticeFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createNotice({
        title: data.title,
        content: data.content,
        category: data.category,
        is_pinned: data.is_pinned,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      if (result.success) {
        reset()
        setAttachments([])
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "공지사항 생성에 실패했습니다")
      }
    } catch (error) {
      console.error("Error creating notice:", error)
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
          <DialogTitle>새 글 작성</DialogTitle>
          <DialogDescription>
            공지사항을 작성하여 사용자들에게 알려주세요
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="공지사항 제목을 입력하세요"
              aria-invalid={errors.title ? "true" : "false"}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select
              value={category || ""}
              onValueChange={(value) =>
                setValue("category", value === "null" ? null : (value as "notice" | "activity" | "support" | "case"))
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notice">공지사항</SelectItem>
                <SelectItem value="activity">활동 소식</SelectItem>
                <SelectItem value="support">지원사업</SelectItem>
                <SelectItem value="case">서비스 사례</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="공지사항 내용을 입력하세요"
              rows={10}
              className="font-mono text-sm"
              aria-invalid={errors.content ? "true" : "false"}
              aria-describedby={errors.content ? "content-error" : undefined}
            />
            {errors.content && (
              <p id="content-error" className="text-sm text-destructive" role="alert">
                {errors.content.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              HTML 태그를 사용할 수 있습니다
            </p>
          </div>

          <NoticeAttachmentManager
            attachments={attachments}
            onChange={setAttachments}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_pinned"
              checked={isPinned}
              onCheckedChange={(checked) => setValue("is_pinned", checked === true)}
            />
            <Label
              htmlFor="is_pinned"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              공지사항 고정
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "작성 중..." : "작성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

