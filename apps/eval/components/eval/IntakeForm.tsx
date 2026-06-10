'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createIntakeRecord } from '@/actions/intake-actions'
import { Plus, Trash2 } from 'lucide-react'

const INPUT_CLASS = 'w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

interface DeviceRecord {
  name: string
  in_use: boolean
  source: string
  year: string
}

interface IntakeFormProps {
  clientId: string
  applicationId: string
}

export function IntakeForm({ clientId, applicationId }: IntakeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [consultationContent, setConsultationContent] = useState('')
  const [mainActivityPlace, setMainActivityPlace] = useState('')
  const [activityPosture, setActivityPosture] = useState('')
  const [mainSupporter, setMainSupporter] = useState('')
  const [environmentLimitations, setEnvironmentLimitations] = useState('')

  const [devices, setDevices] = useState<DeviceRecord[]>([])

  function addDevice() {
    setDevices(prev => [...prev, { name: '', in_use: false, source: '', year: '' }])
  }

  function removeDevice(index: number) {
    setDevices(prev => prev.filter((_, i) => i !== index))
  }

  function updateDevice(index: number, field: keyof DeviceRecord, value: string | boolean) {
    setDevices(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const validDevices = devices.filter(d => d.name.trim())

    const result = await createIntakeRecord({
      application_id: applicationId,
      client_id: clientId,
      consult_date: fd.get('consult_date') as string,
      consultation_content: consultationContent || undefined,
      main_activity_place: mainActivityPlace || undefined,
      activity_posture: activityPosture || undefined,
      main_supporter: mainSupporter || undefined,
      environment_limitations: environmentLimitations || undefined,
      current_devices: validDevices.length > 0 ? validDevices : undefined,
    })

    if (!result.success) {
      setError(result.error ?? '저장에 실패했습니다')
      setIsSubmitting(false)
      return
    }

    router.push(`/clients/${clientId}/applications/${applicationId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상담일 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="consult_date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="border rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">상담 내용</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상담 내용</label>
          <textarea
            value={consultationContent}
            onChange={(e) => setConsultationContent(e.target.value)}
            rows={5}
            placeholder="상담 내용을 입력하세요"
            className={INPUT_CLASS}
          />
        </div>
      </section>

      <section className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">활동 및 환경 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 장소</label>
            <input
              type="text"
              value={mainActivityPlace}
              onChange={(e) => setMainActivityPlace(e.target.value)}
              placeholder="예) 자택, 직장, 학교"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 활동 자세</label>
            <input
              type="text"
              value={activityPosture}
              onChange={(e) => setActivityPosture(e.target.value)}
              placeholder="예) 앉기, 서기, 눕기"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주 부양자</label>
            <input
              type="text"
              value={mainSupporter}
              onChange={(e) => setMainSupporter(e.target.value)}
              placeholder="예) 배우자, 부모, 자녀"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">환경적 제한 사항</label>
            <input
              type="text"
              value={environmentLimitations}
              onChange={(e) => setEnvironmentLimitations(e.target.value)}
              placeholder="예) 엘리베이터 없음, 문턱 있음"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* 보조기기 사용 경험 */}
      <section className="border rounded-lg p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">보조기기 사용 경험</h3>
            <p className="text-xs text-gray-500 mt-0.5">과거 및 현재 사용 중인 보조기기를 기록합니다</p>
          </div>
          <button
            type="button"
            onClick={addDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            <Plus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">등록된 보조기기가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-center p-3 bg-gray-50 rounded-lg border">
                <input
                  type="text"
                  value={device.name}
                  onChange={e => updateDevice(index, 'name', e.target.value)}
                  placeholder="기기명"
                  className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={device.source}
                  onChange={e => updateDevice(index, 'source', e.target.value)}
                  placeholder="구분 (급여/자비 등)"
                  className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={device.year}
                  onChange={e => updateDevice(index, 'year', e.target.value)}
                  placeholder="취득년도"
                  className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={device.in_use}
                    onChange={e => updateDevice(index, 'in_use', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  사용중
                </label>
                <button
                  type="button"
                  onClick={() => removeDevice(index)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
