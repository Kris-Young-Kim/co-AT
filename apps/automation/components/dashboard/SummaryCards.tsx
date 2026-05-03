import { CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react'

interface Log {
  id: string
  job_name: string
  status: string
  success_count: number
  fail_count: number
  created_at: string
}

export function SummaryCards({ logs }: { logs: Log[] }) {
  const total     = logs.length
  const success   = logs.filter(l => l.status === 'success').length
  const partial   = logs.filter(l => l.status === 'partial').length
  const failed    = logs.filter(l => l.status === 'failed').length
  const totalSent = logs.reduce((s, l) => s + l.success_count, 0)

  const cards = [
    { label: '오늘 실행',  value: total,     icon: Activity,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: '성공',       value: success,   icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: '부분 성공',  value: partial,   icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '실패',       value: failed,    icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: '총 발송',    value: totalSent, icon: Activity,    color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <div className={`${bg} p-2 rounded-md`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
