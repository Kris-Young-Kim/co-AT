export interface ChatRoom {
  id: string
  name: string
  description: string | null
  is_private: boolean
  type: string
  created_by: string
  created_at: string
  updated_at: string
  unread_count?: number
  last_message?: {
    id: string
    content: string | null
    file_type: string | null
    created_at: string
    sender_id: string
  } | null
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  mentions: string[]
  reply_to_id: string | null
  is_deleted: boolean
  created_at: string
  sender?: {
    full_name: string
    email: string
  }
}

export interface SendMessageInput {
  room_id: string
  content?: string | null
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  file_size?: number | null
  mentions?: string[]
  reply_to_id?: string | null
}

export interface CreateRoomInput {
  name: string
  description?: string | null
  is_private?: boolean
}
