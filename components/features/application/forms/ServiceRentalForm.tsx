"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { rentalApplicationSchema, type RentalApplicationForm } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useApplicationStore } from "@/lib/stores/application-store"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function ServiceRentalForm() {
  const { formData, setFormData, setCurrentStep, selectedCategory } = useApplicationStore()
  const [rentalStartDate, setRentalStartDate] = useState<Date | undefined>(
    (formData as any)?.rental_start_date ? new Date((formData as any).rental_start_date) : undefined
  )
  const [rentalEndDate, setRentalEndDate] = useState<Date | undefined>(
    (formData as any)?.rental_end_date ? new Date((formData as any).rental_end_date) : undefined
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RentalApplicationForm>({
    resolver: zodResolver(rentalApplicationSchema),
    defaultValues: {
      category: (selectedCategory as "experience" | "custom") || "experience",
      sub_category: "rental",
      ...formData,
    } as Partial<RentalApplicationForm>,
  })

  const onSubmit = async (data: RentalApplicationForm) => {
    setFormData(data)
    setCurrentStep(3)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="device_name">대여를 원하는 기기명 *</Label>
        <Input
          id="device_name"
          {...register("device_name")}
          placeholder="예: 휠체어, 목발 등"
          aria-invalid={errors.device_name ? "true" : "false"}
        />
        {errors.device_name && (
          <p className="text-sm text-destructive" role="alert">
            {errors.device_name.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rental_start_date">대여 시작일 *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !rentalStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {rentalStartDate ? (
                  format(rentalStartDate, "yyyy년 MM월 dd일", { locale: ko })
                ) : (
                  <span>시작일 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={rentalStartDate}
                onSelect={(date) => {
                  setRentalStartDate(date)
                  setValue("rental_start_date", date!)
                }}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {errors.rental_start_date && (
            <p className="text-sm text-destructive" role="alert">
              {errors.rental_start_date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rental_end_date">대여 종료일 *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !rentalEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {rentalEndDate ? (
                  format(rentalEndDate, "yyyy년 MM월 dd일", { locale: ko })
                ) : (
                  <span>종료일 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={rentalEndDate}
                onSelect={(date) => {
                  setRentalEndDate(date)
                  setValue("rental_end_date", date!)
                }}
                disabled={(date) => rentalStartDate ? date < rentalStartDate : false}
                locale={ko}
              />
            </PopoverContent>
          </Popover>
          {errors.rental_end_date && (
            <p className="text-sm text-destructive" role="alert">
              {errors.rental_end_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">대여 목적 *</Label>
        <Textarea
          id="purpose"
          {...register("purpose")}
          placeholder="대여 목적을 자세히 설명해주세요 (10자 이상)"
          rows={4}
          aria-invalid={errors.purpose ? "true" : "false"}
        />
        {errors.purpose && (
          <p className="text-sm text-destructive" role="alert">
            {errors.purpose.message}
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

