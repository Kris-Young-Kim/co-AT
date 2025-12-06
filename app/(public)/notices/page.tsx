import { getRecentNotices, getNoticesByCategory } from "@/actions/notice-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Pin, Calendar } from "lucide-react"

export default async function NoticesPage() {
  // 모든 카테고리의 공지사항 조회
  const [allNotices, supportNotices, eventNotices] = await Promise.all([
    getRecentNotices(50), // 전체 공지사항
    getNoticesByCategory("support", 50), // 지원사업
    getNoticesByCategory("event", 50), // 행사/이벤트
  ])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          공지사항
        </h1>
        <p className="text-muted-foreground">
          센터의 공지사항과 지원사업 정보를 확인하실 수 있습니다
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all" className="text-sm sm:text-base">
            전체
          </TabsTrigger>
          <TabsTrigger value="support" className="text-sm sm:text-base">
            지원사업
          </TabsTrigger>
          <TabsTrigger value="event" className="text-sm sm:text-base">
            행사/이벤트
          </TabsTrigger>
        </TabsList>

        {/* 전체 공지사항 */}
        <TabsContent value="all" className="space-y-4 mt-0">
          {allNotices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">등록된 공지사항이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            allNotices.map((notice) => (
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
                              {notice.category === "support"
                                ? "지원사업"
                                : notice.category === "event"
                                ? "행사/이벤트"
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
            ))
          )}
        </TabsContent>

        {/* 지원사업 */}
        <TabsContent value="support" className="space-y-4 mt-0">
          {supportNotices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">등록된 지원사업 공지가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            supportNotices.map((notice) => (
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
                          <Badge variant="outline" className="text-xs">
                            지원사업
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
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                      {notice.content}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        {/* 행사/이벤트 */}
        <TabsContent value="event" className="space-y-4 mt-0">
          {eventNotices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">등록된 행사/이벤트 공지가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            eventNotices.map((notice) => (
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
                          <Badge variant="outline" className="text-xs">
                            행사/이벤트
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
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                      {notice.content}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

