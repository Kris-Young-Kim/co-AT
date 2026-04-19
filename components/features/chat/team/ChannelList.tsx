'use client'

import { Hash, Plus, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useChatRooms } from '@/lib/hooks/useChat'
import type { ChatRoom } from '@/types/chat.types'

interface ChannelListProps {
  selectedRoomId: string | null
  onSelectRoom: (room: ChatRoom) => void
  onCreateRoom: () => void
}

export function ChannelList({ selectedRoomId, onSelectRoom, onCreateRoom }: ChannelListProps) {
  const { data: rooms = [], isLoading } = useChatRooms()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground">채널</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCreateRoom}
          title="채널 만들기"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 py-2 space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-1.5 text-sm rounded-md mx-1 transition-colors',
                selectedRoomId === room.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              {room.is_private ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Hash className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="flex-1 text-left truncate">{room.name}</span>
              {(room.unread_count ?? 0) > 0 && (
                <Badge
                  variant="destructive"
                  className="h-4 min-w-4 px-1 text-[10px] rounded-full"
                >
                  {room.unread_count}
                </Badge>
              )}
            </button>
          ))
        )}
      </nav>
    </div>
  )
}
