"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRecentNotices, getNoticesByCategory, type Notice } from "@/actions/notice-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface HomeCommunityNewsProps {
  initialNotices: Notice[]
  initialSupportNotices: Notice[]
}

export function HomeCommunityNews({
  initialNotices,
  initialSupportNotices,
}: HomeCommunityNewsProps) {
  const [notices, setNotices] = useState(initialNotices)
  const [supportNotices, setSupportNotices] = useState(initialSupportNotices)

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="notice" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="notice" className="text-xs sm:text-sm">
              공지사항
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs sm:text-sm">
              활동 소식
            </TabsTrigger>
            <TabsTrigger value="cases" className="text-xs sm:text-sm">
              서비스 사례
            </TabsTrigger>
          </TabsList>

          {/* 공지사항 탭 */}
          <TabsContent value="notice" className="space-y-3 mt-0">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 공지사항이 없습니다.
              </p>
            ) : (
              <>
                {notices.slice(0, 3).map((notice) => (
                  <Link key={notice.id} href={`/notices/${notice.id}`}>
                    <div className="p-2 rounded-md border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-1">
                            {notice.is_pinned && (
                              <span className="inline-block mr-1 text-primary">📌</span>
                            )}
                            {notice.title}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(notice.created_at), "MM.dd", { locale: ko })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/notices">
                  <Plus className="mr-2 h-4 w-4" />
                  더보기
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* 활동 소식 탭 */}
          <TabsContent value="gallery" className="space-y-3 mt-0">
            <p className="text-sm text-muted-foreground text-center py-4">
              활동 소식이 곧 업데이트됩니다.
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/community/gallery">
                  <Plus className="mr-2 h-4 w-4" />
                  더보기
                </Link>
              </Button>
            </div>
          </TabsContent>

          {/* 서비스 사례 탭 */}
          <TabsContent value="cases" className="space-y-3 mt-0">
            <p className="text-sm text-muted-foreground text-center py-4">
              서비스 사례가 곧 업데이트됩니다.
            </p>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/community/cases">
                  <Plus className="mr-2 h-4 w-4" />
                  더보기
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

