"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProcessLog } from "@/actions/process-actions"
import { Loader2, ClipboardList } from "lucide-react"
import { format } from "date-fns"

interface ProcessLogFormProps {
  clientId: string
  applicationId?: string
  onSuccess?: () => void
}

export function ProcessLogForm({
  clientId,
  applicationId,
  onSuccess,
}: ProcessLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    log_date: format(new Date(), "yyyy-MM-dd"),
    staff_name: "",
    service_area: "",
    // 지원 구분
    funding_source: "",
    funding_detail: "",
    // 과정 선택
    process_step: [] as string[],
    // 품목명
    item_name: "",
    // 내용
    content: "",
    // 비고
    remarks: "",
  })

  const processStepOptions = [
    "상담·평가",
    "시험적용",
    "정보제공",
    "대여",
    "교육훈련",
    "개조제작",
    "재원확보",
    "유지관리",
    "종결",
    "사후관리",
    "사례회의",
  ]

  const fundingSourceOptions = [
    { value: "public", label: "공적급여" },
    { value: "assistive_device", label: "보조기기교부사업" },
    { value: "medical_device_insurance", label: "보장구 (의료급여,건강보험)" },
    { value: "welfare_device", label: "복지용구" },
    { value: "employment_agency", label: "장애인고용공단 (보조공학기기)" },
    { value: "ict_assistive", label: "정보통신보조기기" },
    { value: "industrial_accident", label: "산재" },
    { value: "prosthesis", label: "보철구" },
    { value: "other_public", label: "그 외" },
    { value: "private", label: "민간급여" },
    { value: "center", label: "센터지원" },
    { value: "other", label: "기타" },
  ]

  const handleProcessStepToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      process_step: prev.process_step.includes(value)
        ? prev.process_step.filter((item) => item !== value)
        : [...prev.process_step, value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createProcessLog({
        application_id: applicationId || "",
        client_id: clientId,
        log_date: formData.log_date,
        service_area: formData.service_area,
        funding_source: formData.funding_source,
        funding_detail: formData.funding_detail,
        process_step: formData.process_step.join(", "),
        item_name: formData.item_name,
        content: formData.content,
        remarks: formData.remarks,
      })

      if (result.success) {
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || "서비스 진행 기록 저장에 실패했습니다")
      }
    } catch (err) {
      console.error("서비스 진행 기록 저장 오류:", err)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="text-2xl flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          서비스 진행 기록지 (첨부 20)
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          서비스 진행 내용을 상세히 기록하세요
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 담당자명 및 서비스 영역 */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="staff_name">담당자명</Label>
              <Input
                id="staff_name"
                value={formData.staff_name}
                onChange={(e) =>
                  setFormData({ ...formData, staff_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_area">서비스 영역</Label>
              <Input
                id="service_area"
                value={formData.service_area}
                onChange={(e) =>
                  setFormData({ ...formData, service_area: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log_date">최초상담일</Label>
              <Input
                id="log_date"
                type="date"
                value={formData.log_date}
                onChange={(e) =>
                  setFormData({ ...formData, log_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* 지원 구분 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">지원 구분</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="funding_source">지원 구분</Label>
                <Select
                  value={formData.funding_source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, funding_source: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="funding_detail">지원처/사업명</Label>
                <Input
                  id="funding_detail"
                  value={formData.funding_detail}
                  onChange={(e) =>
                    setFormData({ ...formData, funding_detail: e.target.value })
                  }
                  placeholder="민간급여 사업명 또는 센터지원 등"
                />
              </div>
            </div>
          </div>

          {/* 과정 선택 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">과정</h3>
            <div className="grid gap-2 md:grid-cols-4">
              {processStepOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`process_${option}`}
                    checked={formData.process_step.includes(option)}
                    onCheckedChange={() => handleProcessStepToggle(option)}
                  />
                  <Label htmlFor={`process_${option}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 품목명 및 내용 */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item_name">품목명</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData({ ...formData, item_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
                placeholder="서비스 진행 내용을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">비고</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                rows={3}
                placeholder="추가 사항을 입력하세요"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

