export type ReferrerType =
  | 'hospital'
  | 'health_center'
  | 'welfare_center'
  | 'school'
  | 'local_gov'
  | 'agency'
  | 'il_center'
  | 'at_medical'
  | 'individual'

export const REFERRER_TYPE_LABELS: Record<ReferrerType, string> = {
  hospital:      '병원/의원',
  health_center: '보건소',
  welfare_center:'복지관',
  school:        '학교/특수학교',
  local_gov:     '지자체',
  agency:        '공단/기관',
  il_center:     'IL센터',
  at_medical:    '장애인보건의료센터',
  individual:    '개인(자가접수)',
}

export type ActivityType = 'mou' | 'education' | 'visit' | 'consultation' | 'other'
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  mou:          'MOU 체결',
  education:    '합동 교육',
  visit:        '방문',
  consultation: '자문',
  other:        '기타',
}
