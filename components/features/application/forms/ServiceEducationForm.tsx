"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { educationApplicationSchema, type EducationApplicationForm } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function ServiceEducationForm() {
  const { formData, setFormData, setCurrentStep } = useApplicationStore()
  const [desiredDate, setDesiredDate] = useState<Date | undefined>(
    formData?.desired_date ? new Date(formData.desired_date) : undefined
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EducationApplicationForm>({
    resolver: zodResolver(educationApplicationSchema),
    defaultValues: {
      category: "education",
      sub_category: "education",
      education_type: "user",
      ...formData,
    } as Partial<EducationApplicationForm>,
  })

  const educationType = watch("education_type")

  const onSubmit = async (data: EducationApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>교육 유형 *</Label>
        <RadioGroup
          value={educationType}
          onValueChange={(value) => setValue("education_type", value as "user" | "staff" | "public_official" | "professional")}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="user" id="user" />
            <Label htmlFor="user" className="font-normal cursor-pointer">
              사용자 교육
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="staff" id="staff" />
            <Label htmlFor="staff" className="font-normal cursor-pointer">
              종사자 역량 강화
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public_official" id="public_official" />
            <Label htmlFor="public_official" className="font-normal cursor-pointer">
              공무원 교육
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="professional" id="professional" />
            <Label htmlFor="professional" className="font-normal cursor-pointer">
              관련 전문가 교육
            </Label>
          </div>
        </RadioGroup>
        {errors.education_type && (
          <p className="text-sm text-destructive" role="alert">
            {errors.education_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="education_topic">교육 주제 *</Label>
        <Input
          id="education_topic"
          {...register("education_topic")}
          placeholder="예: 휠체어 사용법, 보조기기 선택 가이드 등"
          aria-invalid={errors.education_topic ? "true" : "false"}
          aria-describedby={errors.education_topic ? "education_topic-error" : undefined}
        />
        {errors.education_topic && (
          <p id="education_topic-error" className="text-sm text-destructive" role="alert">
            {errors.education_topic.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="participant_count">참여 인원 (선택사항)</Label>
        <Input
          id="participant_count"
          type="number"
          min="1"
          {...register("participant_count", { valueAsNumber: true })}
          placeholder="예: 10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="desired_date">희망 교육 일자 (선택사항)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !desiredDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {desiredDate ? (
                format(desiredDate, "yyyy년 MM월 dd일", { locale: ko })
              ) : (
                <span>날짜 선택</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={desiredDate}
              onSelect={(date) => {
                setDesiredDate(date)
                setValue("desired_date", date)
              }}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_time">희망 시간 (선택사항)</Label>
        <Input
          id="preferred_time"
          {...register("preferred_time")}
          placeholder="예: 오전 10시 ~ 오후 12시"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">교육 장소 (선택사항)</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder="예: 센터 교육실, 온라인 등"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">연락처 *</Label>
        <Input
          id="contact"
          type="tel"
          {...register("contact")}
          placeholder="010-1234-5678"
          aria-invalid={errors.contact ? "true" : "false"}
          aria-describedby={errors.contact ? "contact-error" : undefined}
        />
        {errors.contact && (
          <p id="contact-error" className="text-sm text-destructive" role="alert">
            {errors.contact.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">교육 목적 및 내용 *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="교육을 신청하는 목적과 원하는 교육 내용을 자세히 설명해주세요 (10자 이상)"
          rows={5}
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive" role="alert">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          이전
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "처리 중..." : "다음"}
        </Button>
      </div>
    </form>
  )
}

