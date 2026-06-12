"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { NoticeList } from "./NoticeList"
import { NoticeCreateDialog } from "./NoticeCreateDialog"
import { BannerManager } from "@/components/features/admin/banners/BannerManager"
import type { Notice } from "@/actions/notice-actions"
import type { Banner } from "@/actions/banner-actions"

type Category = "notice" | "activity" | "support" | "case"

const NOTICE_TABS: { value: string; label: string; category: Category | null }[] = [
  { value: "all", label: "전체", category: null },
  { value: "notice", label: "공지사항", category: "notice" },
  { value: "activity", label: "활동 소식", category: "activity" },
  { value: "support", label: "지원사업", category: "support" },
  { value: "case", label: "서비스 사례", category: "case" },
]

interface NoticesManagementTabsProps {
  notices: Notice[]
  banners: Banner[]
}

export function NoticesManagementTabs({ notices, banners }: NoticesManagementTabsProps) {
  const [activeTab, setActiveTab] = useState("all")

  const activeCategory = NOTICE_TABS.find((t) => t.value === activeTab)?.category ?? null
  const isBannerTab = activeTab === "banners"

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <TabsList className="flex-wrap h-auto">
          {NOTICE_TABS.map((tab) => {
            const count =
              tab.category === null
                ? notices.length
                : notices.filter((n) => n.category === tab.category).length
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                <span className="text-[10px] text-muted-foreground tabular-nums">({count})</span>
              </TabsTrigger>
            )
          })}
          <TabsTrigger value="banners" className="gap-1.5">
            배너 관리
            <span className="text-[10px] text-muted-foreground tabular-nums">({banners.length})</span>
          </TabsTrigger>
        </TabsList>
        {!isBannerTab && (
          <NoticeCreateDialog defaultCategory={activeCategory}>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              게시글 생성
            </Button>
          </NoticeCreateDialog>
        )}
      </div>

      {NOTICE_TABS.map((tab) => {
        const filtered =
          tab.category === null
            ? notices
            : notices.filter((n) => n.category === tab.category)

        return (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {tab.label}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {filtered.length}건
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NoticeList initialNotices={filtered} />
              </CardContent>
            </Card>
          </TabsContent>
        )
      })}

      <TabsContent value="banners">
        <BannerManager initialBanners={banners} />
      </TabsContent>
    </Tabs>
  )
}
