"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormBuilder } from "@/components/features/intake/FormBuilder"
import { FormTemplateManager } from "@/components/features/intake/FormTemplateManager"
import { createDomainAssessment, getDomainAssessments } from "@/actions/assessment-actions"
import { Loader2, Save, Settings, FileText, BarChart3, Download } from "lucide-react"
import type { FormTemplate, FormData } from "@/lib/types/form-builder.types"
import {
  assessmentTemplates,
  assessmentDomainNames,
  type AssessmentDomainType,
} from "@/lib/templates/assessment-templates"
import { AssessmentResultVisualization } from "./AssessmentResultVisualization"

interface DomainAssessmentFormV2Props {
  clientId: string
  applicationId?: string
  onSuccess?: () => void
}

export function DomainAssessmentFormV2({
  clientId,
  applicationId,
  onSuccess,
}: DomainAssessmentFormV2Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<AssessmentDomainType>("WC")
  const [template, setTemplate] = useState<FormTemplate>(assessmentTemplates.WC)
  const [formData, setFormData] = useState<FormData>({})
  const [activeTab, setActiveTab] = useState<"form" | "builder" | "templates" | "results">("form")
  const [savedAssessments, setSavedAssessments] = useState<any[]>([])

  // 도메인 변경 시 템플릿 업데이트
  useEffect(() => {
    const newTemplate = assessmentTemplates[selectedDomain]
    setTemplate(newTemplate)
    
    // 로컬 스토리지에서 저장된 템플릿 확인
    const savedTemplateKey = `assessment-${selectedDomain}-template`
    const savedTemplate = localStorage.getItem(savedTemplateKey)
    if (savedTemplate) {
      try {
        const parsed = JSON.parse(savedTemplate)
        setTemplate(parsed)
      } catch (e) {
        console.error("템플릿 불러오기 실패:", e)
      }
    }

    // 폼 데이터 초기화
    const today = new Date().toISOString().split("T")[0]
    setFormData({
      evaluation_date: today,
    })
  }, [selectedDomain])

  // 템플릿 변경 시 로컬 스토리지에 저장
  const handleTemplateChange = (newTemplate: FormTemplate) => {
    setTemplate(newTemplate)
    const savedTemplateKey = `assessment-${selectedDomain}-template`
    localStorage.setItem(savedTemplateKey, JSON.stringify(newTemplate))
    alert("양식 템플릿이 저장되었습니다.")
  }

  // 저장된 평가 결과 불러오기
  useEffect(() => {
    const loadAssessments = async () => {
      if (applicationId) {
        const result = await getDomainAssessments(applicationId)
        if (result.success && result.assessments) {
          // 데이터베이스에서 불러온 평가 결과를 폼 데이터 형식으로 변환
          const formatted = result.assessments.map((assessment) => ({
            id: assessment.id,
            domain_type: assessment.domain_type,
            evaluation_date: assessment.evaluation_date,
            data: {
              ...assessment.evaluation_data,
              evaluator_opinion: assessment.evaluator_opinion,
              recommended_device: assessment.recommended_device,
              future_plan: assessment.future_plan,
              ...assessment.measurements,
            },
          }))
          setSavedAssessments(formatted)
        }
      } else {
        // applicationId가 없으면 로컬 스토리지에서 불러오기
        const saved = localStorage.getItem(`assessments-${clientId}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setSavedAssessments(parsed)
          } catch (e) {
            console.error("평가 결과 불러오기 실패:", e)
          }
        }
      }
    }
    loadAssessments()
  }, [clientId, applicationId])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // 필수 필드 검증
      const requiredFields = template.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.required && !formData[f.name])
      
      if (requiredFields.length > 0) {
        setError(
          `다음 필수 항목을 입력해주세요: ${requiredFields.map((f) => f.label).join(", ")}`
        )
        setIsSubmitting(false)
        return
      }

      // measurements 추출 (신체 치수 관련 필드)
      const measurements: Record<string, number> = {}
      const measurementFields = [
        "shoulder_width",
        "hip_width",
        "seat_depth",
        "seat_height",
        "back_height",
        "leg_length",
      ]
      
      measurementFields.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== null) {
          measurements[field] = Number(formData[field])
        }
      })

      // evaluation_data 추출 (평가 데이터)
      const evaluationData: Record<string, any> = {}
      Object.keys(formData).forEach((key) => {
        if (!measurementFields.includes(key) && key !== "evaluation_date" && key !== "evaluator_name") {
          evaluationData[key] = formData[key]
        }
      })

      const result = await createDomainAssessment({
        application_id: applicationId || "",
        domain_type: selectedDomain,
        evaluation_date: String(formData.evaluation_date || new Date().toISOString().split("T")[0]),
        evaluation_data: Object.keys(evaluationData).length > 0 ? evaluationData : null,
        measurements: Object.keys(measurements).length > 0 ? measurements : null,
        evaluator_opinion: String(formData.evaluator_opinion || ""),
        recommended_device: String(formData.recommended_device || ""),
        future_plan: String(formData.future_plan || ""),
      })

      if (result.success) {
        alert("평가 결과가 성공적으로 저장되었습니다.")
        
        // 평가 결과 목록 새로고침
        if (applicationId) {
          const refreshResult = await getDomainAssessments(applicationId)
          if (refreshResult.success && refreshResult.assessments) {
            const formatted = refreshResult.assessments.map((assessment) => ({
              id: assessment.id,
              domain_type: assessment.domain_type,
              evaluation_date: assessment.evaluation_date,
              data: {
                ...assessment.evaluation_data,
                evaluator_opinion: assessment.evaluator_opinion,
                recommended_device: assessment.recommended_device,
                future_plan: assessment.future_plan,
                ...assessment.measurements,
              },
            }))
            setSavedAssessments(formatted)
          }
        } else {
          // 로컬 스토리지에 저장
          const saved = [...savedAssessments, {
            id: result.assessmentId,
            domain_type: selectedDomain,
            evaluation_date: formData.evaluation_date,
            data: formData,
          }]
          localStorage.setItem(`assessments-${clientId}`, JSON.stringify(saved))
          setSavedAssessments(saved)
        }
        
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || "평가 결과 저장에 실패했습니다")
        alert(result.error || "평가 결과 저장에 실패했습니다.")
      }
    } catch (err) {
      console.error("평가 결과 저장 오류:", err)
      setError("예상치 못한 오류가 발생했습니다")
      alert("예상치 못한 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              보조기기 서비스 평가지 (첨부 21)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              동적 양식 시스템 - 영역별 평가를 수행하고 결과를 시각화하세요
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* 평가 영역 선택 */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">평가 영역 선택</label>
          <Select
            value={selectedDomain}
            onValueChange={(value: AssessmentDomainType) => setSelectedDomain(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(assessmentDomainNames).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {key}: {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="form">
              <FileText className="mr-2 h-4 w-4" />
              평가 작성
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Settings className="mr-2 h-4 w-4" />
              양식 편집
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="mr-2 h-4 w-4" />
              템플릿 관리
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 className="mr-2 h-4 w-4" />
              평가 결과
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="rounded-lg border bg-primary/5 p-4 mb-4">
              <h3 className="font-semibold mb-2">
                {assessmentDomainNames[selectedDomain]} 평가
              </h3>
              <p className="text-sm text-muted-foreground">
                {template.description || "평가 항목을 입력하세요"}
              </p>
            </div>

            <FormBuilder
              template={template}
              formData={formData}
              onDataChange={setFormData}
              readOnly={false}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    평가 저장
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-4 mb-4">
              <h3 className="font-semibold mb-2">양식 편집 모드</h3>
              <p className="text-sm text-muted-foreground">
                필드를 드래그하여 재배치하고, 필드를 추가/수정/삭제할 수 있습니다.
                변경사항은 자동으로 저장됩니다.
              </p>
            </div>
            <FormBuilder
              template={template}
              formData={formData}
              onDataChange={setFormData}
              onTemplateChange={handleTemplateChange}
              readOnly={false}
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <FormTemplateManager
              currentTemplate={template}
              onTemplateLoad={(loadedTemplate) => {
                setTemplate(loadedTemplate)
                setActiveTab("form")
                alert("양식 템플릿이 불러와졌습니다.")
              }}
              onTemplateSave={handleTemplateChange}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <AssessmentResultVisualization
              assessments={savedAssessments}
              clientId={clientId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
