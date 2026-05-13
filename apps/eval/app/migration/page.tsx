import { getSyncStats, getSyncLogs } from '@/actions/migration-actions'
import { importClientsFile, importCallLogsFile, importServiceRecordsFile } from '@/actions/import-actions'
import { FileImportCard } from '@/eval/components/eval/FileImportCard'
import { CheckCircle, XCircle } from 'lucide-react'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export default async function MigrationPage() {
  const [statsResult, logsResult] = await Promise.all([
    getSyncStats(),
    getSyncLogs(20),
  ])

  const stats = statsResult.success ? statsResult : null
  const logs = logsResult.success ? logsResult.logs ?? [] : []

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">데이터 가져오기</h1>
      <p className="text-sm text-gray-500 mb-8">
        Excel / CSV 파일을 업로드해 Supabase로 가져옵니다. 중복 데이터는 자동으로 건너뜁니다.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <FileImportCard
          label="대상자 정보"
          description={`${stats?.clientCount ?? '—'}명 등록됨 · 마지막: ${formatDate(stats?.lastClientSync)}`}
          action={importClientsFile}
        />
        <FileImportCard
          label="콜센터 상담 일지"
          description={`${stats?.callLogCount ?? '—'}건 등록됨 · 마지막: ${formatDate(stats?.lastCallLogSync)}`}
          action={importCallLogsFile}
        />
        <FileImportCard
          label="서비스 실적"
          description={`${stats?.serviceRecordCount ?? '—'}건 등록됨 · 마지막: ${formatDate(stats?.lastServiceRecordSync)}`}
          action={importServiceRecordsFile}
        />
      </div>

      <h2 className="text-base font-semibold text-gray-900 mb-3">최근 가져오기 이력</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">가져오기 이력이 없습니다.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">일시</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">유형</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">결과</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">추가</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">건너뜀</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{formatDate(log.synced_at)}</td>
                  <td className="px-4 py-3">
                    {log.sheet_type === 'call_log' ? '콜센터 상담'
                      : log.sheet_type === 'service_record' ? '서비스 실적'
                      : log.sheet_type === 'client' ? '대상자 정보'
                      : log.sheet_type}
                  </td>
                  <td className="px-4 py-3">
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" /> 성공
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600" title={log.error_msg ?? ''}>
                        <XCircle className="h-4 w-4" /> 오류
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{log.rows_added}건</td>
                  <td className="px-4 py-3 text-right text-gray-400">{log.rows_skipped}건</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
