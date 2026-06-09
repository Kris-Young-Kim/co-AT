import { NewGrantAssessmentForm } from '@/eval/components/grant-eval/NewGrantAssessmentForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewGrantEvalPage() {
  return (
    <div className="p-8">
      <Link
        href="/grant-eval"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">새 교부사업 평가 등록</h1>
        <p className="text-sm text-gray-500 mt-1">대상자 검색 후 평가를 시작합니다</p>
      </div>
      <NewGrantAssessmentForm />
    </div>
  )
}
