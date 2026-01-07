"use server"

import { createClient } from "@/lib/supabase/server"
import { hasAdminOrStaffPermission } from "@/lib/utils/permissions"

/**
 * 월별 통계 데이터
 */
export interface MonthlyStats {
  year: number
  month: number
  monthLabel: string // "2025년 1월"
  // 5대 사업별 건수
  consultation: number
  experience: number
  custom: number
  aftercare: number
  education: number
  // 전체 합계
  total: number
}

/**
 * 연도별 통계 데이터
 */
export interface YearlyStats {
  year: number
  // 5대 사업별 건수
  consultation: number
  experience: number
  custom: number
  aftercare: number
  education: number
  // 전체 합계
  total: number
}

/**
 * 사업별 상세 통계
 */
export interface BusinessDetailStats {
  category: string
  categoryLabel: string
  // 상태별 건수
  received: number // 접수
  inProgress: number // 진행
  completed: number // 완료
  cancelled: number // 취소
  // 전체 합계
  total: number
  // 세부 카테고리별 건수
  subCategories: {
    subCategory: string
    label: string
    count: number
  }[]
}

/**
 * 전체 통계 요약
 */
export interface StatsSummary {
  // 기간 정보
  period: {
    startDate: string
    endDate: string
    type: "monthly" | "yearly" | "custom"
  }
  // 전체 요약
  totalApplications: number
  totalClients: number
  totalCompleted: number
  completionRate: number // 완료율 (%)
  // 5대 사업별 요약
  businessSummary: {
    consultation: number
    experience: number
    custom: number
    aftercare: number
    education: number
  }
  // 월별/연도별 통계
  monthlyStats?: MonthlyStats[]
  yearlyStats?: YearlyStats[]
  // 사업별 상세 통계
  businessDetails: BusinessDetailStats[]
}

/**
 * 월별 통계 조회
 */
