// components/features/crm/ClientVocTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, Lightbulb, ThumbsUp, Plus, CheckCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  getClientVocs,
  createClientVoc,
  resolveClientVoc,
  deleteClientVoc,
  type ClientVoc,
  type VocType,
} from "@/actions/voc-actions"

const VOC_TYPE_CONFIG = {
  complaint: { label: '불만', icon: AlertTriangle, color: 'destructive' as const },
  suggestion: { label: '개선사항', icon: Lightbulb, color: 'default' as const },
  praise: { label: '칭찬', icon: ThumbsUp, color: 'default' as const },
} as const

interface ClientVocTabProps {
  clientId: string
}

export function ClientVocTab({ clientId }: ClientVocTabProps) {
  const [vocs, setVocs] = useState<ClientVoc[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [resolveTarget, setResolveTarget] = useState<ClientVoc | null>(null)
  const [newType, setNewType] = useState<VocType>('complaint')
  const [newContent, setNewContent] = useState('')
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadVocs = async () => {
    setLoading(true)
    const result = await getClientVocs(clientId)
    if (result.success) setVocs(result.vocs ?? [])
    setLoading(false)
  }

  useEffect(() => { loadVocs() }, [clientId])

  const handleCreate = async () => {
    if (!newContent.trim()) return
    setSubmitting(true)
    const result = await createClientVoc({ client_id: clientId, type: newType, content: newContent })
    if (result.success && result.voc) {
      setVocs(prev => [result.voc!, ...prev])
      setCreateOpen(false)
      setNewContent('')
      setNewType('complaint')
    } else {
      alert(result.error || '등록에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleResolve = async () => {
    if (!resolveTarget) return
    setSubmitting(true)
    const result = await resolveClientVoc(resolveTarget.id, clientId, responseText)
    if (result.success) {
      setVocs(prev => prev.map(v => v.id === resolveTarget.id
        ? { ...v, status: 'resolved' as const, response: responseText }
        : v
      ))
      setResolveTarget(null)
      setResponseText('')
    } else {
      alert(result.error || '처리에 실패했습니다')
    }
    setSubmitting(false)
  }

  const handleDelete = async (voc: ClientVoc) => {
    if (!confirm('삭제하시겠습니까?')) return
    const result = await deleteClientVoc(voc.id, clientId)
    if (result.success) {
      setVocs(prev => prev.filter(v => v.id !== voc.id))
    }
  }

  const openCount = vocs.filter(v => v.status === 'open').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">VoC 기록</h3>
          {openCount > 0 && <Badge variant="destructive">{openCount}건 미처리</Badge>}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          새 기록
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">로딩 중...</p>}

      {!loading && vocs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 VoC 기록이 없습니다.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {vocs.map(voc => {
          const config = VOC_TYPE_CONFIG[voc.type]
          const Icon = config.icon
          return (
            <Card key={voc.id} className={voc.status === 'resolved' ? 'opacity-70' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <Badge variant={config.color}>{config.label}</Badge>
                    <Badge variant={voc.status === 'resolved' ? 'outline' : 'destructive'}>
                      {voc.status === 'resolved' ? '처리완료' : '미처리'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(voc.created_at), 'MM/dd', { locale: ko })}
                    </span>
                    {voc.status === 'open' && (
                      <Button variant="ghost" size="sm" onClick={() => { setResolveTarget(voc); setResponseText('') }}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(voc)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <p className="text-sm">{voc.content}</p>
                {voc.response && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <span className="font-medium text-xs text-muted-foreground">답변: </span>
                    {voc.response}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 새 VoC 등록 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>VoC 기록 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>유형</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as VocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">불만</SelectItem>
                  <SelectItem value="suggestion">개선사항</SelectItem>
                  <SelectItem value="praise">칭찬</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={submitting || !newContent.trim()}>
              {submitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 처리 완료 */}
      <Dialog open={!!resolveTarget} onOpenChange={(open) => { if (!open) setResolveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>처리 완료 처리</DialogTitle>
          </DialogHeader>
          <div>
            <Label>답변 (선택)</Label>
            <Textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="처리 내용 또는 답변을 입력하세요"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>취소</Button>
            <Button onClick={handleResolve} disabled={submitting}>
              {submitting ? '처리 중...' : '처리 완료'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
