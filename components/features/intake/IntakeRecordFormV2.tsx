"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormBuilder } from "./FormBuilder"
import { FormTemplateManager } from "./FormTemplateManager"
import { createIntakeRecord } from "@/actions/intake-actions"
import { getClientById } from "@/actions/client-actions"
import { Loader2, Save, Settings, FileText } from "lucide-react"
import type { FormTemplate, FormData } from "@/lib/types/form-builder.types"
import { defaultIntakeTemplate } from "@/lib/templates/default-intake-template"
// import { useToast } from "@/hooks/use-toast" // TODO: toast 시스템 추가

interface IntakeRecordFormV2Props {
  clientId: string
  applicationId?: string
  onSuccess?: () => void
}

export function IntakeRecordFormV2({
  clientId,
  applicationId,
  onSuccess,
}: IntakeRecordFormV2Props) {
  // const { toast } = useToast() // TODO: toast 시스템 추가
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<FormTemplate>(defaultIntakeTemplate)
  const [formData, setFormData] = useState<FormData>({})
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"form" | "builder" | "templates">("form")

  // 클라이언트 정보 로드
  useEffect(() => {
    const loadClientInfo = async () => {
      const result = await getClientById(clientId)
      if (result.success && result.client) {
        const client = result.client
        setClientInfo(client)
        
        // 클라이언트 정보를 폼 데이터에 자동 입력
        const today = new Date().toISOString().split("T")[0]
        setFormData({
          consult_date: today,
          name: client.name || "",
          birth_gender: client.birth_date
            ? `${client.birth_date} / ${client.gender || ""}`
            : "",
          contact: client.contact || "",
          guardian_contact: client.guardian_contact || "",
          address: client.address || "",
          housing_type: client.housing_type || "",
          has_elevator: client.has_elevator || false,
          obstacles: client.obstacles || "",
          economic_status: client.economic_status || "",
          disability_type: client.disability_type || "",
          disability_cause: client.disability_cause || "",
          disability_onset_date: client.disability_onset_date || "",
        })
      }
    }
    loadClientInfo()
  }, [clientId])

  // 로컬 스토리지에서 템플릿 불러오기
  useEffect(() => {
    const savedTemplate = localStorage.getItem("intake-form-template")
    if (savedTemplate) {
      try {
        const parsed = JSON.parse(savedTemplate)
        setTemplate(parsed)
      } catch (e) {
        console.error("템플릿 불러오기 실패:", e)
      }
    }
  }, [])

  // 템플릿 변경 시 로컬 스토리지에 저장
  const handleTemplateChange = (newTemplate: FormTemplate) => {
    setTemplate(newTemplate)
    localStorage.setItem("intake-form-template", JSON.stringify(newTemplate))
    alert("양식 템플릿이 저장되었습니다.")
  }

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

      // body_function_data 변환
      const bodyFunctionData = formData.body_limitations
        ? {
            limitations: Array.isArray(formData.body_limitations)
              ? formData.body_limitations
              : [formData.body_limitations],
          }
        : null

      // cognitive_sensory_check 변환
      const cognitiveSensoryCheck = formData.cognitive_sensory
        ? Array.isArray(formData.cognitive_sensory)
          ? formData.cognitive_sensory
          : [formData.cognitive_sensory]
        : []

      // current_devices 파싱 (텍스트를 JSON으로 변환)
      let currentDevices: any[] = []
      if (formData.current_devices_text) {
        const deviceText = String(formData.current_devices_text)
        // 간단한 파싱 로직 (향후 개선 가능)
        const lines = deviceText.split("\n").filter((line) => line.trim())
        currentDevices = lines.map((line) => {
          const parts = line.split(",").map((p) => p.trim())
          return {
            name: parts[0] || "",
            in_use: parts[1]?.includes("활용") || false,
            source: parts[2] || "",
            year: parts[3] || "",
          }
        })
      }

      const result = await createIntakeRecord({
        application_id: applicationId || "",
        client_id: clientId,
        consult_date: String(formData.consult_date || new Date().toISOString().split("T")[0]),
        body_function_data: bodyFunctionData,
        cognitive_sensory_check: cognitiveSensoryCheck,
        current_devices: currentDevices.length > 0 ? currentDevices : undefined,
        consultation_content: String(formData.consultation_content || ""),
        main_activity_place: String(formData.main_activity_place || ""),
        activity_posture: String(formData.activity_posture || ""),
        main_supporter: String(formData.main_supporter || ""),
        environment_limitations: String(formData.environment_limitations || ""),
      })

      if (result.success) {
        alert("상담 기록이 성공적으로 저장되었습니다.")
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || "상담 기록 저장에 실패했습니다")
        alert(result.error || "상담 기록 저장에 실패했습니다.")
      }
    } catch (err) {
      console.error("상담 기록 저장 오류:", err)
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
              <FileText className="h-5 w-5 text-primary" />
              상담 기록지 (첨부 19)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              동적 양식 시스템 - 필요에 따라 자유롭게 수정하세요
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="form">
              <FileText className="mr-2 h-4 w-4" />
              양식 작성
            </TabsTrigger>
            <TabsTrigger value="builder">
              <Settings className="mr-2 h-4 w-4" />
              양식 편집
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="mr-2 h-4 w-4" />
              템플릿 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

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
                    저장
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
