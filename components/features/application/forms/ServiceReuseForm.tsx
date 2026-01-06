"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { reuseApplicationSchema, type ReuseApplicationForm } from "@/lib/validators"
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

export function ServiceReuseForm() {
  const { formData, setFormData, setCurrentStep, selectedSubCategory } = useApplicationStore()
  const [desiredDate, setDesiredDate] = useState<Date | undefined>(
    formData?.desired_date ? new Date(formData.desired_date) : undefined
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ReuseApplicationForm>({
    resolver: zodResolver(reuseApplicationSchema),
    defaultValues: {
      category: "aftercare",
      sub_category: "reuse",
      reuse_type: selectedSubCategory === "reuse" ? "donate" : "receive",
      ...formData,
    } as Partial<ReuseApplicationForm>,
  })

  const reuseType = watch("reuse_type")

  const onSubmit = async (data: ReuseApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>재사용 유형 *</Label>
        <RadioGroup
          value={reuseType}
          onValueChange={(value) => setValue("reuse_type", value as "donate" | "receive")}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="donate" id="donate" />
            <Label htmlFor="donate" className="font-normal cursor-pointer">
              기기 기증 (기증하고 싶은 기기)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="receive" id="receive" />
            <Label htmlFor="receive" className="font-normal cursor-pointer">
              기기 수령 (재사용 기기 신청)
            </Label>
          </div>
        </RadioGroup>
        {errors.reuse_type && (
          <p className="text-sm text-destructive" role="alert">
            {errors.reuse_type.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="device_name">기기명 *</Label>
        <Input
          id="device_name"
          {...register("device_name")}
          placeholder={reuseType === "donate" ? "기증할 기기명을 입력해주세요" : "신청할 기기명을 입력해주세요"}
          aria-invalid={errors.device_name ? "true" : "false"}
          aria-describedby={errors.device_name ? "device_name-error" : undefined}
        />
        {errors.device_name && (
          <p id="device_name-error" className="text-sm text-destructive" role="alert">
            {errors.device_name.message}
          </p>
        )}
      </div>

      {reuseType === "donate" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="device_condition">기기 상태 *</Label>
            <Textarea
              id="device_condition"
              {...register("device_condition")}
              placeholder="기기의 현재 상태를 자세히 설명해주세요 (10자 이상)"
              rows={4}
              aria-invalid={errors.device_condition ? "true" : "false"}
            />
            {errors.device_condition && (
              <p className="text-sm text-destructive" role="alert">
                {errors.device_condition.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_address">수거 주소 *</Label>
            <Input
              id="pickup_address"
              {...register("pickup_address")}
              placeholder="기기 수거가 가능한 주소를 입력해주세요"
              aria-invalid={errors.pickup_address ? "true" : "false"}
            />
            {errors.pickup_address && (
              <p className="text-sm text-destructive" role="alert">
                {errors.pickup_address.message}
              </p>
            )}
          </div>
        </>
      )}

      {reuseType === "receive" && (
        <div className="space-y-2">
          <Label htmlFor="purpose">신청 목적 *</Label>
          <Textarea
            id="purpose"
            {...register("purpose")}
            placeholder="재사용 기기를 신청하는 목적을 자세히 설명해주세요 (10자 이상)"
            rows={4}
            aria-invalid={errors.purpose ? "true" : "false"}
          />
          {errors.purpose && (
            <p className="text-sm text-destructive" role="alert">
              {errors.purpose.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="desired_date">희망 일자 (선택사항)</Label>
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

