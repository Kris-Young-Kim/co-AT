import * as XLSX from "xlsx"
import { type StatsSummary, type MonthlyStats, type YearlyStats } from "@/actions/stats-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

/**
 * 사업 실적 보고 Excel 파일 생성
 * 상위 기관 제시 양식 ([첨부 16] 사업 실적 보고)에 맞춰 생성
 */
export function generateBusinessReportExcel(
  summary: StatsSummary,
  monthlyStats?: MonthlyStats[],
  yearlyStats?: YearlyStats[]
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // 1. 표지 시트
  const coverSheet = createCoverSheet(summary)
  XLSX.utils.book_append_sheet(workbook, coverSheet, "표지")

  // 2. 전체 요약 시트
  const summarySheet = createSummarySheet(summary)
  XLSX.utils.book_append_sheet(workbook, summarySheet, "전체 요약")

  // 3. 5대 사업별 상세 시트
  const businessDetailSheet = createBusinessDetailSheet(summary)
  XLSX.utils.book_append_sheet(workbook, businessDetailSheet, "5대 사업별 상세")

  // 4. 월별 통계 시트
  if (monthlyStats && monthlyStats.length > 0) {
    const monthlySheet = createMonthlySheet(monthlyStats)
    XLSX.utils.book_append_sheet(workbook, monthlySheet, "월별 통계")
  }

  // 5. 연도별 통계 시트
  if (yearlyStats && yearlyStats.length > 0) {
    const yearlySheet = createYearlySheet(yearlyStats)
    XLSX.utils.book_append_sheet(workbook, yearlySheet, "연도별 통계")
  }

  return workbook
}

/**
 * 표지 시트 생성
 */
