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
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  schedule_type: value as CreateScheduleInput["schedule_type"],
                }))
              }
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
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
              <Clock className="h-4 w-4 text-muted-foreground" />
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
              />
            </div>
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: e.target.value || null,
                }))
              }
              placeholder="방문 주소를 입력하세요"
            />
          </div>

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
                  status: value as "scheduled" | "completed" | "cancelled",
                }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">예정</SelectItem>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {schedule ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
