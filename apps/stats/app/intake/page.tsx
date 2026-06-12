import { getCallLogChannelStats } from '@/actions/call-log-actions'
import { IntakeChannelChart } from '@/stats/components/stats/IntakeChannelChart'
import { YearSelector } from '@/stats/components/stats/YearSelector'
import { Phone, Globe, Bot, PhoneIncoming } from 'lucide-react'

interface IntakePageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams
  const year = parseInt(params.year ?? String(new Date().getFullYear()))

  const result = await getCallLogChannelStats(year)
  const rows = result.success ? result.rows : []
  const totals = result.success ? result.totals : { phone: 0, web: 0, chatbot: 0, total: 0 }

  const cards = [
    { label: '전체 접수', value: totals.total, icon: PhoneIncoming, color: 'bg-gray-50 border-gray-200 text-gray-700' },
    { label: '유선 (전화)', value: totals.phone, icon: Phone, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: '온라인 신청', value: totals.web, icon: Globe, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'AI 챗봇', value: totals.chatbot, icon: Bot, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5" />
            채널별 접수 현황
          </h1>
          <p className="text-sm text-gray-500 mt-1">유선·온라인·AI챗봇 접수 건수 월별 집계</p>
        </div>
        <YearSelector currentYear={year} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`border rounded-lg p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs mt-1 opacity-70">
              {totals.total > 0 ? `${Math.round((value / totals.total) * 100)}%` : '0%'}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <IntakeChannelChart rows={rows} />

      {/* Monthly table */}
      <div className="mt-6 border rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
              <th className="px-4 py-3 text-left font-medium">월</th>
              <th className="px-4 py-3 text-center font-medium">유선</th>
              <th className="px-4 py-3 text-center font-medium">온라인</th>
              <th className="px-4 py-3 text-center font-medium">챗봇</th>
              <th className="px-4 py-3 text-center font-medium">합계</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.month} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-700">{row.month}월</td>
                <td className="px-4 py-2.5 text-center text-blue-700">{row.phone || '—'}</td>
                <td className="px-4 py-2.5 text-center text-green-700">{row.web || '—'}</td>
                <td className="px-4 py-2.5 text-center text-purple-700">{row.chatbot || '—'}</td>
                <td className="px-4 py-2.5 text-center font-semibold">{row.total || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-gray-50 font-bold text-sm">
              <td className="px-4 py-3">합계</td>
              <td className="px-4 py-3 text-center text-blue-700">{totals.phone}</td>
              <td className="px-4 py-3 text-center text-green-700">{totals.web}</td>
              <td className="px-4 py-3 text-center text-purple-700">{totals.chatbot}</td>
              <td className="px-4 py-3 text-center">{totals.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
