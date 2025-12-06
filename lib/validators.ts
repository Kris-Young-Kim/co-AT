import { z } from "zod"

// 서비스 카테고리 타입
export const serviceCategorySchema = z.enum([
  "consult",
  "experience",
  "custom",
  "aftercare",
  "education",
])

// 서비스 세부 카테고리 타입
export const serviceSubCategorySchema = z.enum([
  "repair",
  "rental",
  "custom_make",
  "visit",
  "exhibition",
  "cleaning",
  "reuse",
])

// 공통 신청 폼 스키마
export const baseApplicationSchema = z.object({
  category: serviceCategorySchema,
  sub_category: serviceSubCategorySchema.optional(),
  desired_date: z.date().optional(),
  description: z.string().min(10, "10자 이상 입력해주세요").max(5000),
  contact: z.string().min(10, "연락처를 정확히 입력해주세요"),
  address: z.string().optional(),
})

// 수리 신청 폼 스키마
export const repairApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("aftercare"),
  sub_category: z.literal("repair"),
  device_name: z.string().min(1, "기기명을 입력해주세요"),
  device_model: z.string().optional(),
  issue_description: z.string().min(10, "문제 상황을 10자 이상 입력해주세요"),
  images: z.array(z.string().url()).optional(),
})

// 대여 신청 폼 스키마
export const rentalApplicationSchema = baseApplicationSchema.extend({
  category: z.enum(["experience", "custom"]),
  sub_category: z.literal("rental"),
  device_name: z.string().min(1, "대여를 원하는 기기명을 입력해주세요"),
  rental_start_date: z.date(),
  rental_end_date: z.date(),
  purpose: z.string().min(10, "대여 목적을 10자 이상 입력해주세요"),
}).refine(
  (data) => data.rental_end_date >= data.rental_start_date,
  {
    message: "종료일은 시작일 이후여야 합니다",
    path: ["rental_end_date"],
  }
)

// 상담 신청 폼 스키마
export const consultApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("consult"),
  sub_category: z.enum(["visit", "exhibition"]).optional(),
  consult_type: z.enum(["phone", "visit", "center"]),
  preferred_time: z.string().optional(),
  consult_purpose: z.string().min(10, "상담 목적을 10자 이상 입력해주세요"),
})

// 맞춤제작 신청 폼 스키마
export const customApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("custom"),
  sub_category: z.literal("custom_make"),
  device_name: z.string().min(1, "제작을 원하는 기기명을 입력해주세요"),
  specifications: z.string().min(10, "제작 사양을 10자 이상 입력해주세요"),
  measurements: z.string().optional(),
  images: z.array(z.string().url()).optional(),
})

// 타입 추출
export type ServiceCategory = z.infer<typeof serviceCategorySchema>
export type ServiceSubCategory = z.infer<typeof serviceSubCategorySchema>
export type BaseApplicationForm = z.infer<typeof baseApplicationSchema>
export type RepairApplicationForm = z.infer<typeof repairApplicationSchema>
export type RentalApplicationForm = z.infer<typeof rentalApplicationSchema>
export type ConsultApplicationForm = z.infer<typeof consultApplicationSchema>
export type CustomApplicationForm = z.infer<typeof customApplicationSchema>

// 통합 신청 폼 타입 (유니온)
export type ApplicationForm =
  | RepairApplicationForm
  | RentalApplicationForm
  | ConsultApplicationForm
  | CustomApplicationForm

