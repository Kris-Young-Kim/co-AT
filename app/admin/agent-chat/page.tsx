// app/admin/agent-chat/page.tsx
// AI 업무 도우미 관리자 페이지

import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { AgentChat } from "@/components/features/chat/AgentChat"
import { Bot } from "lucide-react"

export const metadata = {
  title: "AI 업무 도우미 | 강원도 보조기기센터",
  description: "AI 오케스트레이터 기반 통합 업무 도우미",
}

export default async function AgentChatPage() {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">AI 업무 도우미</h1>
            <p className="text-sm text-muted-foreground">
              대상자 검색 · 일정 확인 · 재고 조회 · 규정 검색 · 문서 생성
            </p>
          </div>
        </div>
      </div>

      <AgentChat className="h-[calc(100vh-14rem)] sm:h-[calc(100vh-13rem)]" />
    </div>
  )
}
