'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2, Reply, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FilePreview } from './FilePreview'
import { useDeleteMessage } from '@/lib/hooks/useChat'
import { useUser } from '@clerk/nextjs'
import type { ChatMessage } from '@/types/chat.types'

interface MessageItemProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  staffProfiles: { clerk_user_id: string; full_name: string }[]
}

export function MessageItem({ message, onReply, staffProfiles }: MessageItemProps) {
  const { user } = useUser()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { mutate: deleteMessage } = useDeleteMessage()

  const isOwn = message.sender_id === user?.id
  const isMentioned = message.mentions?.includes(user?.id ?? '')

  if (message.is_deleted) {
    return (
      <div className="px-4 py-1">
        <span className="text-xs text-muted-foreground italic">삭제된 메시지입니다.</span>
      </div>
    )
  }

  function renderContent(content: string) {
    const parts = content.split(/(@\S+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const name = part.slice(1)
        const mentioned = staffProfiles.find(p => p.full_name === name)
        return (
          <span key={i} className={cn(
            'font-medium',
            mentioned ? 'text-blue-600 dark:text-blue-400' : ''
          )}>
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div
      className={cn(
        'group px-4 py-1 hover:bg-accent/30 transition-colors',
        isMentioned && 'bg-yellow-50 dark:bg-yellow-950/20 border-l-2 border-yellow-400'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
          {(message.sender?.full_name ?? '?')[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={cn('text-sm font-semibold', isOwn && 'text-primary')}>
              {message.sender?.full_name ?? '알 수 없음'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
          </div>

          {message.reply_to && (
            <div className="text-xs text-muted-foreground border-l-2 border-muted pl-2 mb-1 truncate">
              {message.reply_to.sender?.full_name}: {message.reply_to.content}
            </div>
          )}

          {message.content && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {renderContent(message.content)}
            </p>
          )}

          {message.file_url && message.file_type === 'image' && (
            <button
              className="mt-1 block rounded overflow-hidden border max-w-xs"
              onClick={() => setPreviewOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.file_url}
                alt={message.file_name ?? '이미지'}
                className="max-w-full max-h-48 object-cover"
              />
            </button>
          )}

          {message.file_url && message.file_type === 'file' && (
            <a
              href={message.file_url}
              download={message.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-2 text-xs text-blue-600 hover:underline"
            >
              <FileIcon className="h-4 w-4" />
              {message.file_name}
              {message.file_size && (
                <span className="text-muted-foreground">
                  ({Math.round(message.file_size / 1024)}KB)
                </span>
              )}
            </a>
          )}
        </div>

        {hovered && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onReply?.(message)}
              title="답글"
            >
              <Reply className="h-3.5 w-3.5" />
            </Button>
            {isOwn && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => deleteMessage({ messageId: message.id, roomId: message.room_id })}
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {message.file_url && message.file_type === 'image' && (
        <FilePreview
          url={message.file_url}
          name={message.file_name ?? '이미지'}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  )
}
