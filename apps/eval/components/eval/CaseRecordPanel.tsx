'use client'

import { useState } from 'react'
import {
  createConsultationRecord,
  deleteConsultationRecord,
  type ConsultationRecord,
  createAssessmentNote,
  deleteAssessmentNote,
  type AssessmentNote,
} from '@/actions/case-record-actions'
import { generateConsultationDraft } from '@/actions/ai-actions'
import { Sparkles, Plus, Trash2, Loader2, ChevronDown, ChevronUp, ClipboardList, Stethoscope } from 'lucide-react'

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
// Consultation Record Form
// ──────────────────────────────────────────────────────────────

const CONSULTATION_FIELDS: { key: keyof ConsultationDraft; label: string; placeholder: string }[] = [
  { key: 'purpose', label: '방문·상담 목적 / 주호소', placeholder: '대상자 또는 보호자가 요청한 내용을 기록합니다' },
  { key: 'current_situation', label: '현재 상황', placeholder: '대상자의 현재 상태, 기기 사용 현황, 생활 환경 등' },
  { key: 'content', label: '상담 내용', placeholder: '상담에서 논의된 내용을 요약합니다' },
  { key: 'result', label: '결과 및 조치사항', placeholder: '상담 결과, 제공한 정보, 취한 조치 등' },
  { key: 'next_plan', label: '향후 계획', placeholder: '다음 방문 일정, 추가 의뢰, 서비스 신청 계획 등' },
]

function ConsultationForm({ clientId, onSaved }: { clientId: string; onSaved: (r: ConsultationRecord) => void }) {
  const [draft, setDraft] = useState<ConsultationDraft>(EMPTY_CONSULTATION)
  const [consultationDate, setConsultationDate] = useState(() => new Date().toISOString().split('T')[0])
  const [consultationType, setConsultationType] = useState<string>('내방')
  const [consultant, setConsultant] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateDraft = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateConsultationDraft({ clientId, memo: memo || undefined })
      if (result.success && result.draft) {
        setDraft({
          purpose: result.draft.purpose ?? '',
          current_situation: result.draft.current_situation ?? '',
          content: result.draft.content ?? '',
          result: result.draft.result ?? '',
          next_plan: result.draft.next_plan ?? '',
        })
      } else {
        setError(result.error ?? 'AI 초안 생성 실패')
      }
    } finally {
      setLoading(false)
    }
  }

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
        ai_generated: !!(draft.purpose || draft.content),
      })
      if (result.success && result.record) {
        onSaved(result.record)
        setDraft(EMPTY_CONSULTATION)
        setMemo('')
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

      <div>
        <label className="text-xs text-gray-500">직원 메모 (AI 초안 생성에 활용)</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="오늘 상담 내용, 대상자 상황 등 자유롭게 메모"
          className="w-full mt-1 text-sm border rounded-md px-3 py-2 min-h-[52px] resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={handleGenerateDraft}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 border text-sm rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
        AI 초안 생성
      </button>

      <div className="space-y-3">
        {CONSULTATION_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600">{label}</label>
            <textarea
              value={draft[key]}
              onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full mt-1 text-sm border rounded-md px-3 py-2 min-h-[64px] resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
// Assessment Note Form
// ──────────────────────────────────────────────────────────────

const ASSESSMENT_FIELDS: { key: keyof AssessmentDraft; label: string; placeholder: string }[] = [
  { key: 'physical_function', label: '신체기능 평가', placeholder: '운동 능력, 근력, 관절 가동 범위, 손 기능 등' },
  { key: 'cognitive_function', label: '인지기능 평가', placeholder: '이해력, 기억력, 의사소통 능력 등' },
  { key: 'environment', label: '환경 요인', placeholder: '주거 환경, 활동 공간, 보호자 지원 여부 등' },
  { key: 'device_needs', label: '보조기기 필요도', placeholder: '현재 사용 기기, 필요한 기기, 필요 이유 등' },
  { key: 'recommendations', label: '추천 사항', placeholder: '추천 품목, 서비스, 의뢰 기관 등' },
  { key: 'notes', label: '비고', placeholder: '기타 특이사항' },
]

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
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600">{label}</label>
            <textarea
              value={draft[key]}
              onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full mt-1 text-sm border rounded-md px-3 py-2 min-h-[64px] resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
// Main Panel
// ──────────────────────────────────────────────────────────────

export function CaseRecordPanel({ clientId, initialConsultationRecords, initialAssessmentNotes }: CaseRecordPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('consultation')
  const [consultationRecords, setConsultationRecords] = useState<ConsultationRecord[]>(initialConsultationRecords)
  const [assessmentNotes, setAssessmentNotes] = useState<AssessmentNote[]>(initialAssessmentNotes)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDeleteConsultation = async (recordId: string) => {
    if (!confirm('이 상담기록지를 삭제하시겠습니까?')) return
    const result = await deleteConsultationRecord(recordId, clientId)
    if (result.success) {
      setConsultationRecords((prev) => prev.filter((r) => r.id !== recordId))
    }
  }

  const handleDeleteAssessment = async (noteId: string) => {
    if (!confirm('이 평가지를 삭제하시겠습니까?')) return
    const result = await deleteAssessmentNote(noteId, clientId)
    if (result.success) {
      setAssessmentNotes((prev) => prev.filter((n) => n.id !== noteId))
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('consultation'); setShowForm(false) }}
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
            onClick={() => { setActiveTab('assessment'); setShowForm(false) }}
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

      {/* Form */}
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
              return (
                <div key={record.id} className="border rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
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
                      {record.ai_generated && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                      )}
                      <span className="text-xs text-gray-400 truncate max-w-[180px]">
                        {record.purpose?.slice(0, 40) ?? record.content?.slice(0, 40) ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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

                  {isExpanded && (
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
              return (
                <div key={note.id} className="border rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : note.id)}
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
                    <div className="flex items-center gap-2">
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

                  {isExpanded && (
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