function createCoverSheet(summary: StatsSummary): XLSX.WorkSheet {
  const data = [
    ["보조기기센터 사업 실적 보고서"],
    [],
    ["보고 기간", `${format(new Date(summary.period.startDate), "yyyy년 MM월 dd일", { locale: ko })} ~ ${format(new Date(summary.period.endDate), "yyyy년 MM월 dd일", { locale: ko })}`],
    ["작성일", format(new Date(), "yyyy년 MM월 dd일", { locale: ko })],
    ["작성기관", "강원특별자치도 보조기기센터"],
    [],
    ["※ 본 보고서는 보조기기센터 사업 실적을 종합적으로 정리한 자료입니다."],
    ["※ 상위 기관 제시 양식([첨부 16] 사업 실적 보고)에 준하여 작성되었습니다."],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 열 너비 설정
  ws["!cols"] = [{ wch: 30 }, { wch: 50 }]
  
  return ws
}

/**
 * 전체 요약 시트 생성
 */
function createSummarySheet(summary: StatsSummary): XLSX.WorkSheet {
  const data = [
    ["보조기기센터 사업 실적 요약"],
    [],
    ["구분", "내역"],
    ["보고 기간", `${format(new Date(summary.period.startDate), "yyyy년 MM월 dd일", { locale: ko })} ~ ${format(new Date(summary.period.endDate), "yyyy년 MM월 dd일", { locale: ko })}`],
    ["전체 신청 건수", `${summary.totalApplications.toLocaleString()}건`],
    ["대상자 수", `${summary.totalClients.toLocaleString()}명`],
    ["완료 건수", `${summary.totalCompleted.toLocaleString()}건`],
    ["완료율", `${summary.completionRate.toFixed(1)}%`],
    [],
    ["5대 사업별 요약"],
    ["사업 구분", "건수"],
    ["I. 상담 및 정보제공사업", `${summary.businessSummary.consultation.toLocaleString()}건`],
    ["II. 체험사업", `${summary.businessSummary.experience.toLocaleString()}건`],
    ["III. 맞춤형 지원사업", `${summary.businessSummary.custom.toLocaleString()}건`],
    ["IV. 사후관리 지원사업", `${summary.businessSummary.aftercare.toLocaleString()}건`],
    ["V. 교육 및 홍보사업", `${summary.businessSummary.education.toLocaleString()}건`],
    ["합계", `${Object.values(summary.businessSummary).reduce((a, b) => a + b, 0).toLocaleString()}건`],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 열 너비 설정
  ws["!cols"] = [{ wch: 30 }, { wch: 20 }]
  
  return ws
}

/**
 * 5대 사업별 상세 시트 생성
 */
function createBusinessDetailSheet(summary: StatsSummary): XLSX.WorkSheet {
  const data = [
    ["5대 사업별 상세 실적"],
    [],
    ["사업 구분", "접수", "진행", "완료", "취소", "합계", "비고"],
  ]

  summary.businessDetails.forEach((business) => {
    data.push([
      business.categoryLabel,
      business.received,
      business.inProgress,
      business.completed,
      business.cancelled,
      business.total,
      "",
    ])

    // 세부 카테고리별 통계
    if (business.subCategories.length > 0) {
      business.subCategories.forEach((subCat) => {
        data.push([
          `  └ ${subCat.label}`,
          "",
          "",
          "",
          "",
          subCat.count,
          "",
        ])
      })
    }
  })

  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 열 너비 설정
  ws["!cols"] = [{ wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 20 }]
  
  return ws
}

/**
 * 월별 통계 시트 생성
 */
function createMonthlySheet(monthlyStats: MonthlyStats[]): XLSX.WorkSheet {
  const data = [
    ["월별 사업 실적 통계"],
    [],
    [
      "월",
      "I. 상담 및 정보제공",
      "II. 체험",
      "III. 맞춤형 지원",
      "IV. 사후관리",
      "V. 교육 및 홍보",
      "합계",
    ],
  ]

  monthlyStats.forEach((stat) => {
    data.push([
      stat.monthLabel,
      stat.consultation,
      stat.experience,
      stat.custom,
      stat.aftercare,
      stat.education,
      stat.total,
    ])
  })

  // 합계 행 추가
  const totals = monthlyStats.reduce(
    (acc, stat) => ({
      consultation: acc.consultation + stat.consultation,
      experience: acc.experience + stat.experience,
      custom: acc.custom + stat.custom,
      aftercare: acc.aftercare + stat.aftercare,
      education: acc.education + stat.education,
      total: acc.total + stat.total,
    }),
    { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }
  )

  data.push([
    "합계",
    totals.consultation,
    totals.experience,
    totals.custom,
    totals.aftercare,
    totals.education,
    totals.total,
  ])

  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 열 너비 설정
  ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  
  return ws
}

/**
 * 연도별 통계 시트 생성
 */
function createYearlySheet(yearlyStats: YearlyStats[]): XLSX.WorkSheet {
  const data = [
    ["연도별 사업 실적 통계"],
    [],
    [
      "연도",
      "I. 상담 및 정보제공",
      "II. 체험",
      "III. 맞춤형 지원",
      "IV. 사후관리",
      "V. 교육 및 홍보",
      "합계",
    ],
  ]

  yearlyStats.forEach((stat) => {
    data.push([
      `${stat.year}년`,
      stat.consultation,
      stat.experience,
      stat.custom,
      stat.aftercare,
      stat.education,
      stat.total,
    ])
  })

  // 합계 행 추가
  const totals = yearlyStats.reduce(
    (acc, stat) => ({
      consultation: acc.consultation + stat.consultation,
      experience: acc.experience + stat.experience,
      custom: acc.custom + stat.custom,
      aftercare: acc.aftercare + stat.aftercare,
      education: acc.education + stat.education,
      total: acc.total + stat.total,
    }),
    { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }
  )

  data.push([
    "합계",
    totals.consultation,
    totals.experience,
    totals.custom,
    totals.aftercare,
    totals.education,
    totals.total,
  ])

  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // 열 너비 설정
  ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  
  return ws
}

/**
 * Excel 파일 다운로드
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename)
}
