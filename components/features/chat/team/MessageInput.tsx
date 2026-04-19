'use client'

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MentionSuggestions } from './MentionSuggestions'
import { useSendMessage } from '@/lib/hooks/useChat'
import type { ChatMessage } from '@/types/chat.types'

interface StaffProfile {
  clerk_user_id: string
  full_name: string
}

interface MessageInputProps {
  roomId: string
  replyTo: ChatMessage | null
  onCancelReply: () => void
  staffProfiles: StaffProfile[]
  disabled?: boolean
}

export function MessageInput({
  roomId,
  replyTo,
  onCancelReply,
  staffProfiles,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate: sendMessage, isPending } = useSendMessage()

  const handleChange = useCallback((value: string) => {
    setContent(value)
    const match = value.match(/@(\w*)$/)
    setMentionQuery(match ? match[1] : null)
  }, [])

  const handleMentionSelect = useCallback((profile: StaffProfile) => {
    const replaced = content.replace(/@\w*$/, `@${profile.full_name} `)
    setContent(replaced)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }, [content])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const mentions = extractMentions(content, staffProfiles)
      sendMessage({
        room_id: roomId,
        content: content.trim() || undefined,
        file_url: data.url,
        file_name: data.name,
        file_type: data.type,
        file_size: data.size,
        mentions,
        reply_to_id: replyTo?.id,
      })
      setContent('')
      onCancelReply()
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [content, roomId, replyTo, onCancelReply, sendMessage, staffProfiles])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    const mentions = extractMentions(trimmed, staffProfiles)
    sendMessage({
      room_id: roomId,
      content: trimmed,
      mentions,
      reply_to_id: replyTo?.id,
    })
    setContent('')
    onCancelReply()
    textareaRef.current?.focus()
  }, [content, isPending, roomId, replyTo, onCancelReply, sendMessage, staffProfiles])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') setMentionQuery(null)
  }, [handleSend])

  return (
    <div className="border-t px-4 py-3 space-y-2">
      {replyTo && (
        <div className="flex items-center justify-between bg-muted rounded px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            <span className="font-medium">{replyTo.sender?.full_name}</span>에게 답글
            {replyTo.content && `: ${replyTo.content.slice(0, 40)}${replyTo.content.length > 40 ? '…' : ''}`}
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        {mentionQuery !== null && (
          <MentionSuggestions
            query={mentionQuery}
            profiles={staffProfiles}
            onSelect={handleMentionSelect}
          />
        )}

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력... (@멘션, Shift+Enter 줄바꿈)"
          className="min-h-[40px] max-h-[120px] resize-none"
          disabled={disabled || isPending || isUploading}
          rows={1}
        />

        <div className="flex items-center gap-1 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isPending || isUploading}
            title="파일 첨부"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={handleSend}
            disabled={!content.trim() || disabled || isPending || isUploading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function extractMentions(content: string, profiles: StaffProfile[]): string[] {
  const matches = content.match(/@(\S+)/g) ?? []
  return matches
    .map(m => {
      const name = m.slice(1)
      return profiles.find(p => p.full_name === name)?.clerk_user_id
    })
    .filter((id): id is string => !!id)
}
