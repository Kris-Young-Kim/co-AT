"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { customApplicationSchema, type CustomApplicationForm } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"

export function ServiceCustomForm() {
  const { formData, setFormData, setCurrentStep } = useApplicationStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomApplicationForm>({
    resolver: zodResolver(customApplicationSchema),
    defaultValues: {
      category: "custom",
      sub_category: "custom_make",
      ...formData,
    } as Partial<CustomApplicationForm>,
  })

  const onSubmit = async (data: CustomApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="device_name">제작을 원하는 기기명 *</Label>
        <Input
          id="device_name"
          {...register("device_name")}
          placeholder="예: 맞춤형 휠체어, 목발 등"
          aria-invalid={errors.device_name ? "true" : "false"}
        />
        {errors.device_name && (
          <p className="text-sm text-destructive" role="alert">
            {errors.device_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specifications">제작 사양 *</Label>
        <Textarea
          id="specifications"
          {...register("specifications")}
          placeholder="제작 사양을 자세히 설명해주세요 (10자 이상)"
          rows={5}
          aria-invalid={errors.specifications ? "true" : "false"}
        />
        {errors.specifications && (
          <p className="text-sm text-destructive" role="alert">
            {errors.specifications.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="measurements">치수 정보 (선택사항)</Label>
        <Textarea
          id="measurements"
          {...register("measurements")}
          placeholder="필요한 치수 정보를 입력해주세요"
          rows={3}
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
        />
        {errors.contact && (
          <p className="text-sm text-destructive" role="alert">
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
        />
        {errors.description && (
          <p className="text-sm text-destructive" role="alert">
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

