"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Download, FileText, TrendingUp, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { assessmentDomainNames, type AssessmentDomainType } from "@/lib/templates/assessment-templates"

interface AssessmentResultVisualizationProps {
  assessments: any[]
  clientId: string
}

export function AssessmentResultVisualization({
  assessments,
  clientId,
}: AssessmentResultVisualizationProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
    } catch {
      return dateString
    }
  }

  const getDomainColor = (domain: AssessmentDomainType) => {
    const colors: Record<AssessmentDomainType, string> = {
      WC: "bg-blue-500",
      ADL: "bg-green-500",
      S: "bg-purple-500",
      SP: "bg-orange-500",
      EC: "bg-teal-500",
      CA: "bg-pink-500",
      L: "bg-yellow-500",
      AAC: "bg-indigo-500",
      AM: "bg-red-500",
    }
    return colors[domain] || "bg-gray-500"
  }

  if (assessments.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            평가 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-16 text-center text-muted-foreground">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">저장된 평가 결과가 없습니다</p>
            <p className="text-sm">평가를 작성하고 저장하면 결과가 표시됩니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 영역별로 그룹화
  const assessmentsByDomain = assessments.reduce((acc, assessment) => {
    const domain = assessment.domain_type as AssessmentDomainType
    if (!acc[domain]) {
      acc[domain] = []
    }
    acc[domain].push(assessment)
    return acc
  }, {} as Record<AssessmentDomainType, any[]>)

  return (
    <div className="space-y-6">
      {/* 전체 요약 */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            평가 요약
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(assessmentDomainNames).map(([key, name]) => {
              const domain = key as AssessmentDomainType
              const count = assessmentsByDomain[domain]?.length || 0
              return (
                <div
                  key={key}
                  className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${getDomainColor(domain)} mx-auto mb-2 flex items-center justify-center text-white font-bold`}
                  >
                    {key}
                  </div>
                  <p className="text-sm font-medium mb-1">{name}</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground">회 평가</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 영역별 상세 결과 */}
      <Tabs defaultValue={Object.keys(assessmentsByDomain)[0] || "WC"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {Object.entries(assessmentDomainNames).map(([key, name]) => {
            const domain = key as AssessmentDomainType
            const hasData = assessmentsByDomain[domain]?.length > 0
            return (
              <TabsTrigger
                key={key}
                value={key}
                disabled={!hasData}
                className="text-xs"
              >
                {key}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.entries(assessmentsByDomain).map(([domain, domainAssessments]) => (
          <TabsContent key={domain} value={domain} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full ${getDomainColor(domain as AssessmentDomainType)} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {domain}
                  </div>
                  {assessmentDomainNames[domain as AssessmentDomainType]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(domainAssessments as any[] || []).map((assessment: any, index: number) => (
                    <Card key={assessment.id || index} className="border shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full ${getDomainColor(domain as AssessmentDomainType)} flex items-center justify-center text-white font-bold text-sm`}
                            >
                              {domain}
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {formatDate(assessment.evaluation_date)} 평가
                              </CardTitle>
                              {assessment.id && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ID: {assessment.id.substring(0, 8)}...
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {formatDate(assessment.evaluation_date)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          {assessment.data && (
                            <div className="grid gap-4 md:grid-cols-2">
                              {Object.entries(assessment.data).map(([key, value]) => {
                                if (
                                  key === "evaluation_date" ||
                                  key === "evaluator_name" ||
                                  key === "evaluator_opinion" ||
                                  key === "recommended_device" ||
                                  key === "future_plan" ||
                                  !value
                                )
                                  return null

                                return (
                                  <div key={key} className="space-y-1 p-3 border rounded-lg bg-muted/30">
                                    <p className="text-xs font-medium text-muted-foreground uppercase">
                                      {key.replace(/_/g, " ")}
                                    </p>
                                    <p className="text-sm font-medium">
                                      {Array.isArray(value) ? (
                                        <div className="flex flex-wrap gap-1">
                                          {value.map((v, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {String(v)}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        String(value)
                                      )}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {assessment.data?.evaluator_opinion && (
                            <div className="pt-4 border-t">
                              <div className="flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">평가자의견</p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  {assessment.data.evaluator_opinion}
                                </p>
                              </div>
                            </div>
                          )}

                          {assessment.data?.recommended_device && (
                            <div className="pt-4 border-t">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">추천 보조기기</p>
                              </div>
                              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  {assessment.data.recommended_device}
                                </p>
                              </div>
                            </div>
                          )}

                          {assessment.data?.future_plan && (
                            <div className="pt-4 border-t">
                              <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">향후 계획</p>
                              </div>
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  {assessment.data.future_plan}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
