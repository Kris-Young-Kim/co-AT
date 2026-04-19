# Team Messenger (업무 채팅) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Co-AT 내에 영구 메시지 보관, 채널 분리, 파일 첨부, 읽음 표시, 멘션, 검색을 지원하는 팀 업무 메신저를 구현한다.

**Architecture:** Supabase postgres_changes Realtime 구독 (기존 useNotifications 패턴 재사용) + React Query 캐시. 채널(chat_rooms) → 메시지(chat_messages) → 읽음(chat_message_reads) 3개 테이블. 파일은 Supabase Storage `chat-files` 버킷.

**Tech Stack:** Next.js 16 App Router, Supabase Realtime, React Query v5, Clerk auth, Tailwind CSS, shadcn/ui, date-fns, lucide-react

---

## 파일 구조 맵

### 신규 생성
```
migrations/020_create_chat_tables.sql
actions/chat-actions.ts
lib/hooks/useChat.ts
lib/hooks/useChatSearch.ts
app/api/chat/upload/route.ts
app/(admin)/messenger/page.tsx
components/features/chat/team/
  ChatLayout.tsx          # 좌(채널목록) + 우(메시지) 2열 레이아웃
  ChannelList.tsx         # 채널 목록 + 미읽음 배지
  ChannelManageModal.tsx  # 채널 생성/수정/삭제
  MessageList.tsx         # 메시지 스크롤 뷰 + 날짜 구분선
  MessageItem.tsx         # 개별 메시지 (텍스트/파일/이미지)
  MessageInput.tsx        # 입력창 + 파일첨부 + 멘션 자동완성
  MentionSuggestions.tsx  # @멘션 드롭다운
  MessageSearch.tsx       # 채널 내 메시지 검색 패널
  FilePreview.tsx         # 이미지 미리보기 모달
```

### 수정
```
components/layout/admin-sidebar.tsx        # 메신저 메뉴 추가
components/layout/admin-mobile-bottom-nav.tsx  # 모바일 메신저 아이콘 추가
```

---

## Task 1: DB 마이그레이션

**Files:**
- Create: `migrations/020_create_chat_tables.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- migrations/020_create_chat_tables.sql

-- 채널 (공개/비공개)
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'channel', -- 'channel' | 'dm'
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 채널 멤버
CREATE TABLE IF NOT EXISTS chat_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, clerk_user_id)
);

-- 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT, -- 'image' | 'file'
  file_size INTEGER,
  mentions TEXT[] DEFAULT '{}',
  reply_to_id UUID REFERENCES chat_messages(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 읽음 표시 (채널별 마지막 읽은 시각)
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, clerk_user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(clerk_user_id);

-- 전문 검색 인덱스 (메시지 검색용)
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_fts
  ON chat_messages USING gin(to_tsvector('simple', coalesce(content, '')));

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

-- RLS 활성화
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 관리자/직원은 전체 접근
CREATE POLICY "staff_full_access_rooms" ON chat_rooms
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_members" ON chat_room_members
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_messages" ON chat_messages
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "staff_full_access_reads" ON chat_message_reads
  FOR ALL USING (auth.role() = 'authenticated');

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reads;

-- 기본 채널 생성 (전체 채팅방)
INSERT INTO chat_rooms (name, description, type, is_private, created_by)
VALUES ('전체', '전체 직원 채팅방', 'channel', false, 'system')
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Supabase 대시보드에서 마이그레이션 실행**

Supabase Dashboard > SQL Editor 에서 위 파일 내용을 붙여넣고 실행.

또는 CLI: `supabase db push`

- [ ] **Step 3: Supabase Storage 버킷 생성**

Supabase Dashboard > Storage > New Bucket
- Name: `chat-files`
- Public: true (이미지 미리보기를 위해)

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `types/chat.types.ts`

- [ ] **Step 1: 채팅 전용 타입 파일 작성**

```typescript
// types/chat.types.ts

export interface ChatRoom {
  id: string
  name: string
  description: string | null
  type: 'channel' | 'dm'
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  // 조인 데이터
  unread_count?: number
  last_message?: ChatMessage | null
  members?: ChatRoomMember[]
}

