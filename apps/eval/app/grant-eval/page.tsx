import { listGrantAssessments } from '@/actions/grant-assessment-actions'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import GrantEvalKanban from '@/eval/components/grant-eval/GrantEvalKanban'
import { cn } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ year?: string; org?: string; status?: string; view?: string }>
}

const RESULT_COLOR: Record<string, string> = {
  '적합': 'bg-green-100 text-green-700',
  '부적합': 'bg-red-100 text-red-700',
  '조건부적합': 'bg-yellow-100 text-yellow-700',
  '보류': 'bg-gray-100 text-gray-600',
  '취소': 'bg-gray-100 text-gray-400',
}

const STATUS_LABEL: Record<string, string> = {
  draft: '작성중',
  submitted: '제출됨',
  completed: '완료',
}

export default async function GrantEvalListPage({ searchParams }: Props) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear()
  const org = params.org
  const status = params.status
  const view = params.view === 'board' ? 'board' : 'list'

  const result = await listGrantAssessments({ year, referralOrg: org, status })
  const assessments = result.success ? result.assessments ?? [] : []

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">교부사업 적합성 평가</h1>
          <p className="text-sm text-gray-500 mt-1">총 {assessments.length}건</p>
        </div>
        <Link
          href="/grant-eval/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          새 평가 등록
        </Link>
      </div>

      {/* 필터 */}
      <form method="GET" className="flex gap-3 mb-6 flex-wrap">
        <input type="hidden" name="view" value={view} />
        <select
          name="year"
          defaultValue={year}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <input
          name="org"
          defaultValue={org}
          placeholder="의뢰기관 검색"
          className="px-3 py-2 border rounded-md text-sm focus:outline-none w-48"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="px-3 py-2 border rounded-md text-sm focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="draft">작성중</option>
          <option value="submitted">제출됨</option>
          <option value="completed">완료</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
          검색
        </button>
      </form>

      {/* 뷰 토글 */}
      <div className="flex gap-2 mb-4">
        <Link
          href={`/grant-eval?year=${year}${org ? `&org=${org}` : ''}${status ? `&status=${status}` : ''}&view=list`}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md border font-medium transition-colors",
            view === 'list' ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 hover:bg-gray-50"
          )}
        >
          목록
        </Link>
        <Link
          href={`/grant-eval?year=${year}${org ? `&org=${org}` : ''}${status ? `&status=${status}` : ''}&view=board`}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md border font-medium transition-colors",
            view === 'board' ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 hover:bg-gray-50"
          )}
        >
          보드
        </Link>
      </div>

      {view === 'board' ? (
        <GrantEvalKanban assessments={assessments} />
      ) : (
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">대상자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">생년월일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">의뢰기관</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">평가일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신청품목</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">결과</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assessments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {year}년 교부사업 평가 내역이 없습니다
                </td>
              </tr>
            ) : (
              assessments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/grant-eval/${a.id}`} className="font-medium text-blue-700 hover:underline">
                      {a.client_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.birth_date ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.referral_org ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.evaluation_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(a.item_categories ?? []).map((cat, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                      {a.item_count === 0 && <span className="text-gray-400 text-xs">미입력</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.final_result ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${RESULT_COLOR[a.final_result] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.final_result}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">미결정</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{STATUS_LABEL[a.status] ?? a.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
