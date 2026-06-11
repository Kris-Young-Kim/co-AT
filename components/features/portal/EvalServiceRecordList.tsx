"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList } from "lucide-react"
import type { EvalServiceRecord } from "@/actions/portal-actions"

interface EvalServiceRecordListProps {
  records: EvalServiceRecord[]
}

const STATUS_LABEL: Record<string, string> = {
  open: "진행 중",
  closed: "완료",
  pending: "대기",
}

const SATISFACTION_LABEL: Record<number, string> = {
  1: "매우 불만족",
  2: "불만족",
  3: "보통",
  4: "만족",
  5: "매우 만족",
}

export function EvalServiceRecordList({ records }: EvalServiceRecordListProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            서비스 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            서비스 기록이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          서비스 기록 ({records.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => {
          const date = record.consultation_date || record.received_at
          const categoryLabel = [record.service_major_category, record.service_category]
            .filter(Boolean)
            .join(" > ")

          return (
            <div key={record.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {categoryLabel || "서비스"}
                  </span>
                  {record.record_status && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {STATUS_LABEL[record.record_status] ?? record.record_status}
                    </Badge>
                  )}
                </div>
                {record.product_name && (
                  <p className="text-sm text-muted-foreground truncate">{record.product_name}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {date ? new Date(date).toLocaleDateString("ko-KR") : "—"}
                  </span>
                  {record.satisfaction_score != null && (
                    <span className="text-xs text-muted-foreground">
                      만족도: {SATISFACTION_LABEL[record.satisfaction_score] ?? record.satisfaction_score}점
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
