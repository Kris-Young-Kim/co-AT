"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type NewApplication } from "@/actions/dashboard-actions"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import Link from "next/link"
import { FileText, Calendar, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AdminNewRequestListProps {
  applications: NewApplication[]
}

const getCategoryLabel = (category: string | null) => {
  if (!category) return "미분류"
  const categoryMap: Record<string, string> = {
    consult: "상담 및 정보제공",
    repair: "수리",
    rental: "대여",
    custom: "맞춤형 지원",
    edu: "교육/홍보",
  }
  return categoryMap[category] || category
}

export function AdminNewRequestList({ applications }: AdminNewRequestListProps) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>신규 접수</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            신규 접수 건이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>신규 접수</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/admin/clients/${app.client?.id || ""}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">
                      {app.client?.name || "이름 없음"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(app.category)}
                    </Badge>
                    {app.sub_category && (
                      <span className="text-xs text-muted-foreground">
                        {app.sub_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  {app.created_at
                    ? format(new Date(app.created_at), "MM.dd HH:mm", { locale: ko })
                    : "-"}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

