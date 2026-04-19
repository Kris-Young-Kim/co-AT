'use client'

import { useState, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchChatMessages } from '@/actions/chat-actions'
import type { ChatMessage } from '@/types/chat.types'

interface MessageSearchProps {
  roomId: string
  onClose: () => void
  onJumpTo: (messageId: string) => void
}

export function MessageSearch({ roomId, onClose, onJumpTo }: MessageSearchProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<ChatMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return
    setIsSearching(true)
    const res = await searchChatMessages(roomId, keyword)
    setResults(res.messages ?? [])
    setIsSearching(false)
  }, [roomId, keyword])

  return (
    <div className="flex flex-col h-full border-l w-72 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-semibold text-sm">메시지 검색</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 py-3 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="검색어 입력..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-sm"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results.length === 0 && keyword && !isSearching && (
          <p className="text-sm text-muted-foreground text-center py-8">검색 결과 없음</p>
        )}
        {results.map((msg) => (
          <button
            key={msg.id}
            className="w-full text-left px-4 py-3 hover:bg-accent border-b"
            onClick={() => onJumpTo(msg.id)}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-medium">{msg.sender?.full_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(msg.created_at), 'M/d HH:mm', { locale: ko })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {msg.content}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
