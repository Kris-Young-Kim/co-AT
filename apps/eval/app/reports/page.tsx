'use client'

import { useState } from 'react'
import { DownloadReportButton } from '@/eval/components/eval/DownloadReportButton'
import {
  generateCallLogReport,
  generateServiceRecordReport,
  generateBusinessReport,
} from '@/actions/report-actions'

const currentYear = new Date().getFullYear()

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`)
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`)
  const [year, setYear] = useState(currentYear)

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">보고서 출력</h1>
      <p className="text-sm text-gray-500 mb-8">
        Supabase에 저장된 데이터를 중앙 보고 양식 엑셀로 다운로드합니다.
      </p>

      <div className="flex items-end gap-4 mb-8 p-4 bg-gray-50 rounded-lg border">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">연도 (사업 실적)</label>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm focus:outline-none"
          >
            {[2026, 2025, 2024].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">콜센터 상담 일지</h2>
          <p className="text-xs text-gray-500 mb-4">전화 상담 기록 원본 양식</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateCallLogReport({ startDate, endDate })}
          />
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">서비스 실적</h2>
          <p className="text-xs text-gray-500 mb-4">보조기기 서비스 상세 목록</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateServiceRecordReport({ startDate, endDate })}
          />
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">사업 실적보고 양식</h2>
          <p className="text-xs text-gray-500 mb-4">7개 시트 집계 보고서</p>
          <DownloadReportButton
            label="다운로드"
            action={() => generateBusinessReport({ year })}
          />
        </div>
      </div>
    </div>
  )
}
