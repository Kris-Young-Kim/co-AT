'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

const ADL_OPTIONS = ['자가 수행 가능', '보조기기/도움으로 수행 가능', '완전 의존']

export function ADLFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="일상생활동작 (ADL)">
        {([
          ['adl_grooming',  '몸치장하기'],
          ['adl_eating',    '식사하기'],
          ['adl_bathing',   '목욕하기'],
          ['adl_dressing',  '옷입기'],
          ['adl_toilet',    '화장실 이동과 사용'],
          ['adl_bowel',     '대변 조절'],
          ['adl_bladder',   '소변 조절'],
        ] as const).map(([key, label]) => (
          <Radio key={key} label={label}
            value={str(data[key])} options={ADL_OPTIONS}
            onChange={v => set(key, v)} />
        ))}
      </Sec>

      <Sec title="욕창">
        <Radio label="욕창 여부" value={str(data.pressure_sore)}
          options={['없음', '있음']} onChange={v => set('pressure_sore', v)} />
        <TextRow label="부위" value={str(data.pressure_sore_site)} onChange={v => set('pressure_sore_site', v)} placeholder="있을 경우 부위 입력" />
        <Radio label="발생 이력" value={str(data.pressure_sore_history)}
          options={['없음', '있음']} onChange={v => set('pressure_sore_history', v)} />
        <TextRow label="이력 상세" value={str(data.pressure_sore_history_detail)} onChange={v => set('pressure_sore_history_detail', v)} placeholder="부위, 시기" />
        <Radio label="발생 징후" value={str(data.pressure_sore_sign)}
          options={['없음', '있음']} onChange={v => set('pressure_sore_sign', v)} />
      </Sec>

      <Sec title="욕창예방 보조기기">
        <MultiCheck label="유형" options={['방석', '매트리스']}
          values={arr(data.cushion_type)} onChange={v => set('cushion_type', v)} />
        <TextRow label="사이즈 (가로×세로×높이)" value={str(data.cushion_size)} onChange={v => set('cushion_size', v)} placeholder="예: 45×45×10 cm" />
        <MultiCheck label="종류" options={['공기', '스펀지', '젤', '기타']}
          values={arr(data.cushion_material)} onChange={v => set('cushion_material', v)} />
      </Sec>

      <Sec title="스마트기기">
        <Radio label="보유 여부" value={str(data.smart_device_owned)}
          options={['보유', '미보유']} onChange={v => set('smart_device_owned', v)} />
        <Radio label="사용 희망 여부" value={str(data.smart_device_want)}
          options={['사용 희망', '사용 계획 없음']} onChange={v => set('smart_device_want', v)} />
        <MultiCheck label="대체 입력 방식"
          options={['스틱(입)', '스틱(손)', '스틱(머리)', '음성', '스위치', '기타']}
          values={arr(data.smart_input)} onChange={v => set('smart_input', v)} />
        <Radio label="거치대 필요 여부" value={str(data.smart_mount)}
          options={['필요함', '필요하지 않음']} onChange={v => set('smart_mount', v)} />
      </Sec>
    </div>
  )
}
