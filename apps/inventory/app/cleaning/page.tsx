export const dynamic = 'force-dynamic'

import { getDeviceCleaningStatus, getCleaningLogs } from '@/actions/cleaning-actions'
import { BatchCleaningForm } from '@/inventory/components/cleaning/BatchCleaningForm'
import { Droplets, AlertTriangle } from 'lucide-react'

export default async function CleaningPage() {
  const [statusResult, logsResult] = await Promise.all([
    getDeviceCleaningStatus(),
    getCleaningLogs(50),
  ])

  const devices = statusResult.success ? statusResult.devices : []
  const logs = logsResult.success ? logsResult.logs : []

  const overdueCount = devices.filter(d => (d.days_since_cleaning ?? Infinity) > 180).length
  const neverCleanedCount = devices.filter(d => d.last_cleaned_at === null).length

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-2">
        <Droplets className="h-6 w-6 text-cyan-600" />
        <h1 className="text-2xl font-bold text-gray-900">소독·세척 관리</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-xs text-gray-500 mb-1">전체 기기</p>
          <p className="text-2xl font-bold text-gray-900">{devices.length}대</p>
        </div>
        <div className={`border rounded-lg p-5 ${overdueCount > 0 ? 'bg-red-50' : 'bg-white'}`}>
          <p className="text-xs text-gray-500 mb-1">180일 초과 (세척 필요)</p>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{overdueCount}대</p>
        </div>
        <div className={`border rounded-lg p-5 ${neverCleanedCount > 0 ? 'bg-orange-50' : 'bg-white'}`}>
          <p className="text-xs text-gray-500 mb-1">세척 기록 없음</p>
          <p className={`text-2xl font-bold ${neverCleanedCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{neverCleanedCount}대</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Device status list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">기기별 세척 현황</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">기기명</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">마지막 세척일</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">경과일</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {devices.map(d => {
                  const overdue = (d.days_since_cleaning ?? Infinity) > 180
                  const neverCleaned = d.last_cleaned_at === null
                  return (
                    <tr key={d.device_id} className={`hover:bg-gray-50 ${overdue || neverCleaned ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{d.device_name}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500 text-xs">
                        {d.last_cleaned_at ? d.last_cleaned_at.split('T')[0] : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {neverCleaned ? (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500">
                            <AlertTriangle className="h-3 w-3" />기록없음
                          </span>
                        ) : overdue ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                            <AlertTriangle className="h-3 w-3" />{d.days_since_cleaning}일
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">{d.days_since_cleaning}일</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {devices.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">기기가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch form + recent logs */}
        <div className="space-y-6">
          <BatchCleaningForm devices={devices} />

          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900">최근 세척 이력</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">세척일</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">기기</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">담당자</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs text-gray-500">{(l.performed_at ?? l.created_at ?? '').split('T')[0]}</td>
                      <td className="px-4 py-2.5 text-gray-800">{l.device_name ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{l.technician ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400 max-w-xs truncate">{l.notes ?? '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">세척 이력이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
