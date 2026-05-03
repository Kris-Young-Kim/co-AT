import { getLogs } from '@/actions/log-actions'
import { LogsTable } from '@/components/logs/LogsTable'

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string; status?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const logs = await getLogs({
    jobName:  params.job,
    status:   params.status,
    fromDate: params.from,
    toDate:   params.to,
    limit:    200,
  })

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">실행 로그</h1>
      <div className="bg-white rounded-lg border p-6">
        <LogsTable logs={logs ?? []} />
      </div>
    </div>
  )
}