export interface ChatRoomMember {
  id: string
  room_id: string
  clerk_user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  // 조인 데이터
  profile?: {
    full_name: string
    email: string
    role: string
  }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: 'image' | 'file' | null
  file_size: number | null
  mentions: string[]
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
  // 조인 데이터
  sender?: {
    full_name: string
    email: string
  }
  reply_to?: ChatMessage | null
}

export interface ChatMessageRead {
  id: string
  room_id: string
  clerk_user_id: string
  last_read_at: string
}

export interface SendMessageInput {
  room_id: string
  content?: string
  file_url?: string
  file_name?: string
  file_type?: 'image' | 'file'
  file_size?: number
  mentions?: string[]
  reply_to_id?: string
}

export interface CreateRoomInput {
  name: string
  description?: string
  is_private?: boolean
}
```

---

## Task 3: Server Actions

**Files:**
- Create: `actions/chat-actions.ts`

- [ ] **Step 1: Server Actions 작성**

```typescript
// actions/chat-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import type { ChatRoom, ChatMessage, SendMessageInput, CreateRoomInput } from '@/types/chat.types'

async function getCurrentUserClerkId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('인증이 필요합니다')
  return userId
}

// 채널 목록 조회 (미읽음 수 포함)
export async function getChatRooms(): Promise<{
  success: boolean
  rooms?: ChatRoom[]
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = await createClient()

    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_members!inner(clerk_user_id)
      `)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // 각 채널의 미읽음 수 계산
    const { data: reads } = await supabase
      .from('chat_message_reads')
      .select('room_id, last_read_at')
      .eq('clerk_user_id', clerkUserId)

    const readMap = new Map(reads?.map(r => [r.room_id, r.last_read_at]) ?? [])

    const roomsWithUnread = await Promise.all(
      (rooms ?? []).map(async (room) => {
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

        // 마지막 메시지
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

// 메시지 목록 조회 (페이지네이션)
export async function getChatMessages(
  roomId: string,
  { limit = 50, before }: { limit?: number; before?: string } = {}
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = await createClient()

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

    // sender 프로필 조인
    const senderIds = [...new Set(messages?.map(m => m.sender_id) ?? [])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('clerk_user_id, full_name, email')
      .in('clerk_user_id', senderIds)

    const profileMap = new Map(profiles?.map(p => [p.clerk_user_id, p]) ?? [])

    const enriched = (messages ?? []).reverse().map(m => ({
      ...m,
      mentions: m.mentions ?? [],
      sender: profileMap.get(m.sender_id) ?? { full_name: '알 수 없음', email: '' },
    })) as ChatMessage[]

    return { success: true, messages: enriched }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// 메시지 전송
export async function sendChatMessage(input: SendMessageInput): Promise<{
  success: boolean
  message?: ChatMessage
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = await createClient()

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

    // 채널 updated_at 갱신
    await supabase
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', input.room_id)

    return { success: true, message: data as ChatMessage }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// 읽음 처리
export async function markRoomAsRead(roomId: string): Promise<{ success: boolean }> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = await createClient()

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

// 채널 생성
export async function createChatRoom(input: CreateRoomInput): Promise<{
  success: boolean
  room?: ChatRoom
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = await createClient()

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

    // 생성자를 owner로 멤버 추가
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

// 채널 수정
export async function updateChatRoom(
  roomId: string,
  input: Partial<CreateRoomInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = await createClient()

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

// 채널 삭제
export async function deleteChatRoom(roomId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await getCurrentUserClerkId()
    const supabase = await createClient()

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

// 메시지 삭제 (soft delete)
export async function deleteChatMessage(messageId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const clerkUserId = await getCurrentUserClerkId()
    const supabase = await createClient()

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

// 메시지 검색
export async function searchChatMessages(
  roomId: string,
  keyword: string
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    await getCurrentUserClerkId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .ilike('content', `%${keyword}%`)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error

    const senderIds = [...new Set(data?.map(m => m.sender_id) ?? [])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('clerk_user_id, full_name, email')
      .in('clerk_user_id', senderIds)

    const profileMap = new Map(profiles?.map(p => [p.clerk_user_id, p]) ?? [])

    const enriched = (data ?? []).map(m => ({
      ...m,
      mentions: m.mentions ?? [],
      sender: profileMap.get(m.sender_id) ?? { full_name: '알 수 없음', email: '' },
    })) as ChatMessage[]

    return { success: true, messages: enriched }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// 전체 프로필 목록 (멘션 자동완성용)
export async function getStaffProfiles(): Promise<{
  success: boolean
  profiles?: { clerk_user_id: string; full_name: string; email: string }[]
  error?: string
}> {
  try {
    await getCurrentUserClerkId()
    const supabase = await createClient()

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
```

---

## Task 4: 파일 업로드 API

**Files:**
- Create: `app/api/chat/upload/route.ts`

- [ ] **Step 1: 업로드 라우트 작성**

```typescript
// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${ext}`
  const isImage = file.type.startsWith('image/')

  const { data, error } = await supabase.storage
    .from('chat-files')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('chat-files')
    .getPublicUrl(data.path)

  return NextResponse.json({
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: isImage ? 'image' : 'file',
  })
}
```

---

## Task 5: Realtime 훅

**Files:**
- Create: `lib/hooks/useChat.ts`

- [ ] **Step 1: useChat 훅 작성**

```typescript
// lib/hooks/useChat.ts
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

