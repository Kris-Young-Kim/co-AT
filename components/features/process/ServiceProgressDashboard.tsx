"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Search,
  Filter,
  Download,
  X,
  TrendingUp,
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<ProgressItemType | "all">("all")
  const [filterDateRange, setFilterDateRange] = useState<"all" | "week" | "month" | "quarter" | "year">("all")

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

  // 필터링 및 검색 로직
  const filteredItems = useMemo(() => {
    let filtered = [...progressItems]

    // 타입 필터
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType)
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          Object.values(item.metadata || {}).some((value) =>
            String(value).toLowerCase().includes(query)
          )
      )
    }

    // 날짜 범위 필터
    if (filterDateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (filterDateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate
      })
    }

    return filtered.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [progressItems, filterType, searchQuery, filterDateRange])

  // 타입별로 그룹화 (전체 데이터 기준)
  const itemsByType = useMemo(() => {
    return progressItems.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = []
      }
      acc[item.type].push(item)
      return acc
    }, {} as Record<ProgressItemType, ProgressItem[]>)
  }, [progressItems])

  // 통계 계산
  const stats = useMemo(() => {
    const total = progressItems.length
    const byType = {
      intake: itemsByType.intake?.length || 0,
      assessment: itemsByType.assessment?.length || 0,
      schedule: itemsByType.schedule?.length || 0,
      process_log: itemsByType.process_log?.length || 0,
    }

    // 최근 30일 활동 수
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentActivity = progressItems.filter(
      (item) => new Date(item.date) >= thirtyDaysAgo
    ).length

    return { total, byType, recentActivity }
  }, [progressItems, itemsByType])

  // 엑스포트 기능
  const handleExport = () => {
    const data = filteredItems.map((item) => ({
      타입: getTypeLabel(item.type),
      제목: item.title,
      날짜: formatDate(item.date),
      상태: item.status || "-",
      설명: item.description || "-",
      메타데이터: JSON.stringify(item.metadata || {}, null, 2),
    }))

    const csv = [
      ["타입", "제목", "날짜", "상태", "설명", "메타데이터"],
      ...data.map((row) => [
        row.타입,
        row.제목,
        row.날짜,
        row.상태,
        row.설명,
        row.메타데이터,
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `서비스_진행_기록_${format(new Date(), "yyyyMMdd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
            {/* 필터 및 검색 */}
            <Card className="border">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="제목, 설명, 메타데이터로 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="타입 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 타입</SelectItem>
                      <SelectItem value="intake">상담 기록</SelectItem>
                      <SelectItem value="assessment">평가</SelectItem>
                      <SelectItem value="schedule">일정</SelectItem>
                      <SelectItem value="process_log">진행 기록</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterDateRange}
                    onValueChange={(v) => setFilterDateRange(v as any)}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="기간 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 기간</SelectItem>
                      <SelectItem value="week">최근 1주일</SelectItem>
                      <SelectItem value="month">이번 달</SelectItem>
                      <SelectItem value="quarter">이번 분기</SelectItem>
                      <SelectItem value="year">이번 해</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    엑스포트
                  </Button>
                </div>
                {(searchQuery || filterType !== "all" || filterDateRange !== "all") && (
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">필터:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1">
                        검색: {searchQuery}
                        <button
                          onClick={() => setSearchQuery("")}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filterType !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        타입: {getTypeLabel(filterType)}
                        <button
                          onClick={() => setFilterType("all")}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {filterDateRange !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        기간: {
                          filterDateRange === "week"
                            ? "최근 1주일"
                            : filterDateRange === "month"
                            ? "이번 달"
                            : filterDateRange === "quarter"
                            ? "이번 분기"
                            : "이번 해"
                        }
                        <button
                          onClick={() => setFilterDateRange("all")}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterType("all")
                        setFilterDateRange("all")
                      }}
                      className="text-xs"
                    >
                      모두 초기화
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 통계 요약 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">상담 기록</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.byType.intake}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        전체 {stats.total}건 중
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">평가</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.byType.assessment}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        전체 {stats.total}건 중
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">일정</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.byType.schedule}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        전체 {stats.total}건 중
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">진행 기록</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.byType.process_log}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        최근 30일: {stats.recentActivity}건
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                통합 타임라인
                {filteredItems.length !== progressItems.length && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredItems.length} / {progressItems.length}건 표시)
                  </span>
                )}
              </h3>
            </div>
            {filteredItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    {progressItems.length === 0 ? (
                      <Clock className="h-8 w-8 opacity-50" />
                    ) : (
                      <Search className="h-8 w-8 opacity-50" />
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">
                    {progressItems.length === 0
                      ? "진행 기록이 없습니다"
                      : "검색 결과가 없습니다"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {progressItems.length === 0
                      ? "상담 기록, 평가, 일정, 진행 기록이 여기에 표시됩니다"
                      : "다른 검색어나 필터를 시도해보세요"}
                  </p>
                  {progressItems.length === 0 && (
                    <Button onClick={() => setIsFormDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      첫 진행 기록 작성하기
                    </Button>
                  )}
                  {(searchQuery || filterType !== "all" || filterDateRange !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterType("all")
                        setFilterDateRange("all")
                      }}
                      className="mt-2"
                    >
                      필터 초기화
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item, index) => (
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
