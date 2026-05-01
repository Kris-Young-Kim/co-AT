/**
 * 일정 관리 공통 상수 및 유틸리티
 */

export const SCHEDULE_TYPES = {
  VISIT: "visit",
  CONSULT: "consult",
  ASSESSMENT: "assessment",
  DELIVERY: "delivery",
  PICKUP: "pickup",
  EXHIBITION: "exhibition",
  EDUCATION: "education",
  CUSTOM_MAKE: "custom_make",
  MEETING: "meeting",
  EXTERNAL_EVENT: "external_event",
} as const

export type ScheduleType = typeof SCHEDULE_TYPES[keyof typeof SCHEDULE_TYPES]

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  visit: "방문",
  consult: "상담",
  assessment: "평가",
  delivery: "배송",
  pickup: "픽업",
  exhibition: "견학",
  education: "교육",
  custom_make: "맞춤제작",
  meeting: "회의",
  external_event: "외부행사",
}

export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, string> = {
  visit: "bg-blue-100 text-blue-800 border-blue-200",
  consult: "bg-green-100 text-green-800 border-green-200",
  assessment: "bg-purple-100 text-purple-800 border-purple-200",
  delivery: "bg-orange-100 text-orange-800 border-orange-200",
  pickup: "bg-yellow-100 text-yellow-800 border-yellow-200",
  exhibition: "bg-pink-100 text-pink-800 border-pink-200",
  education: "bg-indigo-100 text-indigo-800 border-indigo-200",
  custom_make: "bg-teal-100 text-teal-800 border-teal-200",
  meeting: "bg-slate-100 text-slate-800 border-slate-200",
  external_event: "bg-cyan-100 text-cyan-800 border-cyan-200",
}

// 공개 달력에 표시될 유형들
export const PUBLIC_SCHEDULE_TYPES: ScheduleType[] = [
  SCHEDULE_TYPES.EXHIBITION,
  SCHEDULE_TYPES.EDUCATION,
  SCHEDULE_TYPES.EXTERNAL_EVENT,
]

/**
 * 일정 유형에 따른 라벨 반환
 */
export function getScheduleLabel(type: string): string {
  return SCHEDULE_TYPE_LABELS[type as ScheduleType] || type
}

/**
 * 일정 유형에 따른 스타일 클래스 반환
 */
export function getScheduleColorClass(type: string): string {
  return SCHEDULE_TYPE_COLORS[type as ScheduleType] || "bg-gray-100 text-gray-800"
}

/**
 * 공개 일정 여부 확인
 */
export function isPublicSchedule(type: string): boolean {
  return PUBLIC_SCHEDULE_TYPES.includes(type as ScheduleType)
}
