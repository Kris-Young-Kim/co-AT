"use server"

import * as XLSX from 'xlsx'
import { getStatsSummary, getMonthlyStats } from '@/actions/stats-actions'
import { getAnnualTarget } from '@/actions/annual-target-actions'
import { getCallLogMonthlyCount } from '@/actions/call-log-actions'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'

export async function generateReportExcel(year: number): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) return { success: false, error: '권한이 없습니다' }

  const startDate = `${year}-01-01`
  const endDate   = `${year}-12-31`

  const [summaryResult, monthlyResult, targetResult, callResult] = await Promise.all([
    getStatsSummary(startDate, endDate),
    getMonthlyStats(year),
    getAnnualTarget(year),
    getCallLogMonthlyCount(year),
  ])

  if (!summaryResult.success || !summaryResult.summary) {
    return { success: false, error: '통계 데이터를 불러올 수 없습니다' }
  }

  const summary = summaryResult.summary
  const monthly = monthlyResult.success ? monthlyResult.stats ?? [] : []
  const target  = targetResult.success  ? targetResult.target ?? null : null
  const callMonthly = callResult.success ? callResult.monthly ?? [] : []
  const ccMap = Object.fromEntries(callMonthly.map(c => [c.month, c.count]))

  const wb = XLSX.utils.book_new()

  // ── 시트 1: 전체 사업 실적 ──────────────────────────────────
  const sheet1Data: (string | number)[][] = [
    [`${year}년 보조기기센터 사업 실적 보고`],
    [],
    ['사업내용', '목표', '실적', '달성률'],
    ['보조기기 상담(연인원)', target?.consultation ?? '—', summary.totalApplications,
      target?.consultation ? `${Math.round(summary.totalApplications / target.consultation * 100)}%` : '—'],
    ['콜센터', '상시', callResult.total ?? 0, '상시'],
    ['보조기기 사용 체험', target?.experience ?? '—', summary.businessSummary.experience,
      target?.experience ? `${Math.round(summary.businessSummary.experience / target.experience * 100)}%` : '—'],
    ['대여', target?.rental ?? '—', summary.businessSummary.custom, '—'],
    ['보조기기 맞춤 제작 지원', target?.custom_make ?? '—', summary.businessSummary.custom, '—'],
    ['교부사업 맞춤형 평가지원', '상시', 0, '상시'],
    ['보조기기 소독 및 세척', target?.cleaning ?? '—', summary.businessSummary.aftercare, '—'],
    ['보조기기 점검 및 수리', target?.repair ?? '—', summary.businessSummary.aftercare, '—'],
    ['보조기기 재사용 지원', target?.reuse ?? '—', summary.businessSummary.aftercare, '—'],
    ['전문인력 교육 등', target?.professional_edu ?? '—', summary.businessSummary.education, '—'],
    ['홍보', target?.promotion ?? '—', summary.businessSummary.education, '—'],
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data)
  ws1['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws1, '전체 사업 실적')

  // ── 시트 2: 월별 현황 ───────────────────────────────────────
  const sheet2Data: (string | number)[][] = [
    [`${year}년 월별 서비스 현황`],
    [],
    ['월', '콜센터', 'I.상담·정보', 'II.체험', 'III.맞춤형', 'IV.사후관리', 'V.교육·홍보', '합계'],
    ...monthly.map(m => [
      `${m.month}월`,
      ccMap[m.month] ?? 0,
      m.consultation, m.experience, m.custom, m.aftercare, m.education, m.total,
    ]),
    ['합계',
      Object.values(ccMap).reduce((a, b) => a + b, 0),
      monthly.reduce((s, m) => s + m.consultation, 0),
      monthly.reduce((s, m) => s + m.experience, 0),
      monthly.reduce((s, m) => s + m.custom, 0),
      monthly.reduce((s, m) => s + m.aftercare, 0),
      monthly.reduce((s, m) => s + m.education, 0),
      monthly.reduce((s, m) => s + m.total, 0),
    ],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data)
  ws2['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, ws2, '월별 현황')

  // 버퍼 생성 — Server Action은 Buffer/Uint8Array 직렬화 불가 → number[] 변환
  const raw = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  const buffer = Array.from(raw as Uint8Array)
  const filename = `${year}년_보조기기센터_사업실적.xlsx`

  return { success: true, buffer, filename }
}
