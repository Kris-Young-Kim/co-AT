"use client"

import { useState } from "react"
import Link from "next/link"
import { Phone, Globe, Bot, HelpCircle, Calendar, ChevronRight } from "lucide-react"
import type { PipelineCard, PipelineData, PipelineChannel } from "@/actions/pipeline-actions"

const CATEGORY_LABELS: Record<string, string> = {
  consult: "상담",
  experience: "체험·시연",
  custom: "맞춤형 지원",
  aftercare: "사후관리",
  education: "교육·홍보",
}

const SUB_LABELS: Record<string, string> = {
  repair: "수리",
  rental: "대여",
  custom_make: "맞춤제작",
  cleaning: "소독",
  reuse: "재사용",
}

const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  web: { label: "온라인", icon: Globe, color: "bg-green-100 text-green-700" },
  chatbot: { label: "챗봇", icon: Bot, color: "bg-purple-100 text-purple-700" },
  phone: { label: "유선", icon: Phone, color: "bg-blue-100 text-blue-700" },
}

const COLUMN_CONFIG = [
  { key: "접수" as const, label: "접수", color: "border-t-gray-400", countColor: "bg-gray-100 text-gray-700" },
  { key: "배정" as const, label: "배정", color: "border-t-blue-500", countColor: "bg-blue-100 text-blue-700" },
  { key: "진행중" as const, label: "서비스 진행", color: "border-t-yellow-500", countColor: "bg-yellow-100 text-yellow-700" },
  { key: "완료" as const, label: "완료", color: "border-t-green-500", countColor: "bg-green-100 text-green-700" },
]

function ChannelBadge({ channel }: { channel: PipelineChannel }) {
  if (!channel) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
        <HelpCircle className="h-3 w-3" />
        미확인
      </span>
    )
  }
  const cfg = CHANNEL_CONFIG[channel]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function PipelineCard({ card }: { card: PipelineCard }) {
  const cat = CATEGORY_LABELS[card.category ?? ""] ?? card.category ?? "—"
  const sub = SUB_LABELS[card.sub_category ?? ""] ?? card.sub_category
  const displayDate = card.desired_date ?? card.created_at
  const dateStr = displayDate
    ? new Date(displayDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    : null

  return (
    <Link
      href={`/clients/${card.client_id}`}
      className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">
          {card.client_name}
        </p>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5 group-hover:text-blue-500" />
      </div>
      <p className="text-xs text-gray-600 mb-2 truncate">
        {cat}
        {sub && <span className="text-gray-400"> · {sub}</span>}
      </p>
      <div className="flex items-center justify-between gap-2">
        <ChannelBadge channel={card.channel} />
        {dateStr && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {dateStr}
          </span>
        )}
      </div>
    </Link>
  )
}

const CHANNEL_FILTER_OPTIONS: Array<{ value: "all" | PipelineChannel; label: string }> = [
  { value: "all", label: "전체" },
  { value: "web", label: "온라인" },
  { value: "chatbot", label: "챗봇" },
  { value: "phone", label: "유선" },
  { value: null, label: "미확인" },
]

interface PipelineBoardProps {
  initialData: PipelineData
  initialChannel?: "all" | PipelineChannel
}

export function PipelineBoard({ initialData, initialChannel = "all" }: PipelineBoardProps) {
  const [channelFilter, setChannelFilter] = useState<"all" | PipelineChannel>(initialChannel)
  const [data] = useState<PipelineData>(initialData)

  // Client-side channel filter
  const filtered: PipelineData = { 접수: [], 배정: [], 진행중: [], 완료: [] }
  for (const key of ["접수", "배정", "진행중", "완료"] as const) {
    filtered[key] =
      channelFilter === "all"
        ? data[key]
        : data[key].filter((c) => c.channel === channelFilter)
  }

  const total = Object.values(filtered).reduce((s, arr) => s + arr.length, 0)

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5">
        {CHANNEL_FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => setChannelFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              channelFilter === value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
            {value === channelFilter && (
              <span className="ml-1.5 text-blue-200">
                {total}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">최근 90일 기준</span>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMN_CONFIG.map(({ key, label, color, countColor }) => {
          const cards = filtered[key]
          return (
            <div key={key} className="flex flex-col min-h-[400px]">
              {/* Column header */}
              <div className={`rounded-t-lg border border-b-0 border-t-4 ${color} bg-white px-3 py-2.5 flex items-center justify-between`}>
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countColor}`}>
                  {cards.length}
                </span>
              </div>
              {/* Cards */}
              <div className="flex-1 rounded-b-lg border border-t-0 bg-gray-50/60 p-2 space-y-2">
                {cards.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center pt-6">없음</p>
                ) : (
                  cards.map((card) => <PipelineCard key={card.id} card={card} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
