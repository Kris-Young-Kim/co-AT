import { getDeviceOutcomes } from "@/actions/knowledge-actions"
import { BookOpen, Star, TrendingUp } from "lucide-react"

export default async function KnowledgePage() {
  const result = await getDeviceOutcomes()
  const rows = result.success ? result.rows ?? [] : []

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          보조기기 지원 결과 이력
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          제품별 · 장애유형별 지원 건수, 만족도 평균, K-IPPA 성과 평균
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white text-center text-sm text-gray-500">
          제품명이 기록된 서비스 데이터가 없습니다.
        </div>
      ) : (
        <div className="border rounded-lg bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-medium">제품명</th>
                <th className="px-4 py-3 text-left font-medium">장애유형</th>
                <th className="px-4 py-3 text-center font-medium">지원 건수</th>
                <th className="px-4 py-3 text-center font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3" /> 만족도 평균
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  <span className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> K-IPPA 성과
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.product_name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.disability_type ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {row.count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.avg_satisfaction != null ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                        {row.avg_satisfaction}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.avg_ippa_outcome != null ? (
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          row.avg_ippa_outcome > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {row.avg_ippa_outcome > 0 ? "+" : ""}
                        {row.avg_ippa_outcome}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400">
            총 {rows.length}개 제품 · 만족도 1~5점 · K-IPPA 성과: 양수일수록 개선
          </div>
        </div>
      )}
    </div>
  )
}