// ── 채널 목록 훅
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

  // 새 메시지 수신 시 채널 목록 갱신
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

// ── 메시지 목록 훅 (실시간)
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

  // Realtime 구독
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
          // 내 메시지가 아니면 읽음 처리
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

  // 무한 스크롤 (이전 메시지 로드)
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

// ── 메시지 전송 뮤테이션
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { user } = useUser()

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendChatMessage(input),
    onMutate: async (input) => {
      // Optimistic update
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

// ── 메시지 삭제 뮤테이션
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
```

---

## Task 6: 채널 목록 컴포넌트

**Files:**
- Create: `components/features/chat/team/ChannelList.tsx`

- [ ] **Step 1: ChannelList 작성**

```tsx
// components/features/chat/team/ChannelList.tsx
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
```

---

## Task 7: 메시지 아이템 + 파일 미리보기

**Files:**
- Create: `components/features/chat/team/MessageItem.tsx`
- Create: `components/features/chat/team/FilePreview.tsx`

- [ ] **Step 1: FilePreview 모달**

```tsx
// components/features/chat/team/FilePreview.tsx
'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface FilePreviewProps {
  url: string
  name: string
  open: boolean
  onClose: () => void
}

export function FilePreview({ url, name, open, onClose }: FilePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-medium truncate">{name}</span>
          <div className="flex items-center gap-2">
            <a href={url} download={name} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative min-h-[300px] max-h-[70vh] overflow-auto flex items-center justify-center bg-muted">
          <Image
            src={url}
            alt={name}
            width={800}
            height={600}
            className="object-contain max-h-[70vh]"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: MessageItem 컴포넌트**

```tsx
// components/features/chat/team/MessageItem.tsx
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

  // @멘션 텍스트 하이라이트
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
        {/* 아바타 */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
          {(message.sender?.full_name ?? '?')[0]}
        </div>

        <div className="flex-1 min-w-0">
          {/* 헤더 */}
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

          {/* 답글 대상 */}
          {message.reply_to && (
            <div className="text-xs text-muted-foreground border-l-2 border-muted pl-2 mb-1 truncate">
              {message.reply_to.sender?.full_name}: {message.reply_to.content}
            </div>
          )}

          {/* 텍스트 */}
          {message.content && (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {renderContent(message.content)}
            </p>
          )}

          {/* 파일 */}
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

        {/* 액션 버튼 (hover 시 노출) */}
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
```

---

## Task 8: 메시지 목록

**Files:**
- Create: `components/features/chat/team/MessageList.tsx`

- [ ] **Step 1: MessageList 작성**

```tsx
// components/features/chat/team/MessageList.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { format, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
import { MessageItem } from './MessageItem'
import { useChatMessages, useDeleteMessage } from '@/lib/hooks/useChat'
import type { ChatMessage } from '@/types/chat.types'

interface MessageListProps {
  roomId: string
  onReply: (message: ChatMessage) => void
  staffProfiles: { clerk_user_id: string; full_name: string }[]
}

export function MessageList({ roomId, onReply, staffProfiles }: MessageListProps) {
  const { data: messages = [], isLoading, loadMore } = useChatMessages(roomId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  // 첫 로드 시 맨 아래로
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      isInitialLoad.current = false
    }
  }, [messages.length])

  // 새 메시지 수신 시 맨 아래로
  useEffect(() => {
    if (!isInitialLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // 스크롤 위로 올리면 이전 메시지 로드
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

  // 날짜별 그룹핑
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
      <div ref={topRef} />
      {groups.map((group) => (
        <div key={group.date.toISOString()}>
          {/* 날짜 구분선 */}
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
```

---

## Task 9: 멘션 자동완성 + 메시지 입력창

**Files:**
- Create: `components/features/chat/team/MentionSuggestions.tsx`
- Create: `components/features/chat/team/MessageInput.tsx`

- [ ] **Step 1: MentionSuggestions**

```tsx
// components/features/chat/team/MentionSuggestions.tsx
'use client'

interface Profile {
  clerk_user_id: string
  full_name: string
}

interface MentionSuggestionsProps {
  query: string
  profiles: Profile[]
  onSelect: (profile: Profile) => void
}

export function MentionSuggestions({ query, profiles, onSelect }: MentionSuggestionsProps) {
  const filtered = profiles.filter(p =>
    p.full_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  if (filtered.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 mb-1 w-56 bg-popover border rounded-md shadow-md z-50 overflow-hidden">
      {filtered.map((profile) => (
        <button
          key={profile.clerk_user_id}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
          onMouseDown={(e) => {
            e.preventDefault() // textarea blur 방지
            onSelect(profile)
          }}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {profile.full_name[0]}
          </div>
          {profile.full_name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: MessageInput**

```tsx
// components/features/chat/team/MessageInput.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Send, X, ImageIcon } from 'lucide-react'
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

  // 멘션 트리거 감지
  const handleChange = useCallback((value: string) => {
    setContent(value)
    const match = value.match(/@(\w*)$/)
    setMentionQuery(match ? match[1] : null)
  }, [])

  // 멘션 선택
  const handleMentionSelect = useCallback((profile: StaffProfile) => {
    const replaced = content.replace(/@\w*$/, `@${profile.full_name} `)
    setContent(replaced)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }, [content])

  // 파일 업로드
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

      // 파일 메시지 즉시 전송
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

  // 전송
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

  // Enter 전송 (Shift+Enter = 줄바꿈)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') setMentionQuery(null)
  }, [handleSend])

  return (
    <div className="border-t px-4 py-3 space-y-2">
      {/* 답글 표시 */}
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
```

---

## Task 10: 메시지 검색 패널

**Files:**
- Create: `components/features/chat/team/MessageSearch.tsx`

- [ ] **Step 1: MessageSearch 작성**

```tsx
// components/features/chat/team/MessageSearch.tsx
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
```

---

## Task 11: 채널 관리 모달

**Files:**
- Create: `components/features/chat/team/ChannelManageModal.tsx`

- [ ] **Step 1: ChannelManageModal 작성**

```tsx
// components/features/chat/team/ChannelManageModal.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createChatRoom, updateChatRoom, deleteChatRoom } from '@/actions/chat-actions'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatRoom } from '@/types/chat.types'

const schema = z.object({
  name: z.string().min(1, '채널 이름을 입력하세요').max(30),
  description: z.string().max(100).optional(),
  is_private: z.boolean().default(false),
})
type FormValues = z.infer<typeof schema>

interface ChannelManageModalProps {
  open: boolean
  onClose: () => void
  room?: ChatRoom | null // null = 생성 모드
}

export function ChannelManageModal({ open, onClose, room }: ChannelManageModalProps) {
  const queryClient = useQueryClient()
  const isEdit = !!room

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', is_private: false },
  })

  useEffect(() => {
    if (room) {
      reset({ name: room.name, description: room.description ?? '', is_private: room.is_private })
    } else {
      reset({ name: '', description: '', is_private: false })
    }
  }, [room, reset])

  const onSubmit = async (values: FormValues) => {
    if (isEdit && room) {
      await updateChatRoom(room.id, values)
    } else {
      await createChatRoom(values)
    }
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    onClose()
  }

  const handleDelete = async () => {
    if (!room || !confirm('채널을 삭제하면 모든 메시지가 삭제됩니다. 계속할까요?')) return
    await deleteChatRoom(room.id)
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '채널 수정' : '새 채널 만들기'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">채널 이름</Label>
            <Input id="name" placeholder="예: 일반" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">설명 (선택)</Label>
            <Input id="description" placeholder="채널 설명" {...register('description')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_private">비공개 채널</Label>
            <Switch
              id="is_private"
              checked={watch('is_private')}
              onCheckedChange={(v) => setValue('is_private', v)}
            />
          </div>
          <DialogFooter className="flex items-center justify-between">
            {isEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                채널 삭제
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>취소</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? '저장' : '만들기'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Task 12: 메인 레이아웃 조립

**Files:**
- Create: `components/features/chat/team/ChatLayout.tsx`
- Create: `app/(admin)/messenger/page.tsx`

- [ ] **Step 1: ChatLayout**

```tsx
// components/features/chat/team/ChatLayout.tsx
'use client'

import { useState, useCallback } from 'react'
import { Settings, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChannelList } from './ChannelList'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { MessageSearch } from './MessageSearch'
import { ChannelManageModal } from './ChannelManageModal'
import { markRoomAsRead } from '@/actions/chat-actions'
import { useQuery } from '@tanstack/react-query'
import { getStaffProfiles } from '@/actions/chat-actions'
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
```

- [ ] **Step 2: 메신저 페이지**

```tsx
// app/(admin)/messenger/page.tsx
import { ChatLayout } from '@/components/features/chat/team/ChatLayout'

export const metadata = {
  title: '업무 메신저 | Co-AT',
}

export default function MessengerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold">업무 메신저</h1>
        <p className="text-sm text-muted-foreground">팀 채널 기반 실시간 업무 채팅</p>
      </div>
      <ChatLayout />
    </div>
  )
}
```

---

## Task 13: 사이드바 메뉴 추가

**Files:**
- Modify: `components/layout/admin-sidebar.tsx`
- Modify: `components/layout/admin-mobile-bottom-nav.tsx`

- [ ] **Step 1: admin-sidebar.tsx에 메신저 메뉴 추가**

`admin-sidebar.tsx` 파일을 열어 navItems 배열에 아래 항목 추가 (적절한 위치에 삽입):

```typescript
{ href: '/admin/messenger', icon: MessageSquare, label: '업무 메신저' }
```

import 추가:
```typescript
import { MessageSquare } from 'lucide-react'
```

- [ ] **Step 2: admin-mobile-bottom-nav.tsx에 메신저 아이콘 추가**

동일하게 `MessageSquare` 아이콘과 `/admin/messenger` 링크 추가.

- [ ] **Step 3: 빌드 확인**

```bash
pnpm build
```

에러 없이 통과하면 완료.

---

## Task 14: 최종 검증

- [ ] **Step 1: 개발 서버 실행**

```bash
pnpm dev
```

- [ ] **Step 2: 기능 체크리스트**

| 항목 | 확인 |
|------|------|
| 채널 생성 | `+` 버튼 → 채널 이름 입력 → 생성 |
| 실시간 메시지 | 브라우저 탭 2개 열고 메시지 전송 → 즉시 수신 확인 |
| 파일 첨부 (이미지) | 클릭 시 미리보기 모달 |
| 파일 첨부 (일반) | 다운로드 링크 표시 |
| @멘션 | `@` 입력 시 드롭다운, 선택 시 하이라이트 |
| 답글 | Reply 버튼 → 입력창 상단에 원본 표시 |
| 읽음 표시 | 채널 진입 시 미읽음 배지 사라짐 |
| 메시지 검색 | 검색창 → 결과 클릭 시 해당 메시지로 이동 |
| 채널 수정/삭제 | 채널 설정 버튼 → 모달 |
| 이전 메시지 | 스크롤 위로 → 이전 50개 로드 |
| 메시지 삭제 | 내 메시지 hover → 삭제 버튼 |
| 영구 보관 | DB에 직접 쿼리하여 메시지 누락 없음 확인 |

- [ ] **Step 3: 커밋**

```bash
git add migrations/020_create_chat_tables.sql types/chat.types.ts actions/chat-actions.ts lib/hooks/useChat.ts app/api/chat/upload/route.ts app/(admin)/messenger/page.tsx components/features/chat/team/ components/layout/admin-sidebar.tsx components/layout/admin-mobile-bottom-nav.tsx
git commit -m "feat: 업무 메신저 구현 (채널, 실시간 메시지, 파일첨부, 멘션, 검색, 읽음)"
```
