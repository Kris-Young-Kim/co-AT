"use client"

import { ClientTimelineItem } from "./ClientTimelineItem"
import type { ServiceHistory } from "@/actions/portal-actions"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface ClientTimelineListProps {
  history: ServiceHistory[]
}

export function ClientTimelineList({ history }: ClientTimelineListProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">서비스 이력이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            서비스를 신청하시면 이력이 표시됩니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <ClientTimelineItem key={`${item.type}-${item.id}`} history={item} />
      ))}
    </div>
  )
}

