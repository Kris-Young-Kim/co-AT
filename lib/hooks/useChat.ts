'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'
import {
  getChatRooms,
  getChatMessages,
  sendChatMessage,
  markRoomAsRead,
  deleteChatMessage,
} from '@/actions/chat-actions'
import type { ChatMessage, SendMessageInput } from '@/types/chat.types'

export function useChatRooms() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const res = await getChatRooms()
      if (!res.success) throw new Error(res.error)
      return res.rooms ?? []
    },
    staleTime: 30_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel('chat-rooms-watcher')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => { queryClient.invalidateQueries({ queryKey: ['chat-rooms'] }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, queryClient])

  return query
}

export function useChatMessages(roomId: string | null) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { user } = useUser()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const query = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return []
      const res = await getChatMessages(roomId)
      if (!res.success) throw new Error(res.error)
      return res.messages ?? []
    },
    enabled: !!roomId,
    staleTime: 0,
  })

  useEffect(() => {
    if (!roomId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`chat-messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          queryClient.setQueryData<ChatMessage[]>(
            ['chat-messages', roomId],
            (old) => {
              if (!old) return [newMsg]
              if (old.find(m => m.id === newMsg.id)) return old
              return [...old, { ...newMsg, mentions: newMsg.mentions ?? [] }]
            }
          )
          if (newMsg.sender_id !== user?.id) {
            markRoomAsRead(roomId)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage
          queryClient.setQueryData<ChatMessage[]>(
            ['chat-messages', roomId],
            (old) => old?.map(m => m.id === updated.id ? { ...m, ...updated } : m) ?? []
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, supabase, queryClient, user?.id])

  const loadMore = useCallback(async () => {
    if (!roomId) return
    const current = queryClient.getQueryData<ChatMessage[]>(['chat-messages', roomId]) ?? []
    if (current.length === 0) return

    const oldest = current[0].created_at
    const res = await getChatMessages(roomId, { before: oldest, limit: 50 })
    if (!res.success || !res.messages?.length) return

    queryClient.setQueryData<ChatMessage[]>(
      ['chat-messages', roomId],
      (old) => [...(res.messages ?? []), ...(old ?? [])]
    )
  }, [roomId, queryClient])

  return { ...query, loadMore }
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendChatMessage(input),
    onMutate: async (input) => {
      const tempMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        room_id: input.room_id,
        sender_id: user?.id ?? '',
        content: input.content ?? null,
        file_url: input.file_url ?? null,
        file_name: input.file_name ?? null,
        file_type: input.file_type ?? null,
        file_size: input.file_size ?? null,
        mentions: input.mentions ?? [],
        reply_to_id: input.reply_to_id ?? null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: { full_name: user?.fullName ?? '나', email: user?.primaryEmailAddress?.emailAddress ?? '' },
      }

      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', input.room_id],
        (old) => [...(old ?? []), tempMsg]
      )

      return { tempId: tempMsg.id }
    },
    onSuccess: (result, input, context) => {
      if (!result.success || !result.message) return
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', input.room_id],
        (old) => old?.map(m => m.id === context?.tempId ? result.message! : m) ?? []
      )
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (_, input, context) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', input.room_id],
        (old) => old?.filter(m => m.id !== context?.tempId) ?? []
      )
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; roomId: string }) =>
      deleteChatMessage(messageId),
    onSuccess: (_, { roomId, messageId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', roomId],
        (old) => old?.map(m => m.id === messageId ? { ...m, is_deleted: true } : m) ?? []
      )
    },
  })
}
