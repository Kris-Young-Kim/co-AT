"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"
import type { ExhibitionSchedule, EducationSchedule } from "@/actions/program-actions"
import { updateExhibitionRecord, updateEducationRecord } from "@/actions/program-actions"

interface Props {
  year: number
  exhibitions: ExhibitionSchedule[]
  educations: EducationSchedule[]
}

const ORG_TYPE_LABELS: Record<string, string> = {
  government: '정부 및 공공기관',
  education:  '교육 관련 기관',
  welfare:    '복지 및 비영리 기관',
  medical:    '의료 관련 기관',
  individual: '개인(당사자등)',
  other:      '기타',
}

const AUDIENCE_TYPE_LABELS: Record<string, string> = {
  at_welfare:  '보조기기 및 복지 관련 담당자',
  edu_student: '교육기관 학생 및 종사자',
  guardian:    '보호자 및 주 지원자',
  government:  '정부 및 공공기관 등',
  other:       '기타 유관분야',
}

// ── Exhibition edit dialog ─────────────────────────────────────────────────
function ExhibitionEditDialog({
  record,
  onClose,
}: {
  record: ExhibitionSchedule
  onClose: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    participant_count: record.participant_count ?? '',
    reception_method:  record.reception_method  ?? '',
    visitor_org_name:  record.visitor_org_name  ?? '',
    visitor_org_type:  record.visitor_org_type  ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateExhibitionRecord(record.id, {
      participant_count: form.participant_count !== '' ? Number(form.participant_count) : null,
      reception_method:  form.reception_method  || null,
      visitor_org_name:  form.visitor_org_name  || null,
      visitor_org_type:  form.visitor_org_type  || null,
    })
    setSaving(false)
    if (result.success) { router.refresh(); onClose() }
    else alert(result.error)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>견학 실적 입력 — {record.scheduled_date}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>참가 인원 (명)</Label>
            <Input type="number" min={0} value={form.participant_count}
              onChange={e => setForm(f => ({ ...f, participant_count: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>접수 방법</Label>
            <Input placeholder="공문, 방문, 전화 등" value={form.reception_method}
              onChange={e => setForm(f => ({ ...f, reception_method: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>방문 기관명</Label>
          <Input placeholder="기관명 입력" value={form.visitor_org_name}
            onChange={e => setForm(f => ({ ...f, visitor_org_name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>기관 유형</Label>
          <Select value={form.visitor_org_type} onValueChange={v => setForm(f => ({ ...f, visitor_org_type: v }))}>
            <SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ORG_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>취소</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Education edit dialog ──────────────────────────────────────────────────
function EducationEditDialog({
  record,
  onClose,
}: {
  record: EducationSchedule
  onClose: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    education_title:         record.education_title         ?? '',
    education_hours:         record.education_hours         ?? '',
    education_type:          record.education_type          ?? '',
    participant_count:       record.participant_count        ?? '',
    education_audience_type: record.education_audience_type ?? '',
    education_audience_label:record.education_audience_label ?? '',
    notes:                   record.notes                   ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateEducationRecord(record.id, {
      education_title:          form.education_title          || null,
      education_hours:          form.education_hours !== '' ? Number(form.education_hours) : null,
      education_type:           form.education_type           || null,
      participant_count:        form.participant_count !== '' ? Number(form.participant_count) : null,
      education_audience_type:  form.education_audience_type  || null,
      education_audience_label: form.education_audience_label || null,
      notes:                    form.notes                    || null,
    })
    setSaving(false)
    if (result.success) { router.refresh(); onClose() }
    else alert(result.error)
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>교육 실적 입력 — {record.scheduled_date}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label>교육명</Label>
          <Input placeholder="교육 프로그램명" value={form.education_title}
            onChange={e => setForm(f => ({ ...f, education_title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>시간</Label>
            <Input type="number" min={0} value={form.education_hours}
              onChange={e => setForm(f => ({ ...f, education_hours: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>인원 (명)</Label>
            <Input type="number" min={0} value={form.participant_count}
              onChange={e => setForm(f => ({ ...f, participant_count: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>구분</Label>
            <Select value={form.education_type} onValueChange={v => setForm(f => ({ ...f, education_type: v }))}>
              <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="교육요청">교육요청</SelectItem>
                <SelectItem value="교육주최">교육주최</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>주 교육 대상자 유형</Label>
            <Select value={form.education_audience_type}
              onValueChange={v => setForm(f => ({ ...f, education_audience_type: v }))}>
              <SelectTrigger><SelectValue placeholder="유형 선택" /></SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIENCE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>대상자 설명</Label>
            <Input placeholder="예: 장애인활동지원사" value={form.education_audience_label}
              onChange={e => setForm(f => ({ ...f, education_audience_label: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>비고 (세부 추진 내용)</Label>
          <Textarea rows={3} placeholder="○주요내용: ..." value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>취소</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ── Main list ──────────────────────────────────────────────────────────────
export function ProgramRecordList({ year, exhibitions, educations }: Props) {
  const [tab, setTab]                         = useState<'exhibition' | 'education'>('exhibition')
  const [editingExhibition, setEditingExhibition] = useState<ExhibitionSchedule | null>(null)
  const [editingEducation, setEditingEducation]   = useState<EducationSchedule | null>(null)

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('exhibition')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'exhibition' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          체험프로그램(견학)
          <span className="ml-2 text-xs opacity-80">({exhibitions.length}건)</span>
        </button>
        <button
          onClick={() => setTab('education')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'education' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          교육
          <span className="ml-2 text-xs opacity-80">({educations.length}건)</span>
        </button>
      </div>

      {/* Exhibition tab */}
      {tab === 'exhibition' && (
        exhibitions.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            {year}년 견학 일정이 없습니다. admin에서 schedule_type=exhibition으로 등록해주세요.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs">
                <tr>
                  <th className="px-4 py-2 text-left w-24">일정</th>
                  <th className="px-4 py-2 text-left">기관명</th>
                  <th className="px-4 py-2 text-left w-32">기관유형</th>
                  <th className="px-4 py-2 text-center w-16">인원</th>
                  <th className="px-4 py-2 text-left w-24">접수방법</th>
                  <th className="px-4 py-2 text-center w-16">입력상태</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exhibitions.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{rec.scheduled_date}</td>
                    <td className="px-4 py-2">{rec.visitor_org_name ?? <span className="text-gray-400">미입력</span>}</td>
                    <td className="px-4 py-2">
                      {rec.visitor_org_type
                        ? <Badge variant="outline" className="text-xs">{ORG_TYPE_LABELS[rec.visitor_org_type] ?? rec.visitor_org_type}</Badge>
                        : <span className="text-gray-400 text-xs">미입력</span>}
                    </td>
                    <td className="px-4 py-2 text-center">{rec.participant_count ?? <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-2">{rec.reception_method ?? <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-2 text-center">
                      {rec.visitor_org_name
                        ? <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">완료</Badge>
                        : <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">미완료</Badge>}
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingExhibition(rec)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Education tab */}
      {tab === 'education' && (
        educations.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            {year}년 교육 일정이 없습니다. admin에서 schedule_type=education으로 등록해주세요.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs">
                <tr>
                  <th className="px-4 py-2 text-left w-24">일정</th>
                  <th className="px-4 py-2 text-left">교육명</th>
                  <th className="px-4 py-2 text-center w-16">시간</th>
                  <th className="px-4 py-2 text-center w-16">인원</th>
                  <th className="px-4 py-2 text-left w-24">구분</th>
                  <th className="px-4 py-2 text-left">대상자</th>
                  <th className="px-4 py-2 text-center w-16">입력상태</th>
                  <th className="px-4 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {educations.map(rec => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">{rec.scheduled_date}</td>
                    <td className="px-4 py-2 font-medium">{rec.education_title ?? <span className="text-gray-400">미입력</span>}</td>
                    <td className="px-4 py-2 text-center">{rec.education_hours != null ? `${rec.education_hours}h` : <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-2 text-center">{rec.participant_count ?? <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-2">{rec.education_type ?? <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-2 text-xs">
                      {rec.education_audience_type
                        ? <span>{AUDIENCE_TYPE_LABELS[rec.education_audience_type] ?? rec.education_audience_type}{rec.education_audience_label ? ` (${rec.education_audience_label})` : ''}</span>
                        : <span className="text-gray-400">미입력</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {rec.education_title
                        ? <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">완료</Badge>
                        : <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">미완료</Badge>}
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingEducation(rec)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Edit dialogs */}
      <Dialog open={!!editingExhibition} onOpenChange={open => { if (!open) setEditingExhibition(null) }}>
        {editingExhibition && (
          <ExhibitionEditDialog record={editingExhibition} onClose={() => setEditingExhibition(null)} />
        )}
      </Dialog>

      <Dialog open={!!editingEducation} onOpenChange={open => { if (!open) setEditingEducation(null) }}>
        {editingEducation && (
          <EducationEditDialog record={editingEducation} onClose={() => setEditingEducation(null)} />
        )}
      </Dialog>
    </div>
  )
}
