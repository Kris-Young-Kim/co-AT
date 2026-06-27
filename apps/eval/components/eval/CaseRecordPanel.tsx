'use client'

import { useState, useTransition } from 'react'
import {
  createConsultationRecord,
  updateConsultationRecord,
  deleteConsultationRecord,
  type ConsultationRecord,
  createAssessmentNote,
  updateAssessmentNote,
  deleteAssessmentNote,
  type AssessmentNote,
} from '@/actions/case-record-actions'
import Link from 'next/link'
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, ClipboardList, Stethoscope, Printer, Download, Pencil, X } from 'lucide-react'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface CaseRecordPanelProps {
  clientId: string
  initialConsultationRecords: ConsultationRecord[]
  initialAssessmentNotes: AssessmentNote[]
}

type ActiveTab = 'consultation' | 'assessment'

const CONSULTATION_TYPES = ['내방', '방문', '전화', '화상', '기타'] as const

interface ConsultationDraft {
  purpose: string
  current_situation: string
  content: string
  result: string
  next_plan: string
}

const EMPTY_CONSULTATION: ConsultationDraft = {
  purpose: '',
  current_situation: '',
  content: '',
  result: '',
  next_plan: '',
}

interface AssessmentDraft {
  physical_function: string
  cognitive_function: string
  environment: string
  device_needs: string
  recommendations: string
  notes: string
}

const EMPTY_ASSESSMENT: AssessmentDraft = {
  physical_function: '',
  cognitive_function: '',
  environment: '',
  device_needs: '',
  recommendations: '',
  notes: '',
}

// ──────────────────────────────────────────────────────────────
// Field config
// ──────────────────────────────────────────────────────────────

const CONSULTATION_FIELDS: { key: keyof ConsultationDraft; label: string; placeholder: string }[] = [
  { key: 'purpose', label: '방문·상담 목적 / 주호소', placeholder: '대상자 또는 보호자가 요청한 내용을 기록합니다' },
  { key: 'current_situation', label: '현재 상황', placeholder: '대상자의 현재 상태, 기기 사용 현황, 생활 환경 등' },
  { key: 'content', label: '상담 내용', placeholder: '상담에서 논의된 내용을 요약합니다' },
  { key: 'result', label: '결과 및 조치사항', placeholder: '상담 결과, 제공한 정보, 취한 조치 등' },
  { key: 'next_plan', label: '향후 계획', placeholder: '다음 방문 일정, 추가 의뢰, 서비스 신청 계획 등' },
]

const ASSESSMENT_FIELDS: { key: keyof AssessmentDraft; label: string; placeholder: string }[] = [
  { key: 'physical_function', label: '신체기능 평가', placeholder: '운동 능력, 근력, 관절 가동 범위, 손 기능 등' },
  { key: 'cognitive_function', label: '인지기능 평가', placeholder: '이해력, 기억력, 의사소통 능력 등' },
  { key: 'environment', label: '환경 요인', placeholder: '주거 환경, 활동 공간, 보호자 지원 여부 등' },
  { key: 'device_needs', label: '보조기기 필요도', placeholder: '현재 사용 기기, 필요한 기기, 필요 이유 등' },
  { key: 'recommendations', label: '추천 사항', placeholder: '추천 품목, 서비스, 의뢰 기관 등' },
  { key: 'notes', label: '비고', placeholder: '기타 특이사항' },
]

// ──────────────────────────────────────────────────────────────
// Shared textarea field renderer
// ──────────────────────────────────────────────────────────────

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 text-sm border rounded-md px-3 py-2 min-h-[64px] resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Consultation Record Form (create)
// ──────────────────────────────────────────────────────────────

