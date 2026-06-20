'use client'

import type { ReferrerReferralStat } from '@/actions/referrer-actions'
import { TrendingUp, Clock } from 'lucide-react'

interface Props {
  stats: ReferrerReferralStat[]
  pendingCount: number
  referralCount: number
}

export function ReferrerReferralHistory({ stats, pendingCount, referralCount }: Props) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1)

  const currentYear = new Date().getFullYear()
  const thisYearTotal = stats
    .filter((s) => s.year === currentYear)
    .reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-white text-center">
          <p className="text-xs text-gray-500 mb-1">누적 의뢰</p>
          <p className="text-2xl font-bold text-blue-600">{referralCount}</p>
          <p className="text-xs text-gray-400">건</p>
        </div>
        <div className="border rounded-lg p-4 bg-white text-center">
          <p className="text-xs text-gray-500 mb-1">{currentYear}년 의뢰</p>
          <p className="text-2xl font-bold text-gray-900">{thisYearTotal}</p>
          <p className="text-xs text-gray-400">건</p>
        </div>
        <div className="border rounded-lg p-4 bg-white text-center">
          <p className="text-xs text-gray-500 mb-1">진행 중</p>
          <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
          <p className="text-xs text-gray-400">건</p>
        </div>
      </div>

      {/* 분기별 차트 */}
      {stats.length > 0 ? (
        <div className="border rounded-lg p-5 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-700">분기별 의뢰 현황</h3>
          </div>
          <div className="space-y-2">
            {stats.slice(0, 12).map((s) => (
              <div key={`${s.year}-${s.quarter}`} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 shrink-0">
                  {s.year}년 {s.quarter}분기
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-8 bg-white text-center">
          <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">아직 의뢰 이력이 없습니다.</p>
        </div>
      )}

      {/* 대기 현황 */}
      {pendingCount > 0 && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">
              현재 {pendingCount}건이 처리 대기 중입니다
            </p>
          </div>
          <p className="text-xs text-orange-600 mt-1 ml-6">
            서비스 기록에서 진행 상태를 확인하세요
          </p>
        </div>
      )}
    </div>
  )
}
