import type { AssessmentNote } from "@/actions/case-record-actions"
import type { Client } from "@/actions/client-actions"

interface AssessmentNotePrintViewProps {
  notes: AssessmentNote[]
  client: Client
}

const FIELDS: { key: keyof AssessmentNote; label: string }[] = [
  { key: "physical_function", label: "신체기능 평가" },
  { key: "cognitive_function", label: "인지기능 평가" },
  { key: "environment", label: "환경 요인" },
  { key: "device_needs", label: "보조기기 필요도" },
  { key: "recommendations", label: "추천 사항" },
  { key: "notes", label: "비고" },
]

export function AssessmentNotePrintView({ notes, client }: AssessmentNotePrintViewProps) {
  return (
    <div className="p-10 max-w-[800px] mx-auto font-sans text-sm print:p-4">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold tracking-widest">평  가  지</h1>
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
            <td className="border border-gray-400 px-3 py-2" colSpan={3}>
              {[client.disability_type, client.disability_grade].filter(Boolean).join(" ") || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 평가 기록 */}
      {notes.map((note, i) => (
        <div key={note.id} className={i > 0 ? "mt-10 pt-6 border-t-2 border-gray-400" : ""}>
          <table className="w-full border-collapse border border-gray-400 mb-4">
            <tbody>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">평가일</th>
                <td className="border border-gray-400 px-3 py-2 w-40">{note.assessment_date}</td>
                <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-28">평가자</th>
                <td className="border border-gray-400 px-3 py-2">{note.assessor ?? "—"}</td>
              </tr>
            </tbody>
          </table>

          {FIELDS.map(({ key, label }) =>
            note[key] ? (
              <div key={key} className="border border-gray-400 mb-2">
                <div className="bg-gray-100 px-3 py-1.5 font-semibold text-xs border-b border-gray-400">
                  {label}
                </div>
                <p className="px-3 py-2 whitespace-pre-wrap min-h-[48px]">
                  {String(note[key])}
                </p>
              </div>
            ) : null
          )}

          <div className="text-right mt-4">
            <p className="text-gray-500 text-xs">평가자: _______________  (서명 또는 인)</p>
          </div>
        </div>
      ))}

      <div className="text-right text-gray-400 text-xs mt-8">
        출력일: {new Date().toLocaleDateString("ko-KR")}
      </div>
    </div>
  )
}
