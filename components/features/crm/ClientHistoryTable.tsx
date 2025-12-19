"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type ClientHistoryItem } from "@/actions/client-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { FileText, Calendar, Wrench, Clock } from "lucide-react"

interface ClientHistoryTableProps {
  history: ClientHistoryItem[]
}

export function ClientHistoryTable({ history }: ClientHistoryTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일", { locale: ko })
    } catch {
      return dateString
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "application":
        return <FileText className="h-4 w-4" />
      case "schedule":
        return <Calendar className="h-4 w-4" />
      case "service_log":
        return <Wrench className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "application":
        return "신청"
      case "schedule":
        return "일정"
      case "service_log":
        return "서비스"
      default:
        return type
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      접수: { label: "접수", variant: "outline" },
      배정: { label: "배정", variant: "secondary" },
      진행: { label: "진행", variant: "default" },
      완료: { label: "완료", variant: "default" },
      반려: { label: "반려", variant: "destructive" },
    }

    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
    return (
      <Badge variant={statusInfo.variant} className="ml-2">
        {statusInfo.label}
      </Badge>
    )
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>서비스 이용 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>서비스 이용 이력이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>서비스 이용 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              {/* 타임라인 아이콘 */}
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getTypeIcon(item.type)}
                </div>
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-2" />
                )}
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{item.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(item.type)}
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}








