"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  getYearOverYearComparison,
  getTeamPerformance,
  getBudgetExecution,
  type YearOverYearComparison,
  type TeamPerformance,
  type BudgetExecution,
} from "@/actions/advanced-dashboard-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export function AdvancedDashboardSection() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // 전년 동기 대비 실적 비교
  const { data: yoyComparison, isLoading: yoyLoading } = useQuery<YearOverYearComparison>({
    queryKey: ["advanced-dashboard", "yoy-comparison", selectedYear],
    queryFn: async () => {
      const result = await getYearOverYearComparison()
      if (!result.success || !result.comparison) {
        throw new Error(result.error || "전년 동기 대비 실적 비교 조회에 실패했습니다")
      }
      return result.comparison
    },
    refetchInterval: 300000, // 5분마다 갱신
  })

  // 팀별 성과 분석
  const { data: teamPerformance, isLoading: teamLoading } = useQuery<TeamPerformance[]>({
    queryKey: ["advanced-dashboard", "team-performance", selectedYear],
    queryFn: async () => {
      const result = await getTeamPerformance(selectedYear)
      if (!result.success || !result.teams) {
        throw new Error(result.error || "팀별 성과 분석 조회에 실패했습니다")
      }
      return result.teams
    },
    refetchInterval: 300000, // 5분마다 갱신
  })

  // 예산 집행 현황
  const { data: budgetExecution, isLoading: budgetLoading } = useQuery<BudgetExecution>({
    queryKey: ["advanced-dashboard", "budget-execution", selectedYear],
    queryFn: async () => {
      const result = await getBudgetExecution()
      if (!result.success || !result.budget) {
        throw new Error(result.error || "예산 집행 현황 조회에 실패했습니다")
      }
      return result.budget
    },
    refetchInterval: 300000, // 5분마다 갱신
  })

  if (yoyLoading || teamLoading || budgetLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>고급 대시보드</CardTitle>
          <CardDescription>
            실시간 KPI 모니터링, 전년 동기 대비 실적 비교, 팀별 성과 분석, 예산 집행 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="yoy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="yoy">전년 동기 대비</TabsTrigger>
              <TabsTrigger value="teams">팀별 성과</TabsTrigger>
              <TabsTrigger value="budget">예산 집행</TabsTrigger>
            </TabsList>

            {/* 전년 동기 대비 실적 비교 */}
            <TabsContent value="yoy" className="space-y-4">
              {yoyComparison && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">신청서 건수</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {yoyComparison.comparison.applications.current.toLocaleString()}건
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          {yoyComparison.comparison.applications.change >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span>
                            전년 동기 대비 {Math.abs(yoyComparison.comparison.applications.change).toLocaleString()}건
                            ({yoyComparison.comparison.applications.changePercent >= 0 ? "+" : ""}
                            {yoyComparison.comparison.applications.changePercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          전년 동기: {yoyComparison.comparison.applications.previous.toLocaleString()}건
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">완료 건수</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {yoyComparison.comparison.completed.current.toLocaleString()}건
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          {yoyComparison.comparison.completed.change >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span>
                            전년 동기 대비 {Math.abs(yoyComparison.comparison.completed.change).toLocaleString()}건
                            ({yoyComparison.comparison.completed.changePercent >= 0 ? "+" : ""}
                            {yoyComparison.comparison.completed.changePercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          전년 동기: {yoyComparison.comparison.completed.previous.toLocaleString()}건
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">카테고리별 비교</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {yoyComparison.comparison.byCategory.map((item) => {
                          const categoryNames: Record<string, string> = {
                            consult: "상담 및 정보제공",
                            custom: "맞춤형 지원",
                            aftercare: "사후관리",
                            education: "교육 및 홍보",
                          }
                          return (
                            <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium">{categoryNames[item.category] || item.category}</div>
                                <div className="text-sm text-muted-foreground">
                                  올해: {item.current.toLocaleString()}건 / 전년: {item.previous.toLocaleString()}건
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">
                                  {item.change >= 0 ? "+" : ""}
                                  {item.changePercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* 팀별 성과 분석 */}
            <TabsContent value="teams" className="space-y-4">
              {teamPerformance && teamPerformance.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teamPerformance.map((team) => (
                    <Card key={team.team || "no-team"}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {team.teamName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-xs text-muted-foreground">인원: {team.staffCount}명</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>신청서</span>
                            <span className="font-medium">{team.applications.total}건</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>완료</span>
                            <span className="font-medium">{team.applications.completed}건</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>서비스 로그</span>
                            <span className="font-medium">{team.serviceLogs.total}건</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>총 비용</span>
                            <span className="font-medium">
                              {team.serviceLogs.totalCost.toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>일정</span>
                            <span className="font-medium">{team.schedules.total}건</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  팀별 성과 데이터가 없습니다.
                </div>
              )}
            </TabsContent>

            {/* 예산 집행 현황 */}
            <TabsContent value="budget" className="space-y-4">
              {budgetExecution && (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        총 집행액
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {budgetExecution.total.spent.toLocaleString()}원
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        기간: {format(new Date(budgetExecution.period.start), "yyyy년 MM월 dd일", { locale: ko })} ~{" "}
                        {format(new Date(budgetExecution.period.end), "yyyy년 MM월 dd일", { locale: ko })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">카테고리별 집행</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {budgetExecution.byCategory.map((item) => (
                          <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <div className="font-medium">{item.category}</div>
                              <div className="text-sm text-muted-foreground">{item.count}건</div>
                            </div>
                            <div className="text-lg font-bold">{item.spent.toLocaleString()}원</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">월별 집행</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {budgetExecution.byMonth.map((item) => (
                          <div key={item.month} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <div className="font-medium">
                                {format(new Date(item.month + "-01"), "yyyy년 MM월", { locale: ko })}
                              </div>
                              <div className="text-sm text-muted-foreground">{item.count}건</div>
                            </div>
                            <div className="text-lg font-bold">{item.spent.toLocaleString()}원</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
