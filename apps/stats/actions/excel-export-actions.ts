'use server'

import { utils, write } from 'xlsx'
import { getStatsSummary } from './stats-actions'
import { getAnnualTarget } from './annual-target-actions'
import { getMonthlyStats } from './stats-actions'
import { getCallLogMonthlyCount } from './call-log-actions'

export async function generateReportExcel(year: number): Promise<{
  success: boolean
  buffer?: number[]
  filename?: string
  error?: string
}> {
  try {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const [summaryResult, targetResult, monthlyResult, callResult] = await Promise.all([
      getStatsSummary(startDate, endDate),
      getAnnualTarget(year),
      getMonthlyStats(year),
      getCallLogMonthlyCount(year),
    ])

    const target = targetResult.success ? targetResult.target : null
    const monthly = monthlyResult.success ? monthlyResult.stats ?? [] : []
    const callMonthly = callResult.success ? callResult.monthly ?? [] : []
    const ccMap = Object.fromEntries(callMonthly.map(c => [c.month, c.count]))

    const wb = utils.book_new()

    // Sheet 1: KPI Summary
    const actual = summaryResult.success ? summaryResult.summary.businessSummary : null

    const kpiRows = [
      ['사업 내용', '목표', '실적', '달성률'],
      ['보조기기 상담(연인원)', target?.consultation ?? 0, actual?.consultation ?? 0, rate(actual?.consultation ?? 0, target?.consultation ?? 0)],
      ['콜센터', '상시', callResult.success ? callResult.total ?? 0 : 0, '상시'],
      ['보조기기 사용 체험', target?.experience ?? 0, actual?.experience ?? 0, rate(actual?.experience ?? 0, target?.experience ?? 0)],
      ['대여', target?.rental ?? 0, actual?.custom ?? 0, rate(actual?.custom ?? 0, target?.rental ?? 0)],
      ['보조기기 맞춤 제작 지원', target?.custom_make ?? 0, actual?.custom ?? 0, rate(actual?.custom ?? 0, target?.custom_make ?? 0)],
      ['교부사업 맞춤형 평가지원', '상시', actual?.custom ?? 0, '상시'],
      ['보조기기 소독 및 세척', target?.cleaning ?? 0, actual?.aftercare ?? 0, rate(actual?.aftercare ?? 0, target?.cleaning ?? 0)],
      ['보조기기 점검 및 수리', target?.repair ?? 0, actual?.aftercare ?? 0, rate(actual?.aftercare ?? 0, target?.repair ?? 0)],
      ['보조기기 재사용 지원', target?.reuse ?? 0, actual?.aftercare ?? 0, rate(actual?.aftercare ?? 0, target?.reuse ?? 0)],
      ['전문인력 교육 등', target?.professional_edu ?? 0, actual?.education ?? 0, rate(actual?.education ?? 0, target?.professional_edu ?? 0)],
      ['홍보', target?.promotion ?? 0, actual?.education ?? 0, rate(actual?.education ?? 0, target?.promotion ?? 0)],
    ]
    utils.book_append_sheet(wb, utils.aoa_to_sheet(kpiRows), `${year}년 목표대비실적`)

    // Sheet 2: Monthly Stats
    const monthlyRows = [
      ['월', '콜센터', 'I.상담·정보', 'II.체험', 'III.맞춤형', 'IV.사후관리', 'V.교육·홍보', '합계'],
      ...monthly.map(s => [
        `${s.month}월`,
        ccMap[s.month] ?? 0,
        s.consultation,
        s.experience,
        s.custom,
        s.aftercare,
        s.education,
        s.total,
      ]),
    ]
    utils.book_append_sheet(wb, utils.aoa_to_sheet(monthlyRows), '월별현황')

    const buf = write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return {
      success: true,
      buffer: Array.from(buf),
      filename: `${year}년_사업실적_보고.xlsx`,
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

function rate(actual: number, target: number | null | undefined): string {
  if (!target) return '—'
  return `${Math.round((actual / target) * 100)}%`
}
