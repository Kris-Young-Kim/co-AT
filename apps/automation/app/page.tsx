import Link from 'next/link'
import { Send } from 'lucide-react'
import { getTodaySummary } from '@/actions/log-actions'
import { getChannels } from '@/actions/channel-actions'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { RecentLogsTable } from '@/components/dashboard/RecentLogsTable'
import { ChannelStatus } from '@/components/dashboard/ChannelStatus'

export default async function DashboardPage() {
  const [logs, channels] = await Promise.all([getTodaySummary(), getChannels()])

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">업무 자동화 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/send"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
        >
          <Send className="w-4 h-4" />
          수동 발송
        </Link>
      </div>

      <ChannelStatus channels={channels ?? []} />
      <SummaryCards logs={logs ?? []} />

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-base font-semibold mb-4">오늘 실행 내역</h2>
        <RecentLogsTable logs={(logs ?? []).slice(0, 10)} />
      </div>
    </div>
  )
}
