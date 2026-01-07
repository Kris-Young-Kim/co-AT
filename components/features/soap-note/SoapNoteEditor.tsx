"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SoapAudioRecorder } from "./SoapAudioRecorder"
import { AiGenerateButton } from "./AiGenerateButton"
import { type SoapNote } from "@/actions/ai-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface SoapNoteEditorProps {
  initialNote?: Partial<SoapNote>
  onNoteChange?: (note: SoapNote) => void
  readOnly?: boolean
}

/**
 * SOAP 노트 에디터 컴포넌트
 * S (Subjective), O (Objective), A (Assessment), P (Plan) 섹션 편집
 */
export function SoapNoteEditor({
  initialNote,
  onNoteChange,
  readOnly = false,
}: SoapNoteEditorProps) {
  const [note, setNote] = useState<SoapNote>({
    subjective: initialNote?.subjective || "",
    objective: initialNote?.objective || "",
    assessment: initialNote?.assessment || "",
    plan: initialNote?.plan || "",
  })

  const [rawText, setRawText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 노트 변경 시 부모 컴포넌트에 알림
  const handleNoteChange = (field: keyof SoapNote, value: string) => {
    const updatedNote = { ...note, [field]: value }
    setNote(updatedNote)
    if (onNoteChange) {
      onNoteChange(updatedNote)
    }
  }

  // AI 생성 완료 시 노트 업데이트
  const handleGenerated = (generatedNote: SoapNote) => {
    console.log("[SoapNoteEditor] AI 생성된 SOAP 노트 수신:", generatedNote)
    setNote(generatedNote)
    setIsGenerating(false)
    setError(null)
    if (onNoteChange) {
      onNoteChange(generatedNote)
    }
  }

  // AI 생성 오류 처리
  const handleError = (errorMessage: string) => {
    console.error("[SoapNoteEditor] AI 생성 오류:", errorMessage)
    setError(errorMessage)
    setIsGenerating(false)
  }

  // 음성 인식 텍스트 추가
  const handleTranscript = (text: string) => {
    setRawText((prev) => prev + (prev ? " " : "") + text)
  }

  // 로딩 상태 업데이트
  const handleGeneratingChange = (generating: boolean) => {
    setIsGenerating(generating)
  }

  return (
    <div className="space-y-6">
      {/* 원본 텍스트 입력 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>상담 내용 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="raw-text">상담 내용 (AI 생성용)</Label>
              <SoapAudioRecorder
                onTranscript={handleTranscript}
                onRecordingChange={handleGeneratingChange}
              />
            </div>
            <Textarea
              id="raw-text"
              placeholder="상담 내용을 입력하거나 음성으로 녹음하세요..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              disabled={readOnly}
            />
          </div>
          <div className="flex justify-end">
            <AiGenerateButton
              text={rawText}
              onGenerated={handleGenerated}
              onError={handleError}
              disabled={readOnly || isGenerating}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* SOAP 노트 편집 영역 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* S (Subjective) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">S (Subjective)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="subjective">주관적 정보</Label>
              <Textarea
                id="subjective"
                placeholder="내담자가 말한 주관적 정보, 불편사항, 요구사항을 입력하세요..."
                value={note.subjective}
                onChange={(e) => handleNoteChange("subjective", e.target.value)}
                rows={8}
                disabled={readOnly}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* O (Objective) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">O (Objective)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="objective">객관적 정보</Label>
              <Textarea
                id="objective"
                placeholder="관찰 가능한 객관적 정보, 신체 기능, 환경을 입력하세요..."
                value={note.objective}
                onChange={(e) => handleNoteChange("objective", e.target.value)}
                rows={8}
                disabled={readOnly}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* A (Assessment) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">A (Assessment)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="assessment">평가</Label>
              <Textarea
                id="assessment"
                placeholder="전문가의 평가 및 분석을 입력하세요..."
                value={note.assessment}
                onChange={(e) => handleNoteChange("assessment", e.target.value)}
                rows={8}
                disabled={readOnly}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* P (Plan) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">P (Plan)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="plan">계획</Label>
              <Textarea
                id="plan"
                placeholder="향후 계획 및 조치사항을 입력하세요..."
                value={note.plan}
                onChange={(e) => handleNoteChange("plan", e.target.value)}
                rows={8}
                disabled={readOnly}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 로딩 중 스켈레톤 (Streaming UI) */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
