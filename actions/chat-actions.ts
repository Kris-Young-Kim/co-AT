'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import type { ChatRoom, ChatMessage, SendMessageInput, CreateRoomInput } from '@/types/chat.types'

type AnyClient = any

async function getCurrentUserClerkId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('인증이 필요합니다')
  return userId
}

export async function getChatRooms(): Promise<{
  success: boolean
  rooms?: ChatRoom[]
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    const { data: reads } = await supabase
      .from('chat_message_reads')
      .select('room_id, last_read_at')
      .eq('clerk_user_id', clerkUserId)

    const readMap = new Map(reads?.map((r: { room_id: string; last_read_at: string }) => [r.room_id, r.last_read_at]) ?? [])

    const roomsWithUnread = await Promise.all(
      ((rooms ?? []) as ChatRoom[]).map(async (room: ChatRoom) => {
        const lastRead = readMap.get(room.id)
        let unread_count = 0

        if (lastRead) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_deleted', false)
            .neq('sender_id', clerkUserId)
            .gt('created_at', lastRead)
          unread_count = count ?? 0
        } else {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .eq('is_deleted', false)
          unread_count = count ?? 0
        }

        const { data: lastMsgs } = await supabase
          .from('chat_messages')
          .select('id, content, file_type, created_at, sender_id')
          .eq('room_id', room.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...room,
          unread_count,
          last_message: lastMsgs?.[0] ?? null,
        } as ChatRoom
      })
    )

    return { success: true, rooms: roomsWithUnread }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getChatMessages(
  roomId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {}
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query
    if (error) throw error

    const senderIds = [...new Set(messages?.map((m: any) => m.sender_id) ?? [])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('clerk_user_id, full_name, email')
      .in('clerk_user_id', senderIds)

    const profileMap = new Map(profiles?.map((p: any) => [p.clerk_user_id, p]) ?? [])

    const enriched = ((messages ?? []) as any[]).reverse().map((m: any) => ({
      ...m,
      mentions: m.mentions ?? [],
      sender: profileMap.get(m.sender_id) ?? { full_name: '알 수 없음', email: '' },
    })) as ChatMessage[]

    return { success: true, messages: enriched }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function sendChatMessage(input: SendMessageInput): Promise<{
  success: boolean
  message?: ChatMessage
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    if (!input.content && !input.file_url) {
      throw new Error('내용 또는 파일이 필요합니다')
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: input.room_id,
        sender_id: clerkUserId,
        content: input.content ?? null,
        file_url: input.file_url ?? null,
        file_name: input.file_name ?? null,
        file_type: input.file_type ?? null,
        file_size: input.file_size ?? null,
        mentions: input.mentions ?? [],
        reply_to_id: input.reply_to_id ?? null,
      })
      .select()
      .single()

    if (error) throw error

    await supabase
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', input.room_id)

    return { success: true, message: data as ChatMessage }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function markRoomAsRead(roomId: string): Promise<{ success: boolean }> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    await supabase
      .from('chat_message_reads')
      .upsert({
        room_id: roomId,
        clerk_user_id: clerkUserId,
        last_read_at: new Date().toISOString(),
      }, { onConflict: 'room_id,clerk_user_id' })

    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function createChatRoom(input: CreateRoomInput): Promise<{
  success: boolean
  room?: ChatRoom
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: input.name,
        description: input.description ?? null,
        is_private: input.is_private ?? false,
        created_by: clerkUserId,
        type: 'channel',
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('chat_room_members').insert({
      room_id: room.id,
      clerk_user_id: clerkUserId,
      role: 'owner',
    })

    return { success: true, room: room as ChatRoom }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function updateChatRoom(
  roomId: string,
  input: Partial<CreateRoomInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { error } = await supabase
      .from('chat_rooms')
      .update({ name: input.name, description: input.description })
      .eq('id', roomId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteChatRoom(roomId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function deleteChatMessage(messageId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('sender_id', clerkUserId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function searchChatMessages(
  roomId: string,
  keyword: string
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .ilike('content', `%${keyword}%`)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const senderIds = [...new Set(data?.map((m: any) => m.sender_id) ?? [])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('clerk_user_id, full_name, email')
      .in('clerk_user_id', senderIds)

    const profileMap = new Map(profiles?.map((p: any) => [p.clerk_user_id, p]) ?? [])

    const enriched = ((data ?? []) as any[]).map((m: any) => ({
      ...m,
      mentions: m.mentions ?? [],
      sender: profileMap.get(m.sender_id) ?? { full_name: '알 수 없음', email: '' },
    })) as ChatMessage[]

    return { success: true, messages: enriched }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function getStaffProfiles(): Promise<{
  success: boolean
  profiles?: { clerk_user_id: string; full_name: string; email: string }[]
  error?: string
}> {
  try {
    await getCurrentUserClerkId()
    const supabase = createAdminClient() as AnyClient

    const { data, error } = await supabase
      .from('profiles')
      .select('clerk_user_id, full_name, email')
      .in('role', ['admin', 'staff', 'manager'])
      .order('full_name')

    if (error) throw error
    return { success: true, profiles: data ?? [] }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
