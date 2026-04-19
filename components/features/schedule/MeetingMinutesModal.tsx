// components/features/schedule/MeetingMinutesModal.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { getMeetingMinutes, saveMeetingMinutes, type MeetingType, type ActionItem } from "@/actions/meeting-actions"

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  weekly: '주간팀회의',
  monthly: '월례회의',
  biweekly_policy: '2주 정책결정회의',
  other: '기타',
}

interface MeetingMinutesModalProps {
  scheduleId: string | null
  scheduleName: string
  onClose: () => void
}

export function MeetingMinutesModal({ scheduleId, scheduleName, onClose }: MeetingMinutesModalProps) {
  const [meetingType, setMeetingType] = useState<MeetingType>('weekly')
  const [attendees, setAttendees] = useState('')
  const [agenda, setAgenda] = useState('')
  const [minutesText, setMinutesText] = useState('')
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newAction, setNewAction] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    getMeetingMinutes(scheduleId).then(result => {
      if (result.success && result.minutes) {
        const m = result.minutes
        setMeetingType(m.meeting_type)
        setAttendees(m.attendees.join(', '))
        setAgenda(m.agenda ?? '')
        setMinutesText(m.minutes ?? '')
        setActionItems(m.action_items ?? [])
      }
      setLoading(false)
    })
  }, [scheduleId])

  const addActionItem = () => {
    if (!newAction.trim()) return
    setActionItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), content: newAction, assignee: newAssignee, done: false }
    ])
    setNewAction('')
    setNewAssignee('')
  }

  const toggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }

  const removeActionItem = (id: string) => {
    setActionItems(prev => prev.filter(a => a.id !== id))
  }

  const handleSave = async () => {
    if (!scheduleId) return
    setSubmitting(true)
    const result = await saveMeetingMinutes({
      schedule_id: scheduleId,
      meeting_type: meetingType,
      attendees: attendees.split(',').map(s => s.trim()).filter(Boolean),
      agenda: agenda || undefined,
      minutes: minutesText || undefined,
      action_items: actionItems,
    })
    if (result.success) {
      onClose()
    } else {
      alert(result.error || '저장에 실패했습니다')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={!!scheduleId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회의록</DialogTitle>
          <p className="text-sm text-muted-foreground">{scheduleName}</p>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-center py-4 text-muted-foreground">로딩 중...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>회의 유형</Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(MEETING_TYPE_LABELS) as [MeetingType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>참석자 (쉼표로 구분)</Label>
              <Input value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="홍길동, 김철수, ..." />
            </div>

            <div>
              <Label>안건</Label>
              <Textarea value={agenda} onChange={e => setAgenda(e.target.value)} placeholder="회의 안건을 입력하세요" rows={3} />
            </div>

            <div>
              <Label>회의록</Label>
              <Textarea value={minutesText} onChange={e => setMinutesText(e.target.value)} placeholder="회의 내용을 기록하세요" rows={5} />
            </div>

            <div>
              <Label>액션 아이템</Label>
              <div className="space-y-2 mt-1">
                {actionItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox checked={item.done} onCheckedChange={() => toggleActionItem(item.id)} />
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                      {item.content}
                    </span>
                    {item.assignee && <Badge variant="outline" className="text-xs">{item.assignee}</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => removeActionItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={newAction}
                    onChange={e => setNewAction(e.target.value)}
                    placeholder="액션 아이템"
                    onKeyDown={e => { if (e.key === 'Enter') addActionItem() }}
                  />
                  <Input className="w-24" value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="담당자" />
                  <Button variant="outline" size="sm" onClick={addActionItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={handleSave} disabled={submitting || loading}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