export async function getMonthlyStats(
  year: number
): Promise<{
  success: boolean
  stats?: MonthlyStats[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const yearStart = new Date(year, 0, 1).toISOString()
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999).toISOString()

    // 해당 연도의 모든 신청서 조회
    const { data: applications, error } = await supabase
      .from("applications")
      .select("id, category, created_at")
      .gte("created_at", yearStart)
      .lte("created_at", yearEnd)

    if (error) {
      console.error("[Stats] 월별 통계 조회 실패:", error)
      return { success: false, error: "월별 통계 조회에 실패했습니다" }
    }

    // 월별로 그룹화
    const monthlyData: Record<number, MonthlyStats> = {}

    for (let month = 0; month < 12; month++) {
      const monthLabel = `${year}년 ${month + 1}월`
      monthlyData[month] = {
        year,
        month: month + 1,
        monthLabel,
        consultation: 0,
        experience: 0,
        custom: 0,
        aftercare: 0,
        education: 0,
        total: 0,
      }
    }

    // 신청서를 월별로 집계
    applications?.forEach((app: any) => {
      const date = new Date(app.created_at || "")
      const month = date.getMonth()
      const category = app.category

      if (monthlyData[month]) {
        monthlyData[month].total++
        if (category === "consult") monthlyData[month].consultation++
        else if (category === "experience") monthlyData[month].experience++
        else if (category === "custom") monthlyData[month].custom++
        else if (category === "aftercare") monthlyData[month].aftercare++
        else if (category === "education") monthlyData[month].education++
      }
    })

    const stats = Object.values(monthlyData)

    return { success: true, stats }
  } catch (error) {
    console.error("[Stats] 월별 통계 조회 중 오류:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 연도별 통계 조회
 */
export async function getYearlyStats(
  startYear: number,
  endYear: number
): Promise<{
  success: boolean
  stats?: YearlyStats[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    const startDate = new Date(startYear, 0, 1).toISOString()
    const endDate = new Date(endYear, 11, 31, 23, 59, 59, 999).toISOString()

    // 해당 기간의 모든 신청서 조회
    const { data: applications, error } = await supabase
      .from("applications")
      .select("id, category, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (error) {
      console.error("[Stats] 연도별 통계 조회 실패:", error)
      return { success: false, error: "연도별 통계 조회에 실패했습니다" }
    }

    // 연도별로 그룹화
    const yearlyData: Record<number, YearlyStats> = {}

    for (let year = startYear; year <= endYear; year++) {
      yearlyData[year] = {
        year,
        consultation: 0,
        experience: 0,
        custom: 0,
        aftercare: 0,
        education: 0,
        total: 0,
      }
    }

    // 신청서를 연도별로 집계
    applications?.forEach((app: any) => {
      const date = new Date(app.created_at)
      const year = date.getFullYear()
      const category = app.category

      if (yearlyData[year]) {
        yearlyData[year].total++
        if (category === "consult") yearlyData[year].consultation++
        else if (category === "experience") yearlyData[year].experience++
        else if (category === "custom") yearlyData[year].custom++
        else if (category === "aftercare") yearlyData[year].aftercare++
        else if (category === "education") yearlyData[year].education++
      }
    })

    const stats = Object.values(yearlyData)

    return { success: true, stats }
  } catch (error) {
    console.error("[Stats] 연도별 통계 조회 중 오류:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 사업별 상세 통계 조회
 */
export async function getBusinessDetailStats(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean
  stats?: BusinessDetailStats[]
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 해당 기간의 모든 신청서 조회
    const { data: applications, error } = await supabase
      .from("applications")
      .select("id, category, sub_category, status")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (error) {
      console.error("[Stats] 사업별 상세 통계 조회 실패:", error)
      return { success: false, error: "사업별 상세 통계 조회에 실패했습니다" }
    }

    // 카테고리별 라벨 매핑
    const categoryLabels: Record<string, string> = {
      consult: "I. 상담 및 정보제공사업",
      experience: "II. 체험사업",
      custom: "III. 맞춤형 지원사업",
      aftercare: "IV. 사후관리 지원사업",
      education: "V. 교육 및 홍보사업",
    }

    // 세부 카테고리 라벨 매핑
    const subCategoryLabels: Record<string, string> = {
      visit: "방문 상담",
      exhibition: "견학",
      rental: "대여",
      custom_make: "맞춤 제작",
      repair: "수리",
      cleaning: "소독/세척",
      reuse: "재사용",
      education: "교육",
      promotion: "홍보",
    }

    // 카테고리별로 그룹화
    const categoryData: Record<string, BusinessDetailStats> = {}

    // 초기화
    const categories = ["consult", "experience", "custom", "aftercare", "education"]
    categories.forEach((cat) => {
      categoryData[cat] = {
        category: cat,
        categoryLabel: categoryLabels[cat] || cat,
        received: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
        subCategories: [],
      }
    })

    // 신청서 집계
    const subCategoryCounts: Record<string, Record<string, number>> = {}

    applications?.forEach((app: any) => {
      const category = app.category
      if (!category || !categoryData[category]) return

      categoryData[category].total++

      // 상태별 집계
      const status = app.status
      if (status === "접수") categoryData[category].received++
      else if (status === "진행") categoryData[category].inProgress++
      else if (status === "완료") categoryData[category].completed++
      else if (status === "취소") categoryData[category].cancelled++

      // 세부 카테고리별 집계
      const subCategory = app.sub_category
      if (subCategory) {
        if (!subCategoryCounts[category]) {
          subCategoryCounts[category] = {}
        }
        subCategoryCounts[category][subCategory] =
          (subCategoryCounts[category][subCategory] || 0) + 1
      }
    })

    // 세부 카테고리 데이터 추가
    Object.keys(categoryData).forEach((category) => {
      const subCats = subCategoryCounts[category] || {}
      categoryData[category].subCategories = Object.entries(subCats).map(
        ([subCategory, count]) => ({
          subCategory,
          label: subCategoryLabels[subCategory] || subCategory,
          count,
        })
      )
    })

    const stats = Object.values(categoryData)

    return { success: true, stats }
  } catch (error) {
    console.error("[Stats] 사업별 상세 통계 조회 중 오류:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}

/**
 * 전체 통계 요약 조회
 */
export async function getStatsSummary(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean
  summary?: StatsSummary
  error?: string
}> {
  try {
    const hasPermission = await hasAdminOrStaffPermission()
    if (!hasPermission) {
      return { success: false, error: "권한이 없습니다" }
    }

    const supabase = await createClient()

    // 해당 기간의 모든 신청서 조회
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("id, category, status, client_id")
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (appsError) {
      console.error("[Stats] 신청서 조회 실패:", appsError)
      return { success: false, error: "통계 조회에 실패했습니다" }
    }

    // 고유 대상자 수 조회
    const uniqueClientIds = new Set(
      applications?.map((app: any) => app.client_id).filter(Boolean) || []
    )

    // 전체 통계 계산
    const totalApplications = applications?.length || 0
    const totalClients = uniqueClientIds.size
    const totalCompleted =
      applications?.filter((app: any) => app.status === "완료").length || 0
    const completionRate =
      totalApplications > 0 ? (totalCompleted / totalApplications) * 100 : 0

    // 5대 사업별 집계
    const businessSummary = {
      consultation: 0,
      experience: 0,
      custom: 0,
      aftercare: 0,
      education: 0,
    }

    applications?.forEach((app: any) => {
      const category = app.category
      if (category === "consult") businessSummary.consultation++
      else if (category === "experience") businessSummary.experience++
      else if (category === "custom") businessSummary.custom++
      else if (category === "aftercare") businessSummary.aftercare++
      else if (category === "education") businessSummary.education++
    })

    // 사업별 상세 통계
    const businessDetailsResult = await getBusinessDetailStats(startDate, endDate)
    const businessDetails = businessDetailsResult.stats || []

    // 기간 타입 판단
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    let periodType: "monthly" | "yearly" | "custom" = "custom"
    if (daysDiff <= 31) periodType = "monthly"
    else if (daysDiff <= 365) periodType = "yearly"

    const summary: StatsSummary = {
      period: {
        startDate,
        endDate,
        type: periodType,
      },
      totalApplications,
      totalClients,
      totalCompleted,
      completionRate: Math.round(completionRate * 100) / 100,
      businessSummary,
      businessDetails,
    }

    return { success: true, summary }
  } catch (error) {
    console.error("[Stats] 통계 요약 조회 중 오류:", error)
    return { success: false, error: "예상치 못한 오류가 발생했습니다" }
  }
}
