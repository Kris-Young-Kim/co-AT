/** Shared label maps for UI display — import instead of re-declaring inline */

export const CATEGORY_LABELS: Record<string, string> = {
  consult: '상담',
  experience: '체험',
  custom: '맞춤형',
  aftercare: '사후관리',
  education: '교육/홍보',
}

export const SUB_CATEGORY_LABELS: Record<string, string> = {
  repair: '수리',
  rental: '대여',
  custom_make: '제작',
  visit: '방문',
  exhibition: '전시',
  cleaning: '소독/세척',
  reuse: '재사용',
}

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  visit: '방문',
  consultation: '상담',
  consult: '상담',
  assessment: '평가',
  delivery: '배송',
  pickup: '픽업',
  exhibition: '전시·체험',
  education: '교육',
}

/** General service-record types (eval app) */
export const SERVICE_RECORD_TYPE_LABELS: Record<string, string> = {
  repair: '수리',
  custom_make: '제작',
  rental: '대여',
  education: '교육',
  cleaning: '소독/세척',
  consult: '상담',
  assessment: '평가',
  reuse: '재사용',
}

/** Appointment (booking) service types */
export const APPOINTMENT_SERVICE_LABELS: Record<string, string> = {
  consult: '보조기기 상담',
  assessment: '보조기기 평가',
  exhibition: '체험·전시',
  etc: '기타 문의',
}

/** Application-to-schedule type mapping */
export const SCHEDULE_TYPE_BY_CATEGORY: Record<
  string,
  'visit' | 'consult' | 'assessment' | 'delivery' | 'pickup' | 'exhibition' | 'education'
> = {
  consult: 'consult',
  experience: 'exhibition',
  custom: 'assessment',
  aftercare: 'visit',
  education: 'education',
}
