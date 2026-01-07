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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { type Schedule, createSchedule, updateSchedule, type CreateScheduleInput } from "@/actions/schedule-actions"
import { Loader2 } from "lucide-react"

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule | null
  onSuccess?: () => void
}

const scheduleTypeLabels: Record<string, string> = {
  visit: "방문",
  consult: "상담",
  assessment: "평가",
  delivery: "배송",
  pickup: "픽업",
  exhibition: "견학",
  education: "교육",
}

// 강원특별자치도 18개 시군 목록
const gangwonRegions = [
  "춘천시",
  "원주시",
  "강릉시",
  "동해시",
  "태백시",
  "속초시",
  "삼척시",
  "홍천군",
  "횡성군",
  "영월군",
  "평창군",
  "정선군",
  "철원군",
  "화천군",
  "양구군",
  "인제군",
  "고성군",
  "양양군",
]

export function ScheduleForm({
  open,
  onOpenChange,
  schedule,
  onSuccess,
}: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState<CreateScheduleInput>({
    schedule_type: "exhibition",
    scheduled_date: format(new Date(), "yyyy-MM-dd"),
    scheduled_time: null,
    address: null,
    notes: null,
    status: "scheduled",
  })
  const [visitType, setVisitType] = useState<"center" | "visit" | null>(null)
  const [visitRegion, setVisitRegion] = useState<string>("")

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // 일정이 변경되면 폼 데이터 초기화
  useEffect(() => {
    if (schedule) {
      setFormData({
        application_id: schedule.application_id || null,
        client_id: schedule.client_id || null,
        schedule_type: schedule.schedule_type,
        scheduled_date: schedule.scheduled_date,
        scheduled_time: schedule.scheduled_time || null,
        address: schedule.address || null,
        notes: schedule.notes || null,
        status: schedule.status,
      })
      setSelectedDate(new Date(schedule.scheduled_date))
      // 견학일 경우 항상 내방
      if (schedule.schedule_type === "exhibition") {
        setVisitType("center")
        setVisitRegion("")
      } else if (schedule.address) {
        // 주소가 있으면 "방문", 없으면 "내방"으로 추정 (기존 데이터 호환성)
        setVisitType("visit")
        // 주소에서 시군 추출 시도 (간단한 매칭)
        const region = gangwonRegions.find((r) => schedule.address?.includes(r))
        setVisitRegion(region || "")
      } else {
        setVisitType("center")
        setVisitRegion("")
      }
    } else {
      setFormData({
        schedule_type: "exhibition",
        scheduled_date: format(new Date(), "yyyy-MM-dd"),
        scheduled_time: null,
        address: null,
        notes: null,
        status: "scheduled",
      })
      setSelectedDate(new Date())
      // 견학일 경우 자동으로 내방으로 설정
      if (formData.schedule_type === "exhibition") {
        setVisitType("center")
      } else {
        setVisitType(null)
      }
      setVisitRegion("")
    }
    setError(null)
  }, [schedule, open])

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setFormData((prev) => ({
        ...prev,
        scheduled_date: format(date, "yyyy-MM-dd"),
      }))
    }
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      console.log("[일정 폼] 제출 시작:", formData)

      if (schedule) {
        // 수정
        const result = await updateSchedule({
          id: schedule.id,
          ...formData,
        })

        if (!result.success) {
          setError(result.error || "일정 수정에 실패했습니다")
          console.error("[일정 폼] 수정 실패:", result.error)
          return
        }

        console.log("[일정 폼] 수정 성공:", result.data?.id)
      } else {
        // 생성
        const result = await createSchedule(formData)

        if (!result.success) {
          setError(result.error || "일정 생성에 실패했습니다")
          console.error("[일정 폼] 생성 실패:", result.error)
          return
        }

        console.log("[일정 폼] 생성 성공:", result.data?.id)
      }

      // 성공 시 처리
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("[일정 폼] 예외:", err)
      setError("예상치 못한 오류가 발생했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "일정 수정" : "일정 등록"}
          </DialogTitle>
          <DialogDescription>
            {schedule
              ? "일정 정보를 수정합니다."
              : "새로운 일정을 등록합니다. 견학 또는 교육 일정은 메인페이지 캘린더에 표시됩니다."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 일정 유형 */}
          <div className="space-y-2">
            <Label htmlFor="schedule_type">일정 유형 *</Label>
            <Select
              value={formData.schedule_type}
              onValueChange={(value) => {
                const newType = value as CreateScheduleInput["schedule_type"]
                setFormData((prev) => ({
                  ...prev,
                  schedule_type: newType,
                }))
                // 견학으로 변경 시 자동으로 내방으로 설정
                if (newType === "exhibition") {
                  setVisitType("center")
                  setVisitRegion("")
                  setFormData((prev) => ({
                    ...prev,
                    address: null,
                  }))
                }
              }}
            >
              <SelectTrigger id="schedule_type">
                <SelectValue placeholder="일정 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(scheduleTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 */}
          <div className="space-y-2">
            <Label>일정 날짜 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  aria-label="일정 날짜 선택"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {selectedDate ? (
                    format(selectedDate, "yyyy년 MM월 dd일", { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={ko}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 시간 */}
          <div className="space-y-2">
            <Label htmlFor="scheduled_time">일정 시간</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduled_time: e.target.value || null,
                  }))
                }
                aria-label="일정 시간"
              />
            </div>
          </div>

          {/* 내방 여부 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">내방 여부</h3>
            <Select
              value={visitType || ""}
              onValueChange={(value) => {
                setVisitType(value as "center" | "visit" | null)
                if (value === "center") {
                  setFormData((prev) => ({
                    ...prev,
                    address: null,
                  }))
                  setVisitRegion("")
                } else if (value === "visit") {
                  // 방문 선택 시 지역은 선택하도록 유도
                  setVisitRegion("")
                }
              }}
              disabled={formData.schedule_type === "exhibition"}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">내방</SelectItem>
                {formData.schedule_type !== "exhibition" && (
                  <SelectItem value="visit">방문</SelectItem>
                )}
              </SelectContent>
            </Select>
            {formData.schedule_type === "exhibition" && (
              <p className="text-xs text-muted-foreground">
                견학 일정은 내방만 가능합니다.
              </p>
            )}
          </div>

          {/* 방문 지역 (방문 선택 시에만 표시, 견학 제외) */}
          {visitType === "visit" && formData.schedule_type !== "exhibition" && (
            <div className="space-y-2">
              <Label htmlFor="visit_region">방문 지역 *</Label>
              <Select
                value={visitRegion}
                onValueChange={(value) => {
                  setVisitRegion(value)
                  // 선택한 지역을 주소 필드에 저장 (기존 스키마 호환성)
                  setFormData((prev) => ({
                    ...prev,
                    address: value || null,
                  }))
                }}
              >
                <SelectTrigger id="visit_region">
                  <SelectValue placeholder="시군을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {gangwonRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value || null,
                }))
              }
              placeholder="일정에 대한 메모를 입력하세요"
              rows={4}
            />
          </div>

          {/* 상태 */}
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status || "scheduled"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as "scheduled" | "confirmed" | "completed" | "cancelled",
                }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">예정</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} aria-label={schedule ? "일정 수정" : "일정 등록"}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {schedule ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
