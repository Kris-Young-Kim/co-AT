import { listSegments } from '@/actions/segment-actions'
import { SegmentManager } from '@/eval/components/segments/SegmentManager'

export default async function SegmentsPage() {
  const result = await listSegments()
  const segments = result.segments ?? []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대상자 세그먼트</h1>
        <p className="text-sm text-gray-500 mt-1">
          장애유형·지역·서비스 유형·생애주기 조건을 조합해 세그먼트를 저장하고 재사용하세요
        </p>
      </div>

      <SegmentManager initialSegments={segments} />
    </div>
  )
}
