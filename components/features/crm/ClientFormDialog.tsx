"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { createClientRecord, updateClient, type Client } from "@/actions/client-actions"
import { Loader2 } from "lucide-react"
import { Database } from "@/types/database.types"

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ClientRow | null
  onSuccess?: () => void
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientFormDialogProps) {
  const isEdit = !!client
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    birth_date: "",
    gender: "" as "남" | "여" | "",
    contact: "",
    guardian_contact: "",
    address: "",
    housing_type: "",
    housing_floor: "",
    has_elevator: false,
    obstacles: "",
    economic_status: "",
    disability_type: "",
    disability_grade: "",
    disability_cause: "",
    disability_onset_date: "",
  })

  // 클라이언트 데이터로 폼 초기화
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        registration_number: client.registration_number || "",
        birth_date: client.birth_date || "",
        gender: (client.gender as "남" | "여") || "",
        contact: client.contact || "",
        guardian_contact: client.guardian_contact || "",
        address: client.address || "",
        housing_type: client.housing_type || "",
        housing_floor: "",
        has_elevator: client.has_elevator || false,
        obstacles: client.obstacles || "",
        economic_status: client.economic_status || "",
        disability_type: client.disability_type || "",
        disability_grade: client.disability_grade || "",
        disability_cause: client.disability_cause || "",
        disability_onset_date: client.disability_onset_date || "",
      })
    } else {
      // 새 대상자 등록 시 폼 초기화
      setFormData({
        name: "",
        registration_number: "",
        birth_date: "",
        gender: "",
        contact: "",
        guardian_contact: "",
        address: "",
        housing_type: "",
        housing_floor: "",
        has_elevator: false,
        obstacles: "",
        economic_status: "",
        disability_type: "",
        disability_grade: "",
        disability_cause: "",
        disability_onset_date: "",
      })
    }
    setError(null)
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // 주거형태와 층수 결합
      let housingType = formData.housing_type
      if (formData.housing_floor) {
        housingType = `${formData.housing_type}(${formData.housing_floor}층)`
      }

      const clientData = {
        name: formData.name,
        registration_number: formData.registration_number || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        contact: formData.contact || null,
        guardian_contact: formData.guardian_contact || null,
        address: formData.address || null,
        housing_type: housingType || null,
        has_elevator: formData.has_elevator,
        obstacles: formData.obstacles || null,
        economic_status: formData.economic_status || null,
        disability_type: formData.disability_type || null,
        disability_grade: formData.disability_grade || null,
        disability_cause: formData.disability_cause || null,
        disability_onset_date: formData.disability_onset_date || null,
      }

      let result
      if (isEdit && client) {
        result = await updateClient(client.id, clientData)
      } else {
        result = await createClientRecord(clientData)
      }

      if (result.success) {
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(result.error || "처리 중 오류가 발생했습니다")
      }
    } catch (err) {
      console.error("대상자 저장 오류:", err)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "대상자 정보 수정" : "대상자 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "대상자 정보를 수정합니다" : "새로운 대상자를 등록합니다"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">기본 정보</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">등록번호</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_number: e.target.value })
                  }
                  placeholder="00-000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">생년월일</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">성별</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as "남" | "여" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="남">남</SelectItem>
                    <SelectItem value="여">여</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">연락처 (본인)</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardian_contact">연락처 (보호자)</Label>
                <Input
                  id="guardian_contact"
                  value={formData.guardian_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, guardian_contact: e.target.value })
                  }
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
          </div>

          {/* 주소 및 주거 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">주소 및 주거 정보</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="housing_type">주거형태</Label>
                <Select
                  value={formData.housing_type}
                  onValueChange={(value) => setFormData({ ...formData, housing_type: value })}
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
                  onChange={(e) => setFormData({ ...formData, housing_floor: e.target.value })}
                  placeholder="층"
                />
              </div>

              <div className="flex items-center space-x-2">
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
                  onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 경제 상황 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">경제 상황</h3>
            <div className="space-y-2">
              <Label htmlFor="economic_status">경제상황</Label>
              <Select
                value={formData.economic_status}
                onValueChange={(value) => setFormData({ ...formData, economic_status: value })}
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

          {/* 장애 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">장애 정보</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disability_type">장애유형</Label>
                <Select
                  value={formData.disability_type}
                  onValueChange={(value) => setFormData({ ...formData, disability_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="지체장애">지체장애</SelectItem>
                    <SelectItem value="뇌병변장애">뇌병변장애</SelectItem>
                    <SelectItem value="시각장애">시각장애</SelectItem>
                    <SelectItem value="청각장애">청각장애</SelectItem>
                    <SelectItem value="언어장애">언어장애</SelectItem>
                    <SelectItem value="지적장애">지적장애</SelectItem>
                    <SelectItem value="자폐성장애">자폐성장애</SelectItem>
                    <SelectItem value="정신장애">정신장애</SelectItem>
                    <SelectItem value="신장장애">신장장애</SelectItem>
                    <SelectItem value="심장장애">심장장애</SelectItem>
                    <SelectItem value="호흡기장애">호흡기장애</SelectItem>
                    <SelectItem value="간장애">간장애</SelectItem>
                    <SelectItem value="안면장애">안면장애</SelectItem>
                    <SelectItem value="장루·요루장애">장루·요루장애</SelectItem>
                    <SelectItem value="뇌전증장애">뇌전증장애</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disability_grade">장애정도</Label>
                <Input
                  id="disability_grade"
                  value={formData.disability_grade}
                  onChange={(e) => setFormData({ ...formData, disability_grade: e.target.value })}
                  placeholder="심한/심하지 않은"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disability_cause">장애발생원인</Label>
                <Input
                  id="disability_cause"
                  value={formData.disability_cause}
                  onChange={(e) => setFormData({ ...formData, disability_cause: e.target.value })}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                isEdit ? "수정" : "등록"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

