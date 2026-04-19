// components/features/tasks/TaskFormDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createWorkTask, updateWorkTask, type WorkTask, type CreateTaskInput, type TaskStatus, type TaskPriority } from "@/actions/work-task-actions"

interface TaskFormDialogProps {
  open: boolean
  onClose: () => void
  task?: WorkTask | null
  defaultStatus?: TaskStatus
  onSuccess: (task: WorkTask) => void
}

export function TaskFormDialog({ open, onClose, task, defaultStatus = 'todo', onSuccess }: TaskFormDialogProps) {
  const [form, setForm] = useState<CreateTaskInput>({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus,
    priority: task?.priority ?? 'medium',
    assignee_id: task?.assignee_id ?? '',
    due_date: task?.due_date ?? '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.title?.trim()) return
    setSubmitting(true)

    if (task) {
      const result = await updateWorkTask(task.id, form)
      if (result.success) {
        onSuccess({ ...task, ...form, updated_at: new Date().toISOString() } as WorkTask)
        onClose()
      } else {
        alert(result.error || '수정에 실패했습니다')
      }
    } else {
      const result = await createWorkTask(form)
      if (result.success && result.task) {
        onSuccess(result.task)
        onClose()
      } else {
        alert(result.error || '생성에 실패했습니다')
      }
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? '업무 수정' : '업무 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>제목 *</Label>
            <Input
              value={form.title ?? ''}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="업무 제목"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            />
          </div>
          <div>
            <Label>설명</Label>
            <Textarea
              value={form.description ?? ''}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="업무 설명 (선택)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>우선순위</Label>
              <Select
                value={form.priority ?? 'medium'}
                onValueChange={v => setForm(prev => ({ ...prev, priority: v as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔴 높음</SelectItem>
                  <SelectItem value="medium">🟡 보통</SelectItem>
                  <SelectItem value="low">🟢 낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>마감일</Label>
              <Input
                type="date"
                value={form.due_date ?? ''}
                onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>담당자 (이름)</Label>
            <Input
              value={form.assignee_id ?? ''}
              onChange={e => setForm(prev => ({ ...prev, assignee_id: e.target.value }))}
              placeholder="담당자 이름"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting || !form.title?.trim()}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
