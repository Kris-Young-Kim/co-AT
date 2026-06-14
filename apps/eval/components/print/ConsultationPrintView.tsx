import type { ConsultationRecord } from "@/actions/case-record-actions"
import type { Client } from "@/actions/client-actions"

interface ConsultationPrintViewProps {
  records: ConsultationRecord[]
  client: Client
}

const FIELDS: { key: keyof ConsultationRecord; label: string }[] = [
  { key: "purpose", label: "방문·상담 목적 / 주호소" },
  { key: "current_situation", label: "현재 상황" },
  { key: "content", label: "상담 내용" },
  { key: "result", label: "결과 및 조치사항" },
  { key: "next_plan", label: "향후 계획" },
]

export function ConsultationPrintView({ records, client }: ConsultationPrintViewProps) {
  return (
    <div className="p-10 max-w-[800px] mx-auto font-sans text-sm print:p-4">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold tracking-widest">상 담 기 록 지</h1>
      </div>

      {/* 대상자 정보 */}
      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">성명</th>
            <td className="border border-gray-400 px-3 py-2 w-40">{client.name}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">생년월일</th>
            <td className="border border-gray-400 px-3 py-2">{client.birth_date ?? "—"}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">장애유형</th>
            <td className="border border-gray-400 px-3 py-2 col-span-3" colSpan={3}>
              {[client.disability_type, client.disability_grade].filter(Boolean).join(" ") || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 상담 기록 */}
      {records.map((record, i) => (
        <div key={record.id} className={i > 0 ? "mt-10 pt-6 border-t-2 border-gray-400" : ""}>
          <table className="w-full border-collapse border border-gray-400 mb-4">
            <tbody>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">상담일</th>
                <td className="border border-gray-400 px-3 py-2 w-40">{record.consultation_date}</td>
                <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">상담유형</th>
                <td className="border border-gray-400 px-3 py-2">{record.consultation_type}</td>
              </tr>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">상담자</th>
                <td className="border border-gray-400 px-3 py-2" colSpan={3}>{record.consultant ?? "—"}</td>
              </tr>
            </tbody>
          </table>

          {FIELDS.map(({ key, label }) =>
            record[key] ? (
              <div key={key} className="border border-gray-400 mb-2">
                <div className="bg-gray-100 px-3 py-1.5 font-semibold text-xs border-b border-gray-400">
                  {label}
                </div>
                <p className="px-3 py-2 whitespace-pre-wrap min-h-[48px]">
                  {String(record[key])}
                </p>
              </div>
            ) : null
          )}
        </div>
      ))}

      <div className="text-right text-gray-400 text-xs mt-8">
        출력일: {new Date().toLocaleDateString("ko-KR")}
      </div>
    </div>
  )
}
