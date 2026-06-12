"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import Link from "next/link"
import { MessageCircle, X, Send, Bot, User, ExternalLink, Loader2 } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  showApplyButton?: boolean
}

const APPLY_KEYWORDS = ["신청", "접수", "어떻게 하", "방법", "절차", "등록"]
const QUICK_SUGGESTIONS = [
  "어떤 서비스를 이용할 수 있나요?",
  "신청 자격이 어떻게 되나요?",
  "보조기기 대여 방법을 알려주세요",
  "교부사업이 무엇인가요?",
]

function shouldShowApplyButton(text: string): boolean {
  return APPLY_KEYWORDS.some((kw) => text.includes(kw))
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! 강원특별자치도 보조공학기기 지원센터 AI 상담봇입니다. 보조기기 서비스에 대해 궁금한 점을 질문해 주세요.",
    },
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Save conversation when closing (after first user message)
  function handleClose() {
    setOpen(false)
    const userMsgs = messages.filter((m) => m.role === "user")
    if (!savedRef.current && userMsgs.length > 0) {
      savedRef.current = true
      const question = userMsgs[0].content
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
      startTransition(async () => {
        await fetch("/api/chatbot/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer: lastAssistant?.content }),
        })
      })
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    const newUserMsg: Message = { role: "user", content: trimmed }
    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)
    setInput("")
    setStreaming(true)

    const assistantMsg: Message = { role: "assistant", content: "" }
    setMessages([...updatedMessages, assistantMsg])

    try {
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      })

      if (!res.ok || !res.body) throw new Error("응답 오류")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: "assistant",
            content: full,
            showApplyButton: shouldShowApplyButton(full),
          }
          return copy
        })
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: "assistant",
          content: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
          aria-label="AI 상담 챗봇 열기"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">보조기기 상담봇</p>
              <p className="text-xs text-indigo-200 leading-tight">강원특별자치도 보조공학기기 지원센터</p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm"
                      : "bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.showApplyButton && (
                    <Link
                      href="/apply/wizard"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      onClick={handleClose}
                    >
                      <ExternalLink className="h-3 w-3" />
                      서비스 신청하러 가기
                    </Link>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {streaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (only before first user message) */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t bg-white shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 점을 입력하세요..."
              disabled={streaming}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 bg-gray-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="전송"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
