"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import type { Notice } from "@/actions/notice-actions"
import { deleteNotice } from "@/actions/notice-actions"
import { useRouter } from "next/navigation"
import { Pin, Calendar, Edit, Trash2, AlertTriangle } from "lucide-react"
import { NoticeEditDialog } from "./NoticeEditDialog"

interface NoticeListProps {
  initialNotices: Notice[]
}

export function NoticeList({ initialNotices }: NoticeListProps) {
  const router = useRouter()
  const [notices, setNotices] = useState(initialNotices)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (notice: Notice) => {
    setNoticeToDelete(notice)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noticeToDelete) return

    setIsDeleting(true)
    const result = await deleteNotice(noticeToDelete.id)

    if (result.success) {
      setNotices(notices.filter((n) => n.id !== noticeToDelete.id))
      setDeleteDialogOpen(false)
      setNoticeToDelete(null)
      router.refresh()
    } else {
      alert(result.error || "삭제에 실패했습니다")
    }

    setIsDeleting(false)
  }

  const handleUpdateSuccess = () => {
    router.refresh()
  }

  if (notices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">등록된 공지사항이 없습니다</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {notices.map((notice) => {
          const categoryLabel =
            notice.category === "notice"
              ? "공지사항"
              : notice.category === "activity"
              ? "활동 소식"
              : notice.category === "support"
              ? "지원사업"
              : notice.category === "case"
              ? "서비스 사례"
              : "공지사항"

          return (
            <Card key={notice.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {notice.is_pinned && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Pin className="h-3 w-3" />
                          고정
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {categoryLabel}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                      {notice.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(notice.created_at), "yyyy.MM.dd", {
                      locale: ko,
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-3 mb-4">
                  {notice.content}
                </p>
                <div className="flex items-center gap-2">
                  <NoticeEditDialog notice={notice} onSuccess={handleUpdateSuccess}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </Button>
                  </NoticeEditDialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(notice)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="ml-auto"
                  >
                    <a href={`/notices/${notice.id}`} target="_blank" rel="noopener noreferrer">
                      보기
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              공지사항 삭제
            </DialogTitle>
            <DialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              <br />
              <strong className="text-foreground mt-2 block">
                {noticeToDelete?.title}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setNoticeToDelete(null)
              }}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

