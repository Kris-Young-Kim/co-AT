"use client"

import { useState, useEffect } from "react"
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
import { createIntakeRecord } from "@/actions/intake-actions"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

interface IntakeRecordFormProps {
  clientId: string
  applicationId?: string
  onSuccess?: () => void
}

export function IntakeRecordForm({
  clientId,
  applicationId,
  onSuccess,
}: IntakeRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    consult_date: format(new Date(), "yyyy-MM-dd"),
    consultant_id: "",
    // 대상자 정보 (읽기 전용)
    name: "",
    birth_date: "",
    gender: "",
    contact: "",
    guardian_contact: "",
    address: "",
    // 주거형태
    housing_type: "",
    housing_floor: "",
    has_elevator: false,
    obstacles: "",
    // 경제상황
    economic_status: "",
    // 연계가능재원 (복수 선택)
    funding_sources: [] as string[],
    // 장애정보
    disability_type: "",
    disability_grade: "",
    disability_cause: "",
    disability_onset_date: "",
    // 신체 기능 제한 (체크박스)
    body_limitations: [] as string[],
    // 인지/감각 기능
    cognitive_sensory: [] as string[],
    // 상담 내용
    consultation_content: "",
    // 보유 보조기기
    current_devices: [
      { name: "", in_use: false, source: "", year: "" },
    ] as Array<{ name: string; in_use: boolean; source: string; year: string }>,
    // 주요 활동 장소
    main_activity_place: "",
    // 활동사항
    activity_details: "",
    // 활동 시 자세
    activity_posture: "",
    // 활동 주지원자
    main_supporter: "",
    // 환경 제한 사항
    environment_limitations: "",
  })

  const bodyLimitationOptions = [
    { id: "shoulder_l", label: "어깨관절(L)" },
    { id: "upper_arm_l", label: "위팔(L)" },
    { id: "elbow_l", label: "팔꿉관절(L)" },
    { id: "forearm_l", label: "아래팔(L)" },
    { id: "wrist_l", label: "손목(L)" },
    { id: "hand_l", label: "손(L)" },
    { id: "hip_l", label: "엉덩관절(L)" },
    { id: "thigh_l", label: "넓적다리(L)" },
    { id: "knee_l", label: "무릎관절(L)" },
    { id: "calf_l", label: "종아리(L)" },
    { id: "ankle_l", label: "발목(L)" },
    { id: "foot_l", label: "발(L)" },
    { id: "shoulder_r", label: "어깨관절(R)" },
    { id: "upper_arm_r", label: "위팔(R)" },
    { id: "elbow_r", label: "팔꿉관절(R)" },
    { id: "forearm_r", label: "아래팔(R)" },
    { id: "wrist_r", label: "손목(R)" },
    { id: "hand_r", label: "손(R)" },
    { id: "hip_r", label: "엉덩관절(R)" },
    { id: "thigh_r", label: "넓적다리(R)" },
    { id: "knee_r", label: "무릎관절(R)" },
    { id: "calf_r", label: "종아리(R)" },
    { id: "ankle_r", label: "발목(R)" },
    { id: "foot_r", label: "발(R)" },
    { id: "language", label: "언어" },
    { id: "cognitive", label: "인지" },
    { id: "vision", label: "시각" },
    { id: "hearing", label: "청각" },
    { id: "head", label: "머리" },
    { id: "neck", label: "목" },
    { id: "trunk", label: "체간" },
    { id: "spine", label: "척수" },
  ]

  const cognitiveSensoryOptions = [
    "인지장애",
    "시각장애",
    "청각장애",
    "언어장애",
    "기타",
  ]

  const fundingSourceOptions = [
    "보조기기교부사업",
    "보장구 건강보험",
    "보장구 의료급여",
    "노인장기요양보험",
    "정보통신보조기기",
    "고용공단 보조공학기기",
    "산업재해 재활보조기기지원",
    "보철구지급사업",
    "자동차보험",
    "민간급여",
    "바우처지원",
    "기타",
  ]

  const handleBodyLimitationToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      body_limitations: prev.body_limitations.includes(id)
        ? prev.body_limitations.filter((item) => item !== id)
        : [...prev.body_limitations, id],
    }))
  }

  const handleCognitiveSensoryToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      cognitive_sensory: prev.cognitive_sensory.includes(value)
        ? prev.cognitive_sensory.filter((item) => item !== value)
        : [...prev.cognitive_sensory, value],
    }))
  }

  const handleFundingSourceToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      funding_sources: prev.funding_sources.includes(value)
        ? prev.funding_sources.filter((item) => item !== value)
        : [...prev.funding_sources, value],
    }))
  }

  const handleAddDevice = () => {
    setFormData((prev) => ({
      ...prev,
      current_devices: [
        ...prev.current_devices,
        { name: "", in_use: false, source: "", year: "" },
      ],
    }))
  }

  const handleRemoveDevice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      current_devices: prev.current_devices.filter((_, i) => i !== index),
    }))
  }

  const handleDeviceChange = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      current_devices: prev.current_devices.map((device, i) =>
        i === index ? { ...device, [field]: value } : device
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // 주거형태 결합
      let housingType = formData.housing_type
      if (formData.housing_floor) {
        housingType = `${formData.housing_type}(${formData.housing_floor}층)`
      }

      const result = await createIntakeRecord({
        application_id: applicationId || "",
        client_id: clientId,
        consult_date: formData.consult_date,
        // body_function_data는 JSONB로 저장
        body_function_data: {
          limitations: formData.body_limitations,
        },
        cognitive_sensory_check: formData.cognitive_sensory,
        current_devices: formData.current_devices.filter(
          (d) => d.name.trim() !== ""
        ),
        consultation_content: formData.consultation_content,
        main_activity_place: formData.main_activity_place,
        activity_posture: formData.activity_posture,
        main_supporter: formData.main_supporter,
        environment_limitations: formData.environment_limitations,
      })

      if (result.success) {
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || "상담 기록 저장에 실패했습니다")
      }
    } catch (err) {
      console.error("상담 기록 저장 오류:", err)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>상담 기록지 (첨부 19)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 상담일 및 상담자 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="consult_date">상담일 *</Label>
              <Input
                id="consult_date"
                type="date"
                value={formData.consult_date}
                onChange={(e) =>
                  setFormData({ ...formData, consult_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultant_id">상담자</Label>
              <Input
                id="consultant_id"
                value={formData.consultant_id}
                onChange={(e) =>
                  setFormData({ ...formData, consultant_id: e.target.value })
                }
              />
            </div>
          </div>

          {/* 대상자 정보 (읽기 전용 - clientId로 조회) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">대상자 정보</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input value={formData.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>생년월일(나이)/성별</Label>
                <Input
                  value={`${formData.birth_date} / ${formData.gender}`}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>연락처 (본인)</Label>
                <Input value={formData.contact} disabled />
              </div>
              <div className="space-y-2">
                <Label>연락처 (보호자)</Label>
                <Input value={formData.guardian_contact} disabled />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>주소</Label>
                <Input value={formData.address} disabled />
              </div>
            </div>
          </div>

          {/* 주거형태 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">주거형태</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="housing_type">주거형태</Label>
                <Select
                  value={formData.housing_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, housing_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="단독주택">단독주택</SelectItem>
                    <SelectItem value="다가구주택">다가구주택</SelectItem>
                    <SelectItem value="아파트">아파트</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_floor">층수</Label>
                <Input
                  id="housing_floor"
                  type="number"
                  value={formData.housing_floor}
                  onChange={(e) =>
                    setFormData({ ...formData, housing_floor: e.target.value })
                  }
                  placeholder="층"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="has_elevator"
                  checked={formData.has_elevator}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_elevator: checked === true })
                  }
                />
                <Label htmlFor="has_elevator" className="cursor-pointer">
                  엘리베이터 유
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="obstacles">장애물</Label>
                <Input
                  id="obstacles"
                  value={formData.obstacles}
                  onChange={(e) =>
                    setFormData({ ...formData, obstacles: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 경제상황 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">경제상황</h3>
            <div className="space-y-2">
              <Select
                value={formData.economic_status}
                onValueChange={(value) =>
                  setFormData({ ...formData, economic_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="기초생활수급자">기초생활수급자</SelectItem>
                  <SelectItem value="차상위">차상위</SelectItem>
                  <SelectItem value="건강보험">건강보험</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 연계가능재원 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">연계가능재원</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {fundingSourceOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`funding_${option}`}
                    checked={formData.funding_sources.includes(option)}
                    onCheckedChange={() => handleFundingSourceToggle(option)}
                  />
                  <Label htmlFor={`funding_${option}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 장애정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">장애정보</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disability_type">장애유형/정도</Label>
                <Input
                  id="disability_type"
                  value={formData.disability_type}
                  onChange={(e) =>
                    setFormData({ ...formData, disability_type: e.target.value })
                  }
                  placeholder="장애유형 (심한/심하지 않은)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disability_cause">장애발생원인</Label>
                <Input
                  id="disability_cause"
                  value={formData.disability_cause}
                  onChange={(e) =>
                    setFormData({ ...formData, disability_cause: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disability_onset_date">장애발생시기</Label>
                <Input
                  id="disability_onset_date"
                  type="date"
                  value={formData.disability_onset_date}
                  onChange={(e) =>
                    setFormData({ ...formData, disability_onset_date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 신체 기능 제한 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              현재 장애 상태 - 신체 기능 제한
            </h3>
            <div className="grid gap-2 md:grid-cols-4">
              {bodyLimitationOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`body_${option.id}`}
                    checked={formData.body_limitations.includes(option.id)}
                    onCheckedChange={() => handleBodyLimitationToggle(option.id)}
                  />
                  <Label htmlFor={`body_${option.id}`} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 인지/감각 기능 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">인지/감각 기능</h3>
            <div className="grid gap-2 md:grid-cols-3">
              {cognitiveSensoryOptions.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cognitive_${option}`}
                    checked={formData.cognitive_sensory.includes(option)}
                    onCheckedChange={() => handleCognitiveSensoryToggle(option)}
                  />
                  <Label htmlFor={`cognitive_${option}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 상담 내용 및 이용자욕구 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              상담 내용 및 이용자욕구
            </h3>
            <div className="space-y-2">
              <Label htmlFor="consultation_content">
                (장애 상태 상세, 직업, 가족력, 이력 사항, 질병, 약물, 이용 서비스 등)
              </Label>
              <Textarea
                id="consultation_content"
                value={formData.consultation_content}
                onChange={(e) =>
                  setFormData({ ...formData, consultation_content: e.target.value })
                }
                rows={6}
                placeholder="상담 내용을 입력하세요"
              />
            </div>
          </div>

          {/* 보유 보조기기 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">보유 보조기기</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddDevice}>
                기기 추가
              </Button>
            </div>
            <div className="space-y-3">
              {formData.current_devices.map((device, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-5 border p-3 rounded-md">
                  <Input
                    placeholder="보조기기명"
                    value={device.name}
                    onChange={(e) =>
                      handleDeviceChange(index, "name", e.target.value)
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={device.in_use}
                      onCheckedChange={(checked) =>
                        handleDeviceChange(index, "in_use", checked === true)
                      }
                    />
                    <Label className="text-sm">활용여부</Label>
                  </div>
                  <Input
                    placeholder="수급경로"
                    value={device.source}
                    onChange={(e) =>
                      handleDeviceChange(index, "source", e.target.value)
                    }
                  />
                  <Input
                    placeholder="년도"
                    value={device.year}
                    onChange={(e) =>
                      handleDeviceChange(index, "year", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDevice(index)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 활동 장소 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">활동 / 환경</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="main_activity_place">주요 활동 장소</Label>
                <Select
                  value={formData.main_activity_place}
                  onValueChange={(value) =>
                    setFormData({ ...formData, main_activity_place: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="집">집</SelectItem>
                    <SelectItem value="학교">학교</SelectItem>
                    <SelectItem value="직장">직장</SelectItem>
                    <SelectItem value="지역사회">지역사회</SelectItem>
                    <SelectItem value="병원">병원</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity_details">활동사항 (학습, 업무, ADL)</Label>
                <Input
                  id="activity_details"
                  value={formData.activity_details}
                  onChange={(e) =>
                    setFormData({ ...formData, activity_details: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity_posture">활동 시 자세</Label>
                <Select
                  value={formData.activity_posture}
                  onValueChange={(value) =>
                    setFormData({ ...formData, activity_posture: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="누운자세">누운자세</SelectItem>
                    <SelectItem value="앉은자세">앉은자세</SelectItem>
                    <SelectItem value="선 자세">선 자세</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="main_supporter">활동 주지원자</Label>
                <Select
                  value={formData.main_supporter}
                  onValueChange={(value) =>
                    setFormData({ ...formData, main_supporter: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="가족">가족</SelectItem>
                    <SelectItem value="친구">친구</SelectItem>
                    <SelectItem value="간병인">간병인</SelectItem>
                    <SelectItem value="활동보조인">활동보조인</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="environment_limitations">환경 제한 사항</Label>
                <Textarea
                  id="environment_limitations"
                  value={formData.environment_limitations}
                  onChange={(e) =>
                    setFormData({ ...formData, environment_limitations: e.target.value })
                  }
                  rows={3}
                />
              </div>
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

