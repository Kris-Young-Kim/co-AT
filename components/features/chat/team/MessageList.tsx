'use client'

import { useEffect, useRef, useCallback } from 'react'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { MessageItem } from './MessageItem'
import { useChatMessages } from '@/lib/hooks/useChat'
import type { ChatMessage } from '@/types/chat.types'

interface MessageListProps {
  roomId: string
  onReply: (message: ChatMessage) => void
  staffProfiles: { clerk_user_id: string; full_name: string }[]
}

export function MessageList({ roomId, onReply, staffProfiles }: MessageListProps) {
  const { data: messages = [], isLoading, loadMore } = useChatMessages(roomId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    if (messages.length > 0 && isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      isInitialLoad.current = false
    }
  }, [messages.length])

  useEffect(() => {
    if (!isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 100) {
      loadMore()
    }
  }, [loadMore])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const groups: { date: Date; messages: ChatMessage[] }[] = []
  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at)
    const last = groups[groups.length - 1]
    if (!last || !isSameDay(last.date, msgDate)) {
      groups.push({ date: msgDate, messages: [msg] })
    } else {
      last.messages.push(msg)
    }
  })

  return (
    <div
      className="flex-1 overflow-y-auto py-2"
      onScroll={handleScroll}
    >
      {groups.map((group) => (
        <div key={group.date.toISOString()}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground shrink-0">
              {format(group.date, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          {group.messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onReply={onReply}
              staffProfiles={staffProfiles}
            />
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
