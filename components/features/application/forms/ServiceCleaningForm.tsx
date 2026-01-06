"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cleaningApplicationSchema, type CleaningApplicationForm } from "@/lib/validators"
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

export function ServiceCleaningForm() {
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
  } = useForm<CleaningApplicationForm>({
    resolver: zodResolver(cleaningApplicationSchema),
    defaultValues: {
      category: "aftercare",
      sub_category: "cleaning",
      cleaning_type: "basic",
      ...formData,
    } as Partial<CleaningApplicationForm>,
  })

  const cleaningType = watch("cleaning_type")

  const onSubmit = async (data: CleaningApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="device_name">기기명 *</Label>
        <Input
          id="device_name"
          {...register("device_name")}
          placeholder="예: 휠체어, 목발, 지팡이 등"
          aria-invalid={errors.device_name ? "true" : "false"}
          aria-describedby={errors.device_name ? "device_name-error" : undefined}
        />
        {errors.device_name && (
          <p id="device_name-error" className="text-sm text-destructive" role="alert">
            {errors.device_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="device_count">기기 개수 *</Label>
        <Input
          id="device_count"
          type="number"
          min="1"
          {...register("device_count", { valueAsNumber: true })}
          placeholder="예: 1"
          aria-invalid={errors.device_count ? "true" : "false"}
        />
        {errors.device_count && (
          <p className="text-sm text-destructive" role="alert">
            {errors.device_count.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>소독 및 세척 유형 *</Label>
        <RadioGroup
          value={cleaningType}
          onValueChange={(value) => setValue("cleaning_type", value as "basic" | "deep")}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="basic" id="cleaning_basic" />
            <Label htmlFor="cleaning_basic" className="font-normal cursor-pointer">
              기본 세척
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="deep" id="cleaning_deep" />
            <Label htmlFor="cleaning_deep" className="font-normal cursor-pointer">
              심층 소독
            </Label>
          </div>
        </RadioGroup>
        {errors.cleaning_type && (
          <p className="text-sm text-destructive" role="alert">
            {errors.cleaning_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="desired_date">희망 소독 일자 (선택사항)</Label>
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
        <Label htmlFor="address">주소 (선택사항)</Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="방문 소독이 필요한 경우 주소를 입력해주세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">추가 설명 *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="기타 필요한 사항을 입력해주세요 (10자 이상)"
          rows={4}
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

