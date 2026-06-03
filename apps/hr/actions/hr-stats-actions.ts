'use server'

import { createSupabaseAdmin } from '@/lib/supabase-admin'
import type {
  HrStatsSummary,
  HrHeadcountByDept,
  HrEmploymentTypeCount,
  HrMonthlyTrend,
  HrTenureBucket,
  HrEmployee,
} from '@co-at/types'

type Result<T> = { success: true; data: T } | { success: false; error: string }

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: '정규직',
  part_time: '시간제',
  contract:  '계약직',
  daily:     '일용직',
}

export async function getHrStats(): Promise<Result<{
  summary:          HrStatsSummary
  headcountByDept:  HrHeadcountByDept[]
  employmentTypes:  HrEmploymentTypeCount[]
  monthlyTrend:     HrMonthlyTrend[]
  tenureBuckets:    HrTenureBucket[]
}>> {
  try {
    const supabase = createSupabaseAdmin()
    const thisYear = new Date().getFullYear()
    const today = new Date()

    const { data: employees, error } = await supabase
      .from('hr_employees')
      .select('id,department,employment_type,hire_date,leave_date,is_active')
      .order('hire_date')

    if (error) return { success: false, error: error.message }

    const all = (employees ?? []) as Pick<
      HrEmployee,
      'id' | 'department' | 'employment_type' | 'hire_date' | 'leave_date' | 'is_active'
    >[]
    const active = all.filter(e => e.is_active)

    // Summary
    const newHiresThisYear = all.filter(e => e.hire_date?.startsWith(String(thisYear))).length
    const leavesThisYear   = all.filter(e => e.leave_date?.startsWith(String(thisYear))).length

    const avgTenureYears = active.length
      ? active.reduce((sum, e) => {
          const hire = new Date(e.hire_date)
          const ms   = today.getTime() - hire.getTime()
          return sum + ms / (1000 * 60 * 60 * 24 * 365.25)
        }, 0) / active.length
      : 0

    const summary: HrStatsSummary = {
      totalActive: active.length,
      newHiresThisYear,
      leavesThisYear,
      avgTenureYears: Math.round(avgTenureYears * 10) / 10,
    }

    // Headcount by department
    const deptMap = new Map<string, number>()
    for (const e of active) {
      const dept = e.department || '미분류'
      deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1)
    }
    const headcountByDept: HrHeadcountByDept[] = [...deptMap.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)

    // Employment type
    const typeMap = new Map<string, number>()
    for (const e of active) {
      const t = e.employment_type || 'full_time'
      typeMap.set(t, (typeMap.get(t) ?? 0) + 1)
    }
    const employmentTypes: HrEmploymentTypeCount[] = [...typeMap.entries()].map(([type, count]) => ({
      type,
      label: EMPLOYMENT_LABELS[type] ?? type,
      count,
    }))

    // Monthly hire/leave trend (last 12 months)
    const monthlyTrend: HrMonthlyTrend[] = []
    for (let i = 11; i >= 0; i--) {
      const d     = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const hires  = all.filter(e => e.hire_date?.startsWith(month)).length
      const leaves = all.filter(e => e.leave_date?.startsWith(month)).length
      monthlyTrend.push({ month, hires, leaves })
    }

    // Tenure distribution (active employees)
    const buckets = [
      { range: '1년 미만',  min: 0,   max: 1   },
      { range: '1~3년',    min: 1,   max: 3   },
      { range: '3~5년',    min: 3,   max: 5   },
      { range: '5~10년',   min: 5,   max: 10  },
      { range: '10년 이상', min: 10,  max: Infinity },
    ]
    const tenureBuckets: HrTenureBucket[] = buckets.map(b => {
      const count = active.filter(e => {
        const years = (today.getTime() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        return years >= b.min && years < b.max
      }).length
      return { range: b.range, count }
    })

    return {
      success: true,
      data: { summary, headcountByDept, employmentTypes, monthlyTrend, tenureBuckets },
    }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
