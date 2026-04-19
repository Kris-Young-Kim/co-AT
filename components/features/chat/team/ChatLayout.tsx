'use client'

import { useState, useCallback } from 'react'
import { Settings, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChannelList } from './ChannelList'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { MessageSearch } from './MessageSearch'
import { ChannelManageModal } from './ChannelManageModal'
import { markRoomAsRead, getStaffProfiles } from '@/actions/chat-actions'
import { useQuery } from '@tanstack/react-query'
import type { ChatRoom, ChatMessage } from '@/types/chat.types'

export function ChatLayout() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null)

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ['staff-profiles'],
    queryFn: async () => {
      const res = await getStaffProfiles()
      return res.profiles ?? []
    },
    staleTime: 5 * 60_000,
  })

  const handleSelectRoom = useCallback(async (room: ChatRoom) => {
    setSelectedRoom(room)
    setReplyTo(null)
    setIsSearchOpen(false)
    await markRoomAsRead(room.id)
  }, [])

  return (
    <div className="flex h-full border rounded-lg overflow-hidden bg-background">
      {/* 좌: 채널 목록 */}
      <div className="w-56 shrink-0 border-r bg-muted/30">
        <ChannelList
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={handleSelectRoom}
          onCreateRoom={() => { setEditingRoom(null); setIsManageOpen(true) }}
        />
      </div>

      {/* 우: 메시지 영역 */}
      <div className="flex flex-1 min-w-0">
        <div className="flex flex-col flex-1 min-w-0">
          {selectedRoom ? (
            <>
              {/* 채널 헤더 */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b">
                <div>
                  <h3 className="font-semibold text-sm">#{selectedRoom.name}</h3>
                  {selectedRoom.description && (
                    <p className="text-xs text-muted-foreground">{selectedRoom.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsSearchOpen(v => !v)}
                    title="메시지 검색"
                  >
                    <SearchIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingRoom(selectedRoom); setIsManageOpen(true) }}
                    title="채널 설정"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <MessageList
                roomId={selectedRoom.id}
                onReply={setReplyTo}
                staffProfiles={staffProfiles}
              />

              <MessageInput
                roomId={selectedRoom.id}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                staffProfiles={staffProfiles}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              채널을 선택하세요
            </div>
          )}
        </div>

        {/* 검색 패널 */}
        {isSearchOpen && selectedRoom && (
          <MessageSearch
            roomId={selectedRoom.id}
            onClose={() => setIsSearchOpen(false)}
            onJumpTo={(id) => {
              const el = document.getElementById(`msg-${id}`)
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              setIsSearchOpen(false)
            }}
          />
        )}
      </div>

      {/* 채널 관리 모달 */}
      <ChannelManageModal
        open={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        room={editingRoom}
      />
    </div>
  )
}
