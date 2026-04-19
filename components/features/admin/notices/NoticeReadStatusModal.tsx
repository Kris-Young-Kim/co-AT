// components/features/admin/notices/NoticeReadStatusModal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle } from "lucide-react"
import { getNoticeReadStatus } from "@/actions/notice-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface NoticeReadStatusModalProps {
  noticeId: string
  noticeTitle: string
  open: boolean
  onClose: () => void
}

export function NoticeReadStatusModal({
  noticeId,
  noticeTitle,
  open,
  onClose,
}: NoticeReadStatusModalProps) {
  const [reads, setReads] = useState<{ clerk_user_id: string; read_at: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const loadData = async () => {
    if (loaded) return
    setLoading(true)
    const result = await getNoticeReadStatus(noticeId)
    if (result.success) {
      setReads(result.reads ?? [])
      setLoaded(true)
    }
    setLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) loadData()
    else onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            읽음 현황
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{noticeTitle}</p>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground py-4 text-center">로딩 중...</p>}
          {!loading && reads.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">아직 읽은 직원이 없습니다.</p>
          )}
          {reads.map((r) => (
            <div key={r.clerk_user_id} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-mono text-muted-foreground">{r.clerk_user_id.slice(-8)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(r.read_at), "MM/dd HH:mm", { locale: ko })}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <Badge variant="outline">총 {reads.length}명 읽음</Badge>
          <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
