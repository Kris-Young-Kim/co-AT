// components/features/schedule/EventRoleModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Users } from "lucide-react"
import {
  getEventRoles,
  createEventRole,
  deleteEventRole,
  ROLE_PRESETS,
  type EventRole,
} from "@/actions/event-role-actions"

interface EventRoleModalProps {
  scheduleId: string | null
  scheduleName: string
  onClose: () => void
}

export function EventRoleModal({ scheduleId, scheduleName, onClose }: EventRoleModalProps) {
  const [roles, setRoles] = useState<EventRole[]>([])
  const [loading, setLoading] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [assigneeName, setAssigneeName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    getEventRoles(scheduleId).then(result => {
      if (result.success) setRoles(result.roles ?? [])
      setLoading(false)
    })
  }, [scheduleId])

  const effectiveRoleName = roleName === '기타' ? customRole : roleName

  const handleAdd = async () => {
    if (!scheduleId || !effectiveRoleName.trim() || !assigneeName.trim()) return
    setSubmitting(true)
    const result = await createEventRole({
      schedule_id: scheduleId,
      role_name: effectiveRoleName.trim(),
      assignee_name: assigneeName.trim(),
      notes: notes.trim() || undefined,
    })
    if (result.success && result.role) {
      setRoles(prev => [...prev, result.role!])
      setRoleName('')
      setCustomRole('')
      setAssigneeName('')
      setNotes('')
    } else {
      alert(result.error || '추가에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleDelete = async (role: EventRole) => {
    const result = await deleteEventRole(role.id)
    if (result.success) {
      setRoles(prev => prev.filter(r => r.id !== role.id))
    }
  }

  return (
    <Dialog open={!!scheduleId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            역할 분담
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{scheduleName}</p>
        </DialogHeader>

        {/* 현재 역할 목록 */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {loading && <p className="text-sm text-muted-foreground text-center py-2">로딩 중...</p>}
          {!loading && roles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">아직 역할이 배정되지 않았습니다.</p>
          )}
          {roles.map(role => (
            <div key={role.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs shrink-0">{role.role_name}</Badge>
                <span className="text-sm font-medium">{role.assignee_name}</span>
                {role.notes && <span className="text-xs text-muted-foreground">({role.notes})</span>}
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => handleDelete(role)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* 역할 추가 폼 */}
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">역할 추가</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">역할</Label>
              <Select value={roleName} onValueChange={setRoleName}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_PRESETS.map(preset => (
                    <SelectItem key={preset} value={preset}>{preset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleName === '기타' && (
                <Input
                  className="mt-1 h-8 text-sm"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="역할명 직접 입력"
                />
              )}
            </div>
            <div>
              <Label className="text-xs">담당자</Label>
              <Input
                className="h-8 text-sm"
                value={assigneeName}
                onChange={e => setAssigneeName(e.target.value)}
                placeholder="담당자 이름"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">비고 (선택)</Label>
            <Input
              className="h-8 text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="추가 정보"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={submitting || !effectiveRoleName.trim() || !assigneeName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            {submitting ? '추가 중...' : '역할 추가'}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
