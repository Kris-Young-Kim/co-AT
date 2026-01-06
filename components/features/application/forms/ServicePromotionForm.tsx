"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { promotionApplicationSchema, type PromotionApplicationForm } from "@/lib/validators"
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

export function ServicePromotionForm() {
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
  } = useForm<PromotionApplicationForm>({
    resolver: zodResolver(promotionApplicationSchema),
    defaultValues: {
      category: "education",
      sub_category: "promotion",
      promotion_type: "online",
      ...formData,
    } as Partial<PromotionApplicationForm>,
  })

  const promotionType = watch("promotion_type")

  const onSubmit = async (data: PromotionApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>홍보 유형 *</Label>
        <RadioGroup
          value={promotionType}
          onValueChange={(value) => setValue("promotion_type", value as "online" | "offline" | "material" | "campaign")}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online" className="font-normal cursor-pointer">
              온라인 홍보
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="offline" id="offline" />
            <Label htmlFor="offline" className="font-normal cursor-pointer">
              오프라인 홍보
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="material" id="material" />
            <Label htmlFor="material" className="font-normal cursor-pointer">
              홍보물 제작
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="campaign" id="campaign" />
            <Label htmlFor="campaign" className="font-normal cursor-pointer">
              보조기기 인식 개선 캠페인
            </Label>
          </div>
        </RadioGroup>
        {errors.promotion_type && (
          <p className="text-sm text-destructive" role="alert">
            {errors.promotion_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="promotion_title">홍보 제목 *</Label>
        <Input
          id="promotion_title"
          {...register("promotion_title")}
          placeholder="홍보 주제나 제목을 입력해주세요"
          aria-invalid={errors.promotion_title ? "true" : "false"}
          aria-describedby={errors.promotion_title ? "promotion_title-error" : undefined}
        />
        {errors.promotion_title && (
          <p id="promotion_title-error" className="text-sm text-destructive" role="alert">
            {errors.promotion_title.message}
          </p>
        )}
      </div>

      {promotionType === "material" && (
        <div className="space-y-2">
          <Label htmlFor="material_type">홍보물 종류 (선택사항)</Label>
          <Input
            id="material_type"
            {...register("material_type")}
            placeholder="예: 포스터, 브로셔, 리플렛 등"
          />
        </div>
      )}

      {promotionType === "offline" && (
        <div className="space-y-2">
          <Label htmlFor="location">홍보 장소 (선택사항)</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="예: 지역 행사장, 복지관 등"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="desired_date">희망 홍보 일자 (선택사항)</Label>
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
        <Label htmlFor="description">홍보 목적 및 내용 *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="홍보 목적과 원하는 홍보 내용을 자세히 설명해주세요 (10자 이상)"
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

