"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  BarChart3,
  Calendar,
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getServiceProgressData } from "@/actions/process-actions"
import { ProcessLogForm } from "./ProcessLogForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ServiceProgressDashboardProps {
  clientId: string
  applicationId?: string
}

export type ProgressItemType = "intake" | "assessment" | "schedule" | "process_log"

export interface ProgressItem {
  id: string
  type: ProgressItemType
  date: string
  title: string
  description?: string
  status?: string
  metadata?: Record<string, any>
}

export function ServiceProgressDashboard({
  clientId,
  applicationId,
}: ServiceProgressDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
  const [activeTab, setActiveTab] = useState<"timeline" | "form">("timeline")
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  useEffect(() => {
    loadProgressData()
  }, [clientId, applicationId])

  const loadProgressData = async () => {
    setIsLoading(true)
    try {
      const result = await getServiceProgressData(clientId, applicationId)
      if (result.success && result.items) {
        setProgressItems(result.items)
      }
    } catch (error) {
      console.error("진행 데이터 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: ProgressItemType) => {
    switch (type) {
      case "intake":
        return <FileText className="h-4 w-4" />
      case "assessment":
        return <BarChart3 className="h-4 w-4" />
      case "schedule":
        return <Calendar className="h-4 w-4" />
      case "process_log":
        return <ClipboardList className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: ProgressItemType) => {
    switch (type) {
      case "intake":
        return "bg-blue-500"
      case "assessment":
        return "bg-purple-500"
      case "schedule":
        return "bg-green-500"
      case "process_log":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeLabel = (type: ProgressItemType) => {
    switch (type) {
      case "intake":
        return "상담 기록"
      case "assessment":
        return "평가"
      case "schedule":
        return "일정"
      case "process_log":
        return "진행 기록"
      default:
        return type
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      접수: { label: "접수", variant: "outline" },
      배정: { label: "배정", variant: "secondary" },
      진행: { label: "진행", variant: "default" },
      완료: { label: "완료", variant: "default" },
      반려: { label: "반려", variant: "destructive" },
      예정: { label: "예정", variant: "outline" },
      진행중: { label: "진행중", variant: "default" },
      종료: { label: "종료", variant: "secondary" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return (
      <Badge variant={statusInfo.variant} className="ml-2 text-xs">
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    try {
      const date = format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
      if (timeString) {
        return `${date} ${timeString.substring(0, 5)}`
      }
      return date
    } catch {
      return dateString
    }
  }

  // 날짜순으로 정렬 (최신순)
  const sortedItems = [...progressItems].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // 타입별로 그룹화
  const itemsByType = sortedItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type].push(item)
    return acc
  }, {} as Record<ProgressItemType, ProgressItem[]>)

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false)
    loadProgressData()
  }

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              서비스 진행 대시보드
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              상담 기록, 평가, 일정, 진행 기록을 통합하여 확인하세요
            </p>
          </div>
          <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                진행 기록 작성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>서비스 진행 기록 작성</DialogTitle>
                <DialogDescription>
                  서비스 진행 내용을 기록하세요 (첨부 20 양식)
                </DialogDescription>
              </DialogHeader>
              <ProcessLogForm
                clientId={clientId}
                applicationId={applicationId}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="timeline">
              <Clock className="mr-2 h-4 w-4" />
              통합 타임라인
            </TabsTrigger>
            <TabsTrigger value="form">
              <FileText className="mr-2 h-4 w-4" />
              진행 기록 작성
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            {/* 통계 요약 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">상담 기록</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {itemsByType.intake?.length || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">평가</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {itemsByType.assessment?.length || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">일정</p>
                      <p className="text-2xl font-bold text-green-600">
                        {itemsByType.schedule?.length || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">진행 기록</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {itemsByType.process_log?.length || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 통합 타임라인 */}
            {sortedItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-2">진행 기록이 없습니다</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    상담 기록, 평가, 일정, 진행 기록이 여기에 표시됩니다
                  </p>
                  <Button onClick={() => setIsFormDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    첫 진행 기록 작성하기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedItems.map((item, index) => (
                  <Card
                    key={`${item.type}-${item.id}`}
                    className="border-l-4 hover:shadow-md transition-shadow"
                    style={{
                      borderLeftColor:
                        item.type === "intake"
                          ? "#3b82f6"
                          : item.type === "assessment"
                          ? "#a855f7"
                          : item.type === "schedule"
                          ? "#22c55e"
                          : "#f97316",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-10 w-10 rounded-full ${getTypeColor(item.type)} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(item.type)}
                              </Badge>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(item.date)}
                            </p>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="grid gap-2 md:grid-cols-2 text-sm">
                                {Object.entries(item.metadata).map(([key, value]) => {
                                  if (!value) return null
                                  return (
                                    <div key={key} className="flex items-start gap-2">
                                      <span className="text-muted-foreground font-medium min-w-[80px]">
                                        {key}:
                                      </span>
                                      <span className="text-foreground">
                                        {Array.isArray(value) ? value.join(", ") : String(value)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-6">
            <ProcessLogForm
              clientId={clientId}
              applicationId={applicationId}
              onSuccess={handleFormSuccess}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
