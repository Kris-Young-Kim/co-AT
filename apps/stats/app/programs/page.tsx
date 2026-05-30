import { getExhibitionSchedules, getEducationSchedules } from '@/actions/program-actions'
import { ProgramRecordList } from '@/stats/components/programs/ProgramRecordList'
import { YearSelector } from '@/stats/components/stats/YearSelector'

interface ProgramsPageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const [exhibitions, educations] = await Promise.all([
    getExhibitionSchedules(year),
    getEducationSchedules(year),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로그램 실적 입력</h1>
          <p className="text-sm text-gray-500 mt-1">체험·견학 및 교육 일정의 보고서 세부 정보를 입력합니다.</p>
        </div>
        <YearSelector currentYear={year} />
      </div>
      <ProgramRecordList year={year} exhibitions={exhibitions} educations={educations} />
    </div>
  )
}
