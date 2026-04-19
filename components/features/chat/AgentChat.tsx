"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bot,
  Send,
  AlertCircle,
  ChevronRight,
  Search,
  Calendar,
  Package,
  BookOpen,
  FileText,
  User,
  Loader2,
  Megaphone,
  BarChart2,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StreamEvent, AgentDomain } from "@/lib/agents/types"

// 도메인별 표시 설정
const DOMAIN_CONFIG: Record<
  AgentDomain,
  { label: string; Icon: React.ElementType; className: string }
> = {
  client: { label: "대상자 CRM", Icon: Search, className: "bg-blue-100 text-blue-700 border-blue-200" },
  schedule: { label: "일정 관리", Icon: Calendar, className: "bg-green-100 text-green-700 border-green-200" },
  inventory: { label: "재고/기기", Icon: Package, className: "bg-orange-100 text-orange-700 border-orange-200" },
  knowledge: { label: "규정/지침서", Icon: BookOpen, className: "bg-purple-100 text-purple-700 border-purple-200" },
  document: { label: "문서 생성", Icon: FileText, className: "bg-pink-100 text-pink-700 border-pink-200" },
  posting: { label: "공지사항", Icon: Megaphone, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  performance: { label: "실적/통계", Icon: BarChart2, className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  application: { label: "신청서 관리", Icon: ClipboardList, className: "bg-rose-100 text-rose-700 border-rose-200" },
  general: { label: "일반", Icon: Bot, className: "bg-gray-100 text-gray-600 border-gray-200" },
}

// 도구 이름 한국어 표시
const TOOL_LABEL: Record<string, string> = {
  // Client
  search_clients: "대상자 검색",
  get_client_service_history: "서비스 이력 조회",
  get_client_application_status: "신청 현황 조회",
  create_client_record: "대상자 등록",
  get_all_clients: "전체 대상자 조회",
  // Schedule
  get_today_schedules: "오늘 일정 조회",
  get_week_schedules: "주간 일정 조회",
  // Inventory
  check_inventory_stock: "재고 현황 조회",
  get_rental_available_devices: "대여 가능 기기 조회",
  get_rental_list: "대여 현황 조회",
  // Knowledge
  search_business_guide: "사업안내 문서 검색",
  search_regulations: "규정 검색",
  // Document
  generate_soap_note: "SOAP 노트 생성",
  // Posting
  get_recent_notices: "최근 공지사항 조회",
  get_notices_by_category: "카테고리별 공지 조회",
  create_notice: "공지사항 작성",
  update_notice: "공지사항 수정",
  // Performance
  get_monthly_stats: "월별 실적 조회",
  get_stats_summary: "통계 요약 조회",
  get_team_performance: "팀별 실적 조회",
  get_budget_execution: "예산 집행 현황",
  // Application
  get_new_applications: "신규 신청서 조회",
  get_client_applications: "대상자 신청서 조회",
  get_overdue_rentals: "연체 대여 조회",
  get_expiring_rentals: "반납 기한 임박 조회",
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  domain?: AgentDomain
  toolsUsed?: string[]
  isStreaming?: boolean
  timestamp: Date
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `안녕하세요! 저는 AI 업무 도우미입니다.

다음과 같은 업무를 도와드릴 수 있습니다:

• **대상자 관리**: "김철수 대상자 찾아줘", "홍길동 서비스 이력 알려줘", "새 대상자 등록해줘"
• **일정 확인**: "오늘 일정 알려줘", "이번 주 방문 일정은?"
• **재고/대여**: "전동휠체어 재고 있어?", "현재 대여중인 기기 목록 보여줘"
• **규정 검색**: "대여 기간이 얼마야?", "맞춤제작 지원 금액 규정 알려줘"
• **공지사항**: "최근 공지사항 보여줘", "공지사항 작성해줘"
• **실적/통계**: "이번 달 실적 알려줘", "예산 집행 현황은?"
• **신청서 관리**: "새로 들어온 신청서 있어?", "반납 기한 지난 기기 알려줘"
• **SOAP 노트**: "다음 상담 내용으로 SOAP 노트 작성해줘: ..."

무엇을 도와드릴까요?`,
  timestamp: new Date(),
}

interface AgentChatProps {
  className?: string
}

export function AgentChat({ className }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeDomain, setActiveDomain] = useState<AgentDomain | null>(null)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 새 메시지 도착 시 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantId = `assistant-${Date.now() + 1}`
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      timestamp: new Date(),
    }

    // 대화 이력 구성 (welcome 메시지 제외)
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder])
    setInput("")
    setIsLoading(true)
    setError(null)
    setActiveDomain(null)
    setActiveTools([])

    abortRef.current = new AbortController()

    try {
      const response = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, conversationHistory: history }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `오류 코드: ${response.status}`)
      }

      if (!response.body) throw new Error("응답 스트림이 없습니다")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      const toolsThisMessage: string[] = []
      let finalDomain: AgentDomain | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event: StreamEvent = JSON.parse(line)

            switch (event.type) {
              case "routing_decision": {
                const payload = JSON.parse(event.data)
                finalDomain = payload.domain as AgentDomain
                setActiveDomain(finalDomain)
                break
              }
              case "tool_start": {
                const payload = JSON.parse(event.data)
                setActiveTools((prev) => [...new Set([...prev, payload.toolName])])
                break
              }
              case "tool_result": {
                const payload = JSON.parse(event.data)
                toolsThisMessage.push(payload.toolName)
                break
              }
              case "text_delta": {
                const payload = JSON.parse(event.data)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + payload.text }
                      : m
                  )
                )
                break
              }
              case "error": {
                const payload = JSON.parse(event.data)
                setError(payload.message)
                break
              }
              case "done": {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, isStreaming: false, domain: finalDomain, toolsUsed: toolsThisMessage }
                      : m
                  )
                )
                break
              }
            }
          } catch {
            // JSON 파싱 오류 무시
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return

      const errMsg = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      setError(errMsg)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "응답 생성 중 오류가 발생했습니다.", isStreaming: false }
            : m
        )
      )
    } finally {
      setIsLoading(false)
      setActiveDomain(null)
      setActiveTools([])
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsLoading(false)
  }

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      {/* 헤더 */}
      <CardHeader className="border-b pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">AI 업무 도우미</CardTitle>
            <CardDescription className="text-xs">
              대상자 · 일정 · 재고 · 규정 · 문서 생성
            </CardDescription>
          </div>
        </div>

        {/* 실시간 라우팅 표시기 */}
        {isLoading && (
          <div className="flex items-center gap-2 mt-2 min-h-[24px]">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            {activeDomain ? (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className={cn("text-xs py-0", DOMAIN_CONFIG[activeDomain].className)}
                >
                  {DOMAIN_CONFIG[activeDomain].label}
                </Badge>
                {activeTools.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {activeTools.map((t) => TOOL_LABEL[t] || t).join(", ")} 실행 중
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">처리 중...</span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-3 p-4 overflow-hidden">
        {/* 메시지 목록 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {/* 어시스턴트 아이콘 */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-1 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              {/* 메시지 버블 */}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                )}
              >
                {/* 내용 */}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {/* 스트리밍 커서 */}
                {msg.isStreaming && (
                  <span className="inline-block w-0.5 h-4 bg-current opacity-60 animate-pulse ml-0.5 align-middle" />
                )}

                {/* 도메인 + 도구 배지 */}
                {!msg.isStreaming && msg.domain && msg.domain !== "general" && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-current/10">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] py-0 h-4", DOMAIN_CONFIG[msg.domain].className)}
                    >
                      {DOMAIN_CONFIG[msg.domain].label}
                    </Badge>
                    {msg.toolsUsed?.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="text-[10px] py-0 h-4 text-muted-foreground"
                      >
                        {TOOL_LABEL[t] || t}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 시간 */}
                <p className="text-[10px] opacity-50 mt-1">
                  {msg.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* 사용자 아이콘 */}
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-1 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 오류 알림 */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* 입력 영역 */}
        <div className="flex gap-2 pt-2 border-t flex-shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="업무 질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1 text-sm"
            aria-label="메시지 입력"
          />
          {isLoading ? (
            <Button
              variant="outline"
              onClick={handleStop}
              className="shrink-0 text-xs px-3"
              aria-label="응답 중지"
            >
              중지
            </Button>
          ) : (
            <Button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="shrink-0"
              aria-label="메시지 전송"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
