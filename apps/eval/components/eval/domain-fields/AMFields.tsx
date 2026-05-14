'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

const NEED_OPTIONS = ['필요', '불필요']

const AM_ITEMS = [
  ['am_door_key',       '열쇠로 문 여닫기'],
  ['am_ignition',       '열쇠로 시동 ON/OFF'],
  ['am_transfer',       '타고내리기 (좌석이동)'],
  ['am_posture',        '올바른 자세 유지'],
  ['am_seatbelt',       '안전벨트 사용하기'],
  ['am_steering',       '핸들 사용'],
  ['am_gear',           '기어 사용'],
  ['am_brake',          '브레이크 사용'],
  ['am_parking_brake',  '주차 브레이크 사용'],
  ['am_accelerator',    '엑셀레이터 사용'],
  ['am_switches',       '차량 내부 각종 스위치'],
  ['am_loading',        '탑재 (휠체어/스쿠터 등)'],
  ['am_entry',          '차량 내 진입 (휠체어 탑승 상태)'],
  ['am_spasticity',     '경직 및 강직'],
] as const

export function AMFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="차량 기본 정보">
        <TextRow label="현재 소유 차량" value={str(data.vehicle_model)}
          onChange={v => set('vehicle_model', v)} placeholder="차종 및 모델명" wide />
        <Radio label="운전 면허"
          value={str(data.license)}
          options={['1종보통', '2종보통', '갱신예정', '없음(취소)', '기타']}
          onChange={v => set('license', v)} />
        <TextRow label="운전 경력" value={str(data.driving_experience)}
          onChange={v => set('driving_experience', v)} placeholder="장애 전/후 경력 (년)" />
        <MultiCheck label="운전 교육"
          options={['운전기능과정', '도로주행과정', '중도장애적응', '기타']}
          values={arr(data.driving_education)} onChange={v => set('driving_education', v)} />
        <Radio label="자동차 종류"
          value={str(data.vehicle_type)}
          options={['승용', '승합', '화물', '구입예정', '기타']}
          onChange={v => set('vehicle_type', v)} />
      </Sec>

      <Sec title="보조기기 필요 여부">
        <div className="space-y-3">
          {AM_ITEMS.map(([key, label]) => (
            <div key={key} className="flex items-start gap-3">
              <span className="text-sm text-gray-700 w-44 shrink-0">{label}</span>
              <div className="flex flex-wrap gap-3">
                {NEED_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-1 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      className="accent-blue-600"
                      checked={str(data[key]) === opt}
                      onChange={() => set(key, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              <input
                type="text"
                className="border rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="상세 내용"
                value={str(data[`${key}_detail`])}
                onChange={e => set(`${key}_detail`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Sec>
    </div>
  )
}
