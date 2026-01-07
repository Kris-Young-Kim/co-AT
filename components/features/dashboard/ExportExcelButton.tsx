"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { generateBusinessReportExcel, downloadExcel } from "@/lib/utils/export-excel"
import { type StatsSummary, type MonthlyStats, type YearlyStats } from "@/actions/stats-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface ExportExcelButtonProps {
  summary: StatsSummary
  monthlyStats?: MonthlyStats[]
  yearlyStats?: YearlyStats[]
}

export function ExportExcelButton({ summary, monthlyStats, yearlyStats }: ExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Excel 워크북 생성
      const workbook = generateBusinessReportExcel(summary, monthlyStats, yearlyStats)

      // 파일명 생성
      const startDate = format(new Date(summary.period.startDate), "yyyyMMdd", { locale: ko })
      const endDate = format(new Date(summary.period.endDate), "yyyyMMdd", { locale: ko })
      const filename = `보조기기센터_사업실적보고_${startDate}_${endDate}.xlsx`

      // 다운로드
      downloadExcel(workbook, filename)
    } catch (error) {
      console.error("[Excel Export] 내보내기 실패:", error)
      alert("Excel 파일 내보내기에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          내보내는 중...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Excel 내보내기
        </>
      )}
    </Button>
  )
}
