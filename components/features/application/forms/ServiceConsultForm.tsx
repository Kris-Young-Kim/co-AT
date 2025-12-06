"use client"

import { useForm } from "react-hook-form"
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
    setValue,
    watch,
  } = useForm<ConsultApplicationForm>({
    resolver: zodResolver(consultApplicationSchema),
    defaultValues: {
      category: "consult",
      ...formData,
    } as Partial<ConsultApplicationForm>,
  })

  const consultType = watch("consult_type")

  const onSubmit = async (data: ConsultApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>상담 유형 *</Label>
        <RadioGroup
          value={consultType}
          onValueChange={(value) => setValue("consult_type", value as "phone" | "visit" | "center")}
          className="flex flex-col gap-3"
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
        {errors.consult_type && (
          <p className="text-sm text-destructive" role="alert">
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
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="preferred_time">희망 상담 시간 (선택사항)</Label>
        <Input
          id="preferred_time"
          {...register("preferred_time")}
          placeholder="예: 오전 10시 ~ 오후 2시"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consult_purpose">상담 목적 *</Label>
        <Textarea
          id="consult_purpose"
          {...register("consult_purpose")}
          placeholder="상담 목적을 자세히 설명해주세요 (10자 이상)"
          rows={5}
          aria-invalid={errors.consult_purpose ? "true" : "false"}
        />
        {errors.consult_purpose && (
          <p className="text-sm text-destructive" role="alert">
            {errors.consult_purpose.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">연락처 *</Label>
        <Input
          id="contact"
          type="tel"
          {...register("contact")}
          placeholder="010-1234-5678"
          aria-invalid={errors.contact ? "true" : "false"}
        />
        {errors.contact && (
          <p className="text-sm text-destructive" role="alert">
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

