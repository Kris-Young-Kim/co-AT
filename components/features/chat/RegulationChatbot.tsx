"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, MessageSquare, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { generateRegulationAnswer, type RAGAnswer } from "@/actions/rag-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{
    title: string
    section?: string
    similarity?: number
  }>
  timestamp: Date
}

interface RegulationChatbotProps {
  className?: string
}

export function RegulationChatbot({ className }: RegulationChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 보조기기센터 운영 지침서 전문가입니다. 궁금한 사항을 물어보세요.\n\n예시 질문:\n- 대여 기간은 얼마나 되나요?\n- 수리비 한도는 얼마인가요?\n- 맞춤제작 지원금은 얼마인가요?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      console.log("[RegulationChatbot] 질문 전송:", userMessage.content)
      
      const result = await generateRegulationAnswer(userMessage.content)

      if (!result.success || !result.answer) {
        throw new Error(result.error || "답변 생성에 실패했습니다")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer.answer,
        sources: result.answer.sources.map((source) => ({
          title: source.title,
          section: source.section,
          similarity: source.similarity,
        })),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      console.log("[RegulationChatbot] 답변 수신 완료")
    } catch (err) {
      console.error("[RegulationChatbot] 오류:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>규정 검색 챗봇</CardTitle>
        </div>
        <CardDescription>보조기기센터 운영 지침서 기반 질의응답</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 p-4">
        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* 참고 출처 표시 */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        참고 출처:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.slice(0, 3).map((source, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                            title={`유사도: ${((source.similarity || 0) * 100).toFixed(1)}%`}
                          >
                            {source.title}
                            {source.section && ` (${source.section})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs text-primary-foreground">사용자</span>
                  </div>
                )}
              </div>
            ))}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">답변 생성 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 입력 영역 */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
