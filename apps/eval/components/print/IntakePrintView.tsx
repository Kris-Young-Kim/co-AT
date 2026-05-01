import type { IntakeRecord } from '@/actions/intake-actions'
import type { Client } from '@/actions/client-actions'

interface IntakePrintViewProps {
  intake: IntakeRecord
  client: Client
}

export function IntakePrintView({ intake, client }: IntakePrintViewProps) {
  return (
    <div className="p-10 max-w-[800px] mx-auto font-sans text-sm">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold">보조기기 상담 기록지</h1>
        <p className="text-gray-500 mt-1">첨부 19</p>
      </div>

      <table className="w-full border-collapse border border-gray-400 mb-6">
        <tbody>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-32">성명</th>
            <td className="border border-gray-400 px-3 py-2">{client.name}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left w-32">생년월일</th>
            <td className="border border-gray-400 px-3 py-2">{client.birth_date ?? '—'}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">장애유형</th>
            <td className="border border-gray-400 px-3 py-2">{client.disability_type ?? '—'}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">상담일</th>
            <td className="border border-gray-400 px-3 py-2">{intake.consult_date}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">주 활동 장소</th>
            <td className="border border-gray-400 px-3 py-2">{intake.main_activity_place ?? '—'}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">활동 자세</th>
            <td className="border border-gray-400 px-3 py-2">{intake.activity_posture ?? '—'}</td>
          </tr>
          <tr>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">주 부양자</th>
            <td className="border border-gray-400 px-3 py-2">{intake.main_supporter ?? '—'}</td>
            <th className="border border-gray-400 bg-gray-100 px-3 py-2 text-left">환경 제한</th>
            <td className="border border-gray-400 px-3 py-2">{intake.environment_limitations ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      <div className="border border-gray-400 p-4 mb-6">
        <h3 className="font-semibold mb-2">상담 내용</h3>
        <p className="whitespace-pre-wrap min-h-[120px]">{intake.consultation_content ?? ''}</p>
      </div>

      <div className="text-right text-gray-500 mt-8">
        <p>출력일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  )
}
