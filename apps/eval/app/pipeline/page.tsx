import { getPipelineData } from "@/actions/pipeline-actions"
import { PipelineBoard } from "@/eval/components/eval/PipelineBoard"
import { Kanban } from "lucide-react"

export default async function PipelinePage() {
  const result = await getPipelineData({ daysBack: 90 })
  const data = result.success && result.data
    ? result.data
    : { 접수: [], 배정: [], 진행중: [], 완료: [] }

  const total = Object.values(data).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Kanban className="h-5 w-5" />
          서비스 진행 현황
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          최근 90일 접수 신청 {total}건 — 채널·단계별 현황
        </p>
      </div>

      {!result.success && (
        <p className="text-sm text-red-600 mb-4">{result.error}</p>
      )}

      <PipelineBoard initialData={data} />
    </div>
  )
}
