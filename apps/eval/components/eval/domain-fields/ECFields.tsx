'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

export function ECFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="주거 정보">
        <Radio label="주거 형태"
          value={str(data.housing_type)}
          options={['아파트', '단독주택', '연립', '오피스텔', '기타']}
          onChange={v => set('housing_type', v)} />
        <TextRow label="층수" value={str(data.housing_floor)} onChange={v => set('housing_floor', v)} placeholder="층" />
        <Radio label="주택 소유 형태"
          value={str(data.housing_ownership)}
          options={['자가', '전세', '월세', '영구임대', '기타']}
          onChange={v => set('housing_ownership', v)} />
        <Radio label="개조 여부"
          value={str(data.modified)}
          options={['개조하지 않음', '개조함']}
          onChange={v => set('modified', v)} />
        <TextRow label="개조 상세" value={str(data.modified_detail)} onChange={v => set('modified_detail', v)} wide />
      </Sec>

      <Sec title="단차 해소">
        <Radio label="단차 해소 필요 여부"
          value={str(data.step_removal)}
          options={['필요', '불필요']}
          onChange={v => set('step_removal', v)} />
        <div className="flex gap-3">
          <TextRow label="위치" value={str(data.step_location)} onChange={v => set('step_location', v)} />
          <TextRow label="높이" value={str(data.step_height)} onChange={v => set('step_height', v)} placeholder="cm" />
          <TextRow label="너비" value={str(data.step_width)} onChange={v => set('step_width', v)} placeholder="cm" />
        </div>
      </Sec>

      <Sec title="환경개조 필요 영역">
        <MultiCheck label="매개시설"
          options={['외부접근로', '주차구역', '출입구']}
          values={arr(data.access_areas)} onChange={v => set('access_areas', v)} />
        <MultiCheck label="내부시설"
          options={['출입문', '복도', '계단', '경사로', '승강기']}
          values={arr(data.interior_areas)} onChange={v => set('interior_areas', v)} />
        <MultiCheck label="위생시설"
          options={['화장실 접근', '대소변기', '세면대', '욕실']}
          values={arr(data.sanitary_areas)} onChange={v => set('sanitary_areas', v)} />
        <TextRow label="기타" value={str(data.other_areas)} onChange={v => set('other_areas', v)} wide />
        <Radio label="개조 가능 여부"
          value={str(data.modification_possible)}
          options={['가능', '불가능']}
          onChange={v => set('modification_possible', v)} />
        <TextRow label="불가능 사유" value={str(data.modification_reason)} onChange={v => set('modification_reason', v)} wide />
      </Sec>

      <Sec title="IoT 평가">
        <MultiCheck label="제어 희망 장비"
          options={['전등', '창문', 'TV', '가스밸브', '현관문', '보일러', '초인종', '기타']}
          values={arr(data.iot_devices)} onChange={v => set('iot_devices', v)} />
        <MultiCheck label="대체 입력 수단"
          options={['스마트폰', '스위치', '음성', '기타']}
          values={arr(data.iot_input)} onChange={v => set('iot_input', v)} />
      </Sec>
    </div>
  )
}