function ConsultationForm({ clientId, onSaved }: { clientId: string; onSaved: (r: ConsultationRecord) => void }) {
  const [draft, setDraft] = useState<ConsultationDraft>(EMPTY_CONSULTATION)
  const [consultationDate, setConsultationDate] = useState(() => new Date().toISOString().split('T')[0])
  const [consultationType, setConsultationType] = useState<string>('내방')
  const [consultant, setConsultant] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!draft.content && !draft.purpose) {
      setError('상담 목적 또는 상담 내용을 입력해주세요')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await createConsultationRecord({
        client_id: clientId,
        consultation_date: consultationDate,
        consultation_type: consultationType,
        consultant: consultant || null,
        purpose: draft.purpose || null,
        current_situation: draft.current_situation || null,
        content: draft.content || null,
        result: draft.result || null,
        next_plan: draft.next_plan || null,
        ai_generated: false,
      })
      if (result.success && result.record) {
        onSaved(result.record)
        setDraft(EMPTY_CONSULTATION)
        setConsultant('')
        setConsultationDate(new Date().toISOString().split('T')[0])
        setConsultationType('내방')
      } else {
        setError(result.error ?? '저장 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500">상담일</label>
          <input
            type="date"
            value={consultationDate}
            onChange={(e) => setConsultationDate(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">유형</label>
          <select
            value={consultationType}
            onChange={(e) => setConsultationType(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          >
            {CONSULTATION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">담당자</label>
          <input
            type="text"
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            placeholder="이름"
            className="block text-sm border rounded px-2 py-1 mt-0.5 w-24"
          />
        </div>
      </div>

      <div className="space-y-3">
        {CONSULTATION_FIELDS.map(({ key, label, placeholder }) => (
          <FieldTextarea
            key={key}
            label={label}
            value={draft[key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : '저장'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Assessment Note Form (create)
// ──────────────────────────────────────────────────────────────

function AssessmentForm({ clientId, onSaved }: { clientId: string; onSaved: (n: AssessmentNote) => void }) {
  const [draft, setDraft] = useState<AssessmentDraft>(EMPTY_ASSESSMENT)
  const [assessmentDate, setAssessmentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [assessor, setAssessor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!draft.physical_function && !draft.device_needs && !draft.recommendations) {
      setError('신체기능 평가, 보조기기 필요도, 또는 추천 사항을 입력해주세요')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await createAssessmentNote({
        client_id: clientId,
        assessment_date: assessmentDate,
        assessor: assessor || null,
        physical_function: draft.physical_function || null,
        cognitive_function: draft.cognitive_function || null,
        environment: draft.environment || null,
        device_needs: draft.device_needs || null,
        recommendations: draft.recommendations || null,
        notes: draft.notes || null,
        ai_generated: false,
      })
      if (result.success && result.note) {
        onSaved(result.note)
        setDraft(EMPTY_ASSESSMENT)
        setAssessor('')
        setAssessmentDate(new Date().toISOString().split('T')[0])
      } else {
        setError(result.error ?? '저장 실패')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500">평가일</label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">평가자</label>
          <input
            type="text"
            value={assessor}
            onChange={(e) => setAssessor(e.target.value)}
            placeholder="이름"
            className="block text-sm border rounded px-2 py-1 mt-0.5 w-24"
          />
        </div>
      </div>

      <div className="space-y-3">
        {ASSESSMENT_FIELDS.map(({ key, label, placeholder }) => (
          <FieldTextarea
            key={key}
            label={label}
            value={draft[key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : '저장'}
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Inline edit forms
// ──────────────────────────────────────────────────────────────

function ConsultationEditForm({
  record,
  clientId,
  onSaved,
  onCancel,
}: {
  record: ConsultationRecord
  clientId: string
  onSaved: (r: ConsultationRecord) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<ConsultationDraft>({
    purpose: record.purpose ?? '',
    current_situation: record.current_situation ?? '',
    content: record.content ?? '',
    result: record.result ?? '',
    next_plan: record.next_plan ?? '',
  })
  const [consultationDate, setConsultationDate] = useState(record.consultation_date)
  const [consultationType, setConsultationType] = useState(record.consultation_type)
  const [consultant, setConsultant] = useState(record.consultant ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    startTransition(async () => {
      setError(null)
      const result = await updateConsultationRecord(record.id, clientId, {
        consultation_date: consultationDate,
        consultation_type: consultationType,
        consultant: consultant || null,
        purpose: draft.purpose || null,
        current_situation: draft.current_situation || null,
        content: draft.content || null,
        result: draft.result || null,
        next_plan: draft.next_plan || null,
      })
      if (result.success && result.record) {
        onSaved(result.record)
      } else {
        setError(result.error ?? '수정 실패')
      }
    })
  }

  return (
    <div className="border-t px-4 py-3 space-y-4 bg-amber-50/30">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500">상담일</label>
          <input
            type="date"
            value={consultationDate}
            onChange={(e) => setConsultationDate(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">유형</label>
          <select
            value={consultationType}
            onChange={(e) => setConsultationType(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          >
            {CONSULTATION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">담당자</label>
          <input
            type="text"
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            placeholder="이름"
            className="block text-sm border rounded px-2 py-1 mt-0.5 w-24"
          />
        </div>
      </div>

      <div className="space-y-3">
        {CONSULTATION_FIELDS.map(({ key, label, placeholder }) => (
          <FieldTextarea
            key={key}
            label={label}
            value={draft[key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : '저장'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-600"
        >
          취소
        </button>
      </div>
    </div>
  )
}

function AssessmentEditForm({
  note,
  clientId,
  onSaved,
  onCancel,
}: {
  note: AssessmentNote
  clientId: string
  onSaved: (n: AssessmentNote) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<AssessmentDraft>({
    physical_function: note.physical_function ?? '',
    cognitive_function: note.cognitive_function ?? '',
    environment: note.environment ?? '',
    device_needs: note.device_needs ?? '',
    recommendations: note.recommendations ?? '',
    notes: note.notes ?? '',
  })
  const [assessmentDate, setAssessmentDate] = useState(note.assessment_date)
  const [assessor, setAssessor] = useState(note.assessor ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    startTransition(async () => {
      setError(null)
      const result = await updateAssessmentNote(note.id, clientId, {
        assessment_date: assessmentDate,
        assessor: assessor || null,
        physical_function: draft.physical_function || null,
        cognitive_function: draft.cognitive_function || null,
        environment: draft.environment || null,
        device_needs: draft.device_needs || null,
        recommendations: draft.recommendations || null,
        notes: draft.notes || null,
      })
      if (result.success && result.note) {
        onSaved(result.note)
      } else {
        setError(result.error ?? '수정 실패')
      }
    })
  }

  return (
    <div className="border-t px-4 py-3 space-y-4 bg-amber-50/30">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-500">평가일</label>
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="block text-sm border rounded px-2 py-1 mt-0.5"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">평가자</label>
          <input
            type="text"
            value={assessor}
            onChange={(e) => setAssessor(e.target.value)}
            placeholder="이름"
            className="block text-sm border rounded px-2 py-1 mt-0.5 w-24"
          />
        </div>
      </div>

      <div className="space-y-3">
        {ASSESSMENT_FIELDS.map(({ key, label, placeholder }) => (
          <FieldTextarea
            key={key}
            label={label}
            value={draft[key]}
            onChange={(v) => setDraft((prev) => ({ ...prev, [key]: v }))}
            placeholder={placeholder}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : '저장'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-600"
        >
          취소
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Main Panel
// ──────────────────────────────────────────────────────────────

export function CaseRecordPanel({ clientId, initialConsultationRecords, initialAssessmentNotes }: CaseRecordPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('consultation')
  const [consultationRecords, setConsultationRecords] = useState<ConsultationRecord[]>(initialConsultationRecords)
  const [assessmentNotes, setAssessmentNotes] = useState<AssessmentNote[]>(initialAssessmentNotes)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleDeleteConsultation = async (recordId: string) => {
    if (!confirm('이 상담기록지를 삭제하시겠습니까?')) return
    const result = await deleteConsultationRecord(recordId, clientId)
    if (result.success) {
      setConsultationRecords((prev) => prev.filter((r) => r.id !== recordId))
      if (editingId === recordId) setEditingId(null)
    }
  }

  const handleDeleteAssessment = async (noteId: string) => {
    if (!confirm('이 평가지를 삭제하시겠습니까?')) return
    const result = await deleteAssessmentNote(noteId, clientId)
    if (result.success) {
      setAssessmentNotes((prev) => prev.filter((n) => n.id !== noteId))
      if (editingId === noteId) setEditingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('consultation'); setShowForm(false); setEditingId(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === 'consultation' ? 'bg-gray-800 text-white' : 'border hover:bg-gray-50 text-gray-600'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            상담기록지
            {consultationRecords.length > 0 && (
              <span className={`text-xs ${activeTab === 'consultation' ? 'text-gray-300' : 'text-gray-400'}`}>
                ({consultationRecords.length})
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('assessment'); setShowForm(false); setEditingId(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === 'assessment' ? 'bg-gray-800 text-white' : 'border hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            평가지
            {assessmentNotes.length > 0 && (
              <span className={`text-xs ${activeTab === 'assessment' ? 'text-gray-300' : 'text-gray-400'}`}>
                ({assessmentNotes.length})
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'consultation' && consultationRecords.length > 0 && (
            <Link
              href={`/print/consultation/client/${clientId}`}
              target="_blank"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 text-gray-600"
            >
              <Download className="h-3.5 w-3.5" />
              전체 출력
            </Link>
          )}
          {activeTab === 'assessment' && assessmentNotes.length > 0 && (
            <Link
              href={`/print/case-assessment/client/${clientId}`}
              target="_blank"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 text-gray-600"
            >
              <Download className="h-3.5 w-3.5" />
              전체 출력
            </Link>
          )}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 text-gray-700"
            >
              <Plus className="h-4 w-4" />
              새 {activeTab === 'consultation' ? '상담기록지' : '평가지'}
            </button>
          )}
        </div>
      </div>

      {/* New record form */}
      {showForm && activeTab === 'consultation' && (
        <ConsultationForm
          clientId={clientId}
          onSaved={(r) => {
            setConsultationRecords((prev) => [r, ...prev])
            setShowForm(false)
          }}
        />
      )}
      {showForm && activeTab === 'assessment' && (
        <AssessmentForm
          clientId={clientId}
          onSaved={(n) => {
            setAssessmentNotes((prev) => [n, ...prev])
            setShowForm(false)
          }}
        />
      )}
      {showForm && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
        </div>
      )}

      {/* Consultation Records List */}
      {activeTab === 'consultation' && (
        consultationRecords.length === 0 && !showForm ? (
          <div className="border rounded-lg p-6 bg-white text-center text-sm text-gray-400">
            작성된 상담기록지가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {consultationRecords.map((record) => {
              const isExpanded = expandedId === record.id
              const isEditing = editingId === record.id
              return (
                <div key={record.id} className="border rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) setExpandedId(isExpanded ? null : record.id)
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{record.consultation_date}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {record.consultation_type}
                      </span>
                      {record.consultant && (
                        <span className="text-xs text-gray-500">{record.consultant}</span>
                      )}
                      <span className="text-xs text-gray-400 truncate max-w-[180px]">
                        {record.purpose?.slice(0, 40) ?? record.content?.slice(0, 40) ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isEditing) {
                            setEditingId(null)
                          } else {
                            setEditingId(record.id)
                            setExpandedId(record.id)
                          }
                        }}
                        className="p-1 text-gray-300 hover:text-blue-500 transition-colors"
                        title={isEditing ? '수정 취소' : '수정'}
                      >
                        {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </button>
                      <Link
                        href={`/print/consultation/${record.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-300 hover:text-blue-500 transition-colors"
                        title="출력 / HWP 다운로드"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConsultation(record.id) }}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isEditing && (
                    <ConsultationEditForm
                      record={record}
                      clientId={clientId}
                      onSaved={(updated) => {
                        setConsultationRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r))
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  )}

                  {isExpanded && !isEditing && (
                    <div className="border-t px-4 py-3 space-y-3 text-sm">
                      {CONSULTATION_FIELDS.map(({ key, label }) =>
                        record[key as keyof ConsultationRecord] ? (
                          <div key={key}>
                            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {String(record[key as keyof ConsultationRecord])}
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Assessment Notes List */}
      {activeTab === 'assessment' && (
        assessmentNotes.length === 0 && !showForm ? (
          <div className="border rounded-lg p-6 bg-white text-center text-sm text-gray-400">
            작성된 평가지가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {assessmentNotes.map((note) => {
              const isExpanded = expandedId === note.id
              const isEditing = editingId === note.id
              return (
                <div key={note.id} className="border rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) setExpandedId(isExpanded ? null : note.id)
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{note.assessment_date}</span>
                      {note.assessor && (
                        <span className="text-xs text-gray-500">{note.assessor}</span>
                      )}
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">
                        {note.recommendations?.slice(0, 40) ?? note.device_needs?.slice(0, 40) ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isEditing) {
                            setEditingId(null)
                          } else {
                            setEditingId(note.id)
                            setExpandedId(note.id)
                          }
                        }}
                        className="p-1 text-gray-300 hover:text-blue-500 transition-colors"
                        title={isEditing ? '수정 취소' : '수정'}
                      >
                        {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </button>
                      <Link
                        href={`/print/case-assessment/${note.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-gray-300 hover:text-blue-500 transition-colors"
                        title="출력 / HWP 다운로드"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteAssessment(note.id) }}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>

                  {isEditing && (
                    <AssessmentEditForm
                      note={note}
                      clientId={clientId}
                      onSaved={(updated) => {
                        setAssessmentNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n))
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  )}

                  {isExpanded && !isEditing && (
                    <div className="border-t px-4 py-3 space-y-3 text-sm">
                      {ASSESSMENT_FIELDS.map(({ key, label }) =>
                        note[key as keyof AssessmentNote] ? (
                          <div key={key}>
                            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {String(note[key as keyof AssessmentNote])}
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
