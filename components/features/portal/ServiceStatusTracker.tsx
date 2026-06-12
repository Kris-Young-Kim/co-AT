"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, ClipboardList } from "lucide-react"
import type { ActiveApplication } from "@/actions/portal-actions"

interface ServiceStatusTrackerProps {
  applications: ActiveApplication[]
}

const STEPS = [
  { key: "접수", label: "접수" },
  { key: "배정", label: "검토" },
  { key: "진행중", label: "지원" },
  { key: "완료", label: "완료" },
] as const

const STEP_ORDER: Record<string, number> = {
  접수: 0,
  배정: 1,
  진행중: 2,
  완료: 3,
}

const CATEGORY_LABEL: Record<string, string> = {
  consult: "상담",
  experience: "체험·시연",
  custom: "맞춤형 지원",
  aftercare: "사후관리",
  education: "교육·홍보",
}

const SUB_CATEGORY_LABEL: Record<string, string> = {
  repair: "수리",
  rental: "대여",
  custom_make: "맞춤제작",
  cleaning: "소독·세척",
  reuse: "재사용",
  visit: "방문",
  exhibition: "전시",
}

function getServiceLabel(app: ActiveApplication) {
  const cat = CATEGORY_LABEL[app.category ?? ""] ?? app.category ?? "서비스"
  const sub = SUB_CATEGORY_LABEL[app.sub_category ?? ""]
  return sub ? `${cat} — ${sub}` : cat
}

function Stepper({ currentStatus }: { currentStatus: string | null }) {
  const currentStep = STEP_ORDER[currentStatus ?? ""] ?? 0

  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((step, idx) => {
        const done = idx < currentStep
        const active = idx === currentStep
        const isLast = idx === STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                  done
                    ? "bg-blue-600 text-white"
                    : active
                    ? "bg-blue-600 text-white ring-2 ring-blue-200"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className={`h-3 w-3 ${active ? "fill-white" : ""}`} />
                )}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  active ? "text-blue-600 font-semibold" : done ? "text-blue-500" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 ${
                  idx < currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ServiceStatusTracker({ applications }: ServiceStatusTrackerProps) {
  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            진행 중인 서비스 신청
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            현재 진행 중인 서비스 신청이 없습니다
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
          진행 중인 서비스 신청 ({applications.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {getServiceLabel(app)}
              </p>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {app.created_at
                  ? new Date(app.created_at).toLocaleDateString("ko-KR")
                  : "—"}
              </span>
            </div>
            {app.desired_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                희망일: {new Date(app.desired_date).toLocaleDateString("ko-KR")}
              </p>
            )}
            <Stepper currentStatus={app.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
