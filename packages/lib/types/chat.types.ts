export interface ChatRoom {
  id: string
  name: string
  description: string | null
  type: 'channel' | 'dm'
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
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
