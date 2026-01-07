import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Pin, Calendar } from "lucide-react"
import { type Notice } from "@/actions/notice-actions"

interface NoticeListProps {
  notices: Notice[]
  emptyMessage?: string
}

export function NoticeList({ notices, emptyMessage = "등록된 공지사항이 없습니다" }: NoticeListProps) {
  if (notices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notices.map((notice) => (
        <Link key={notice.id} href={`/notices/${notice.id}`}>
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
                        {notice.category === "notice"
                          ? "공지사항"
                          : notice.category === "activity"
                          ? "활동 소식"
                          : notice.category === "support"
                          ? "지원사업"
                          : notice.category === "case"
                          ? "서비스 사례"
                          : "공지사항"}
                      </Badge>
                    )}
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
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                {typeof notice.content === "string" 
                  ? notice.content.replace(/<[^>]*>/g, "").substring(0, 200)
                  : notice.content}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
