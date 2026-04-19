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
  is_private: z.boolean(),
})
type FormValues = z.infer<typeof schema>

interface ChannelManageModalProps {
  open: boolean
  onClose: () => void
  room?: ChatRoom | null
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
