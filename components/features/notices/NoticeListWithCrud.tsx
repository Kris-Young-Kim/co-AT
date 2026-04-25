"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Pin, Calendar, Pencil, Trash2, Plus } from "lucide-react"
import { type Notice, deleteNotice } from "@/actions/notice-actions"
import { NoticeEditDialog } from "@/components/features/admin/notices/NoticeEditDialog"
import { NoticeCreateDialog } from "@/components/features/admin/notices/NoticeCreateDialog"

interface NoticeListWithCrudProps {
  notices: Notice[]
  isStaff: boolean
  emptyMessage?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  notice: "공지사항",
  activity: "활동 소식",
  support: "지원사업",
  case: "서비스 사례",
}

export function NoticeListWithCrud({
  notices: initialNotices,
  isStaff,
  emptyMessage = "등록된 공지사항이 없습니다",
}: NoticeListWithCrudProps) {
  const [notices, setNotices] = useState<Notice[]>(initialNotices)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("정말로 삭제하시겠습니까?")) return
    setDeletingId(id)
    try {
      const result = await deleteNotice(id)
      if (result.success) {
        setNotices((prev) => prev.filter((n) => n.id !== id))
      } else {
        alert(result.error || "삭제에 실패했습니다")
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {notices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice.id} className="relative group">
              <Link href={`/notices/${notice.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {notice.is_pinned && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Pin className="h-3 w-3" />
                              고정
                            </Badge>
                          )}
                          {notice.category && (
                            <Badge variant="outline" className="text-xs">
                              {CATEGORY_LABELS[notice.category] ?? notice.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                          {notice.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(notice.created_at), "yyyy.MM.dd", { locale: ko })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                      {notice.content.replace(/<[^>]*>/g, "").substring(0, 200)}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* staff 전용 편집 버튼 — Link 바깥에 absolute 배치 */}
              {isStaff && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <NoticeEditDialog notice={notice}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-background"
                      title="수정"
                      aria-label="수정"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </NoticeEditDialog>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-background text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, notice.id)}
                    disabled={deletingId === notice.id}
                    title="삭제"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 글 작성 FAB */}
      {isStaff && (
        <div className="fixed bottom-8 right-8 z-50">
          <NoticeCreateDialog>
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0"
              title="새 글 작성"
              aria-label="새 글 작성"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </NoticeCreateDialog>
        </div>
      )}
    </>
  )
}
