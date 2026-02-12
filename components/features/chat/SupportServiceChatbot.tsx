"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send, MessageSquare, AlertCircle } from "lucide-react"
import { generateSupportServiceAnswer } from "@/actions/support-service-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SupportServiceChatbotProps {
  className?: string
}

export function SupportServiceChatbot({ className }: SupportServiceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! 강원특별자치도 보조기기센터 지원사업 안내 챗봇입니다.\n\n궁금한 사항을 물어보세요.\n\n예시:\n- 대여 기간은 얼마나 되나요?\n- 수리비 한도는 얼마인가요?\n- 맞춤제작 지원금은 얼마인가요?\n- 어떤 분이 이용할 수 있나요?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      const result = await generateSupportServiceAnswer(userMessage.content)

      if (!result.success || !result.answer) {
        throw new Error(result.error || "답변 생성에 실패했습니다")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.answer.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error("[SupportServiceChatbot] 오류:", err)
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      )
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
    <Card className={cn("flex flex-col", className || "h-[600px]")}>
      <CardContent className="flex flex-col flex-1 gap-4 p-4 pt-6">
        {/* 메시지 영역 */}
        <div
          className="flex-1 overflow-y-auto pr-4 min-h-0"
          ref={scrollAreaRef}
          role="log"
          aria-live="polite"
        >
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
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                    aria-hidden
                  >
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className="text-xs opacity-70 mt-2"
                    aria-hidden
                  >
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                    aria-hidden
                  >
                    <span className="text-xs text-primary-foreground">나</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                  aria-hidden
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden
                    />
                    <span className="text-sm text-muted-foreground">
                      답변 생성 중...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-wrap break-words">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 입력 영역 */}
        <div className="flex gap-2 flex-shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="질문을 입력하세요..."
            disabled={isLoading}
            className="flex-1"
            aria-label="지원사업 질문 입력"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="전송"
          >
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
