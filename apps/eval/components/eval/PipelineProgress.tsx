import { Check } from 'lucide-react'

interface Props {
  intakeCount: number
  assessmentCount: number
  serviceRecordCount: number
  applicationStatus: string | null
}

interface Stage {
  label: string
  sublabel: string
  done: boolean
  active: boolean
}

export function PipelineProgress({ intakeCount, assessmentCount, serviceRecordCount, applicationStatus }: Props) {
  const isCompleted = applicationStatus === 'completed' || applicationStatus === '완료'

  const stages: Stage[] = [
    {
      label: '접수',
      sublabel: '신청 등록',
      done: true,
      active: intakeCount === 0,
    },
    {
      label: '상담 기록',
      sublabel: `${intakeCount}건`,
      done: intakeCount > 0,
      active: intakeCount === 0,
    },
    {
      label: '영역 평가',
      sublabel: `${assessmentCount}건`,
      done: assessmentCount > 0,
      active: intakeCount > 0 && assessmentCount === 0,
    },
    {
      label: '서비스 기록',
      sublabel: `${serviceRecordCount}건`,
      done: serviceRecordCount > 0,
      active: assessmentCount > 0 && serviceRecordCount === 0,
    },
    {
      label: '완료',
      sublabel: isCompleted ? '처리 완료' : '대기',
      done: isCompleted,
      active: serviceRecordCount > 0 && !isCompleted,
    },
  ]

  return (
    <div className="border rounded-lg bg-white px-6 py-4">
      <p className="text-xs font-medium text-gray-500 mb-4">진행 단계</p>
      <div className="flex items-center">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center min-w-0">
              <div
                className={[
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors',
                  stage.done
                    ? 'bg-blue-600 text-white'
                    : stage.active
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 ring-offset-1'
                    : 'bg-gray-100 text-gray-400',
                ].join(' ')}
              >
                {stage.done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p className={`mt-1.5 text-xs font-medium whitespace-nowrap ${stage.done ? 'text-blue-700' : stage.active ? 'text-blue-600' : 'text-gray-400'}`}>
                {stage.label}
              </p>
              <p className="text-xs text-gray-400 whitespace-nowrap">{stage.sublabel}</p>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${stage.done ? 'bg-blue-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
