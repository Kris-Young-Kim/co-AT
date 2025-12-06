"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRecentNotices, getNoticesByCategory, type Notice } from "@/actions/notice-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HomeNoticeTabsProps {
  initialNotices: Notice[]
  initialSupportNotices: Notice[]
}

export function HomeNoticeTabs({
  initialNotices,
  initialSupportNotices,
}: HomeNoticeTabsProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [supportNotices, setSupportNotices] = useState(initialSupportNotices)

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-responsive-xl font-bold text-center text-foreground mb-8 sm:mb-12">
          공지사항 및 지원사업
        </h2>
        <Tabs defaultValue="notice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8">
            <TabsTrigger value="notice" className="text-sm sm:text-base">
              공지사항
            </TabsTrigger>
            <TabsTrigger value="support" className="text-sm sm:text-base">
              지원사업
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notice" className="space-y-4">
            {notices.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
                  등록된 공지사항이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <>
                {notices.map((notice) => (
                  <Link key={notice.id} href={`/notices/${notice.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                            {notice.is_pinned && (
                              <span className="inline-block mr-2 text-primary">📌</span>
                            )}
                            {notice.title}
                          </CardTitle>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(notice.created_at), "yyyy.MM.dd", {
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                          {notice.content}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                <div className="flex justify-center pt-4">
                  <Button asChild variant="outline">
                    <Link href="/notices">
                      전체 보기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="support" className="space-y-4">
            {supportNotices.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
                  등록된 지원사업이 없습니다.
                </CardContent>
              </Card>
            ) : (
              <>
                {supportNotices.map((notice) => (
                  <Link key={notice.id} href={`/notices/${notice.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-base sm:text-lg text-foreground line-clamp-2">
                            {notice.is_pinned && (
                              <span className="inline-block mr-2 text-primary">📌</span>
                            )}
                            {notice.title}
                          </CardTitle>
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(notice.created_at), "yyyy.MM.dd", {
                              locale: ko,
                            })}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                          {notice.content}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                <div className="flex justify-center pt-4">
                  <Button asChild variant="outline">
                    <Link href="/notices?category=support">
                      전체 보기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

