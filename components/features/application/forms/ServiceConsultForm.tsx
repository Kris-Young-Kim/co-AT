"use client"

import React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { consultApplicationSchema, type ConsultApplicationForm } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

export function ServiceConsultForm() {
  const { formData, setFormData, setCurrentStep } = useApplicationStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
  } = useForm<ConsultApplicationForm>({
    resolver: zodResolver(consultApplicationSchema),
    defaultValues: {
      category: "consult",
      description:
        formData?.description ||
        (formData as Partial<ConsultApplicationForm>)?.consult_purpose ||
        "",
      ...formData,
    } as Partial<ConsultApplicationForm>,
  })

  const consultType = watch("consult_type")
  const consultPurpose = watch("consult_purpose")

  // consult_purpose가 변경되면 description도 함께 업데이트
  React.useEffect(() => {
    if (consultPurpose) {
      setValue("description", consultPurpose, { shouldValidate: true })
    }
  }, [consultPurpose, setValue])

  const onSubmit = async (data: ConsultApplicationForm) => {
    // description 필드가 없으면 consult_purpose를 description으로 복사
    const formDataToSave = {
      ...data,
      description: data.description || data.consult_purpose || "",
    }
    setFormData(formDataToSave)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>상담 유형 *</Label>
        <Controller
          name="consult_type"
          control={control}
          rules={{ required: "상담 유형을 선택해주세요" }}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value as "phone" | "visit" | "center")
              }}
              className="flex flex-col gap-3"
              aria-describedby={errors.consult_type ? "consult_type-error" : undefined}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="font-normal cursor-pointer">
                  전화 상담
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visit" id="visit" />
                <Label htmlFor="visit" className="font-normal cursor-pointer">
                  방문 상담
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="center" id="center" />
                <Label htmlFor="center" className="font-normal cursor-pointer">
                  센터 방문
                </Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.consult_type && (
          <p id="consult_type-error" className="text-sm text-destructive" role="alert">
            {errors.consult_type.message}
          </p>
        )}
      </div>

      {consultType === "visit" && (
        <div className="space-y-2">
          <Label htmlFor="address">방문 주소 *</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="방문이 필요한 경우 주소를 입력해주세요"
            aria-invalid={errors.address ? "true" : "false"}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
          {errors.address && (
            <p id="address-error" className="text-sm text-destructive" role="alert">
              {errors.address.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="preferred_time">희망 상담 시간 (선택사항)</Label>
        <Input
          id="preferred_time"
          {...register("preferred_time")}
          placeholder="예: 오전 10시 ~ 오후 2시"
          aria-invalid={errors.preferred_time ? "true" : "false"}
          aria-describedby={errors.preferred_time ? "preferred_time-error" : undefined}
        />
        {errors.preferred_time && (
          <p id="preferred_time-error" className="text-sm text-destructive" role="alert">
            {errors.preferred_time.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="consult_purpose">상담 목적 *</Label>
        <Textarea
          id="consult_purpose"
          {...register("consult_purpose")}
          placeholder="상담 목적을 자세히 설명해주세요 (10자 이상)"
          rows={5}
          aria-invalid={errors.consult_purpose ? "true" : "false"}
          aria-describedby={errors.consult_purpose ? "consult_purpose-error" : undefined}
        />
        {errors.consult_purpose && (
          <p id="consult_purpose-error" className="text-sm text-destructive" role="alert">
            {errors.consult_purpose.message}
          </p>
        )}
      </div>

      {/* description 필드 (hidden, consult_purpose와 동기화) */}
      <input type="hidden" {...register("description")} />

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

