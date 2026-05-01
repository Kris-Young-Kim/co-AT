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
  "education",
  "promotion",
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

// 재사용 신청 폼 스키마
export const reuseApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("aftercare"),
  sub_category: z.literal("reuse"),
  reuse_type: z.enum(["donate", "receive"]),
  device_name: z.string().min(1, "기기명을 입력해주세요"),
  device_condition: z.string().optional(),
  pickup_address: z.string().optional(),
  purpose: z.string().optional(),
}).refine(
  (data) => {
    if (data.reuse_type === "donate") {
      return data.device_condition && data.device_condition.length >= 10 && data.pickup_address && data.pickup_address.length >= 1
    }
    return true
  },
  {
    message: "기증 시 기기 상태와 수거 주소를 입력해주세요",
    path: ["device_condition"],
  }
).refine(
  (data) => {
    if (data.reuse_type === "receive") {
      return data.purpose && data.purpose.length >= 10
    }
    return true
  },
  {
    message: "수령 시 신청 목적을 10자 이상 입력해주세요",
    path: ["purpose"],
  }
)

// 소독 및 세척 신청 폼 스키마
export const cleaningApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("aftercare"),
  sub_category: z.literal("cleaning"),
  device_name: z.string().min(1, "기기명을 입력해주세요"),
  device_count: z.number().min(1, "기기 개수를 입력해주세요"),
  cleaning_type: z.enum(["basic", "deep"]),
})

// 교육 신청 폼 스키마
export const educationApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("education"),
  sub_category: z.literal("education"),
  education_type: z.enum(["user", "staff", "public_official", "professional"]),
  education_topic: z.string().min(1, "교육 주제를 입력해주세요"),
  participant_count: z.number().min(1).optional(),
  preferred_time: z.string().optional(),
  location: z.string().optional(),
})

// 홍보 신청 폼 스키마
export const promotionApplicationSchema = baseApplicationSchema.extend({
  category: z.literal("education"),
  sub_category: z.literal("promotion"),
  promotion_type: z.enum(["online", "offline", "material", "campaign"]),
  promotion_title: z.string().min(1, "홍보 제목을 입력해주세요"),
  material_type: z.string().optional(),
  location: z.string().optional(),
})

// 타입 추출
export type ServiceCategory = z.infer<typeof serviceCategorySchema>
export type ServiceSubCategory = z.infer<typeof serviceSubCategorySchema>
export type BaseApplicationForm = z.infer<typeof baseApplicationSchema>
export type RepairApplicationForm = z.infer<typeof repairApplicationSchema>
export type RentalApplicationForm = z.infer<typeof rentalApplicationSchema>
export type ConsultApplicationForm = z.infer<typeof consultApplicationSchema>
export type CustomApplicationForm = z.infer<typeof customApplicationSchema>
export type ReuseApplicationForm = z.infer<typeof reuseApplicationSchema>
export type CleaningApplicationForm = z.infer<typeof cleaningApplicationSchema>
export type EducationApplicationForm = z.infer<typeof educationApplicationSchema>
export type PromotionApplicationForm = z.infer<typeof promotionApplicationSchema>

// 통합 신청 폼 타입 (유니온)
export type ApplicationForm =
  | RepairApplicationForm
  | RentalApplicationForm
  | ConsultApplicationForm
  | CustomApplicationForm
  | ReuseApplicationForm
  | CleaningApplicationForm
  | EducationApplicationForm
  | PromotionApplicationForm

