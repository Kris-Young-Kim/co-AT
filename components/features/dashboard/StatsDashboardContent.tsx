"use client"

import { useState, useEffect } from "react"
import { StatsChart } from "./StatsChart"
import { StatsSummaryCard } from "./StatsSummaryCard"
import { BusinessDetailTable } from "./BusinessDetailTable"
import { ExportExcelButton } from "./ExportExcelButton"
import {
  getMonthlyStats,
  getYearlyStats,
  getStatsSummary,
  type MonthlyStats,
  type YearlyStats,
  type StatsSummary,
} from "@/actions/stats-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, Download } from "lucide-react"
import { format, startOfYear, endOfYear, subYears } from "date-fns"
import { ko } from "date-fns/locale"

export function StatsDashboardContent() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [startYear, setStartYear] = useState(currentYear - 2)
  const [endYear, setEndYear] = useState(currentYear)

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[] | undefined>()
  const [yearlyStats, setYearlyStats] = useState<YearlyStats[] | undefined>()
  const [summary, setSummary] = useState<StatsSummary | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 월별 통계 로드
  const loadMonthlyStats = async (year: number) => {
    try {
      const result = await getMonthlyStats(year)
      if (result.success && result.stats) {
        setMonthlyStats(result.stats)
      } else {
        setError(result.error || "월별 통계를 불러오는데 실패했습니다")
      }
    } catch (err) {
      console.error("[Stats Dashboard] 월별 통계 로드 실패:", err)
      setError("월별 통계를 불러오는 중 오류가 발생했습니다")
    }
  }

  // 연도별 통계 로드
  const loadYearlyStats = async (start: number, end: number) => {
    try {
      const result = await getYearlyStats(start, end)
      if (result.success && result.stats) {
        setYearlyStats(result.stats)
      } else {
        setError(result.error || "연도별 통계를 불러오는데 실패했습니다")
      }
    } catch (err) {
      console.error("[Stats Dashboard] 연도별 통계 로드 실패:", err)
      setError("연도별 통계를 불러오는 중 오류가 발생했습니다")
    }
  }

  // 통계 요약 로드
  const loadSummary = async (startDate: string, endDate: string) => {
    try {
      const result = await getStatsSummary(startDate, endDate)
      if (result.success && result.summary) {
        setSummary(result.summary)
      } else {
        setError(result.error || "통계 요약을 불러오는데 실패했습니다")
      }
    } catch (err) {
      console.error("[Stats Dashboard] 통계 요약 로드 실패:", err)
      setError("통계 요약을 불러오는 중 오류가 발생했습니다")
    }
  }

  // 초기 로드 및 연도 변경 시 재로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      const yearStart = new Date(selectedYear, 0, 1)
      const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999)

      await Promise.all([
        loadMonthlyStats(selectedYear),
        loadYearlyStats(startYear, endYear),
        loadSummary(yearStart.toISOString(), yearEnd.toISOString()),
      ])

      setLoading(false)
    }

    loadData()
  }, [selectedYear, startYear, endYear])

  // 연도 선택 옵션 생성
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            기간 선택
          </CardTitle>
          <CardDescription>통계를 확인할 기간을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">월별 통계 연도:</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">연도별 통계 범위:</label>
              <Select value={startYear.toString()} onValueChange={(v) => setStartYear(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">~</span>
              <Select value={endYear.toString()} onValueChange={(v) => setEndYear(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 카드 */}
      {summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">통계 요약</h2>
            <ExportExcelButton
              summary={summary}
              monthlyStats={monthlyStats}
              yearlyStats={yearlyStats}
            />
          </div>
          <StatsSummaryCard summary={summary} />
        </div>
      )}

      {/* 통계 차트 */}
      <StatsChart monthlyStats={monthlyStats} yearlyStats={yearlyStats} />

      {/* 사업별 상세 통계 */}
      {summary && <BusinessDetailTable businessDetails={summary.businessDetails} />}
    </div>
  )
}
