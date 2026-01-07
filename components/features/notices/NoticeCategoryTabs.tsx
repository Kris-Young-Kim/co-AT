"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Pin, Calendar } from "lucide-react"
import { type Notice } from "@/actions/notice-actions"

interface NoticeCategoryTabsProps {
  allNotices: Notice[]
  noticeNotices: Notice[]
  activityNotices: Notice[]
  supportNotices: Notice[]
  caseNotices: Notice[]
}

export function NoticeCategoryTabs({
  allNotices,
  noticeNotices,
  activityNotices,
  supportNotices,
  caseNotices,
}: NoticeCategoryTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"

  const handleTabChange = (value: string) => {
    if (value === "all") {
      router.push("/notices")
    } else {
      router.push(`/notices?category=${value}`)
    }
  }

  const renderNotices = (notices: Notice[], emptyMessage: string) => {
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
      <>
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
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </>
    )
  }

  return (
    <Tabs value={selectedCategory} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="notice">공지사항</TabsTrigger>
        <TabsTrigger value="activity">활동 소식</TabsTrigger>
        <TabsTrigger value="support">지원사업</TabsTrigger>
        <TabsTrigger value="case">서비스 사례</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {renderNotices(allNotices, "등록된 공지사항이 없습니다")}
      </TabsContent>

      <TabsContent value="notice" className="space-y-4">
        {renderNotices(noticeNotices, "등록된 공지사항이 없습니다")}
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        {renderNotices(activityNotices, "등록된 활동 소식이 없습니다")}
      </TabsContent>

      <TabsContent value="support" className="space-y-4">
        {renderNotices(supportNotices, "등록된 지원사업이 없습니다")}
      </TabsContent>

      <TabsContent value="case" className="space-y-4">
        {renderNotices(caseNotices, "등록된 서비스 사례가 없습니다")}
      </TabsContent>
    </Tabs>
  )
}
