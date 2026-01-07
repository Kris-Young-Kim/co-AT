"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { type MonthlyStats, type YearlyStats } from "@/actions/stats-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatsChartProps {
  monthlyStats?: MonthlyStats[]
  yearlyStats?: YearlyStats[]
  title?: string
}

const COLORS = {
  consultation: "#3b82f6", // blue
  experience: "#10b981", // green
  custom: "#f59e0b", // amber
  aftercare: "#ef4444", // red
  education: "#8b5cf6", // purple
}

const BUSINESS_LABELS = {
  consultation: "I. 상담 및 정보제공",
  experience: "II. 체험",
  custom: "III. 맞춤형 지원",
  aftercare: "IV. 사후관리",
  education: "V. 교육 및 홍보",
}

/**
 * 5대 사업별 실적 그래프 컴포넌트
 */
export function StatsChart({ monthlyStats, yearlyStats, title = "5대 사업별 실적 통계" }: StatsChartProps) {
  // 월별 데이터 포맷팅
  const monthlyChartData = monthlyStats?.map((stat) => ({
    month: stat.monthLabel,
    "I. 상담 및 정보제공": stat.consultation,
    "II. 체험": stat.experience,
    "III. 맞춤형 지원": stat.custom,
    "IV. 사후관리": stat.aftercare,
    "V. 교육 및 홍보": stat.education,
    합계: stat.total,
  })) || []

  // 연도별 데이터 포맷팅
  const yearlyChartData = yearlyStats?.map((stat) => ({
    year: `${stat.year}년`,
    "I. 상담 및 정보제공": stat.consultation,
    "II. 체험": stat.experience,
    "III. 맞춤형 지원": stat.custom,
    "IV. 사후관리": stat.aftercare,
    "V. 교육 및 홍보": stat.education,
    합계: stat.total,
  })) || []

  // 전체 합계 계산
  const totalStats = monthlyStats?.reduce(
    (acc, stat) => ({
      consultation: acc.consultation + stat.consultation,
      experience: acc.experience + stat.experience,
      custom: acc.custom + stat.custom,
      aftercare: acc.aftercare + stat.aftercare,
      education: acc.education + stat.education,
      total: acc.total + stat.total,
    }),
    { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }
  ) || { consultation: 0, experience: 0, custom: 0, aftercare: 0, education: 0, total: 0 }

  // 파이 차트 데이터
  const pieChartData = [
    { name: "I. 상담 및 정보제공", value: totalStats.consultation, color: COLORS.consultation },
    { name: "II. 체험", value: totalStats.experience, color: COLORS.experience },
    { name: "III. 맞춤형 지원", value: totalStats.custom, color: COLORS.custom },
    { name: "IV. 사후관리", value: totalStats.aftercare, color: COLORS.aftercare },
    { name: "V. 교육 및 홍보", value: totalStats.education, color: COLORS.education },
  ].filter((item) => item.value > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              5대 핵심 사업별 실적을 시각화하여 한눈에 파악할 수 있습니다
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">월별 통계</TabsTrigger>
            <TabsTrigger value="yearly">연도별 통계</TabsTrigger>
            <TabsTrigger value="pie">사업별 비율</TabsTrigger>
          </TabsList>

          {/* 월별 통계 */}
          <TabsContent value="monthly" className="space-y-4">
            {monthlyChartData.length > 0 ? (
              <>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="I. 상담 및 정보제공" fill={COLORS.consultation} />
                      <Bar dataKey="II. 체험" fill={COLORS.experience} />
                      <Bar dataKey="III. 맞춤형 지원" fill={COLORS.custom} />
                      <Bar dataKey="IV. 사후관리" fill={COLORS.aftercare} />
                      <Bar dataKey="V. 교육 및 홍보" fill={COLORS.education} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 월별 추이 라인 차트 */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="I. 상담 및 정보제공"
                        stroke={COLORS.consultation}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="II. 체험"
                        stroke={COLORS.experience}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="III. 맞춤형 지원"
                        stroke={COLORS.custom}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="IV. 사후관리"
                        stroke={COLORS.aftercare}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="V. 교육 및 홍보"
                        stroke={COLORS.education}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                월별 통계 데이터가 없습니다
              </div>
            )}
          </TabsContent>

          {/* 연도별 통계 */}
          <TabsContent value="yearly" className="space-y-4">
            {yearlyChartData.length > 0 ? (
              <>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="I. 상담 및 정보제공" fill={COLORS.consultation} />
                      <Bar dataKey="II. 체험" fill={COLORS.experience} />
                      <Bar dataKey="III. 맞춤형 지원" fill={COLORS.custom} />
                      <Bar dataKey="IV. 사후관리" fill={COLORS.aftercare} />
                      <Bar dataKey="V. 교육 및 홍보" fill={COLORS.education} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 연도별 추이 라인 차트 */}
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={yearlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="I. 상담 및 정보제공"
                        stroke={COLORS.consultation}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="II. 체험"
                        stroke={COLORS.experience}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="III. 맞춤형 지원"
                        stroke={COLORS.custom}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="IV. 사후관리"
                        stroke={COLORS.aftercare}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="V. 교육 및 홍보"
                        stroke={COLORS.education}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                연도별 통계 데이터가 없습니다
              </div>
            )}
          </TabsContent>

          {/* 사업별 비율 */}
          <TabsContent value="pie" className="space-y-4">
            {pieChartData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                사업별 비율 데이터가 없습니다
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
