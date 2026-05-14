'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

export function SFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="시각 — 우측">
        <Radio label="시각적 결함"
          value={str(data.vision_right_defect)}
          options={['없음', '저시력', '전맹']}
          onChange={v => set('vision_right_defect', v)} />
        <MultiCheck label="저시력 유형 (해당 시)"
          options={['편측 무시', '중복시각', '기타']}
          values={arr(data.vision_right_low_type)}
          onChange={v => set('vision_right_low_type', v)} />
        <Radio label="시야 결함"
          value={str(data.vision_right_field)}
          options={['없음', '있음']}
          onChange={v => set('vision_right_field', v)} />
      </Sec>

      <Sec title="시각 — 좌측">
        <Radio label="시각적 결함"
          value={str(data.vision_left_defect)}
          options={['없음', '저시력', '전맹']}
          onChange={v => set('vision_left_defect', v)} />
        <MultiCheck label="저시력 유형 (해당 시)"
          options={['편측 무시', '중복시각', '기타']}
          values={arr(data.vision_left_low_type)}
          onChange={v => set('vision_left_low_type', v)} />
        <Radio label="시야 결함"
          value={str(data.vision_left_field)}
          options={['없음', '있음']}
          onChange={v => set('vision_left_field', v)} />
      </Sec>

      <Sec title="시각 보조 정보">
        <MultiCheck label="대체가능 감각"
          options={['시각(확대)', '청각', '촉각']}
          values={arr(data.vision_alt_sense)} onChange={v => set('vision_alt_sense', v)} />
        <Radio label="선호 색상" value={str(data.vision_color_pref)}
          options={['없음', '파랑/노랑', '흑/백', '기타']} onChange={v => set('vision_color_pref', v)} />
        <Radio label="선호 위치" value={str(data.vision_pos_pref)}
          options={['없음', '왼쪽', '오른쪽']} onChange={v => set('vision_pos_pref', v)} />
        <Radio label="조명 상태 영향" value={str(data.vision_light)}
          options={['영향 없음', '있음']} onChange={v => set('vision_light', v)} />
        <Radio label="확대 글자 해독" value={str(data.vision_enlarge)}
          options={['가능', '불가능', '해당없음']} onChange={v => set('vision_enlarge', v)} />
        <Radio label="점자 판독" value={str(data.vision_braille)}
          options={['가능', '불가능', '해당없음']} onChange={v => set('vision_braille', v)} />
        <Radio label="데이지 플레이어" value={str(data.vision_daisy)}
          options={['사용가능', '사용불가능']} onChange={v => set('vision_daisy', v)} />
        <Radio label="컴퓨터 사용" value={str(data.vision_computer)}
          options={['사용가능', '사용불가능']} onChange={v => set('vision_computer', v)} />
        <Radio label="보행" value={str(data.vision_mobility)}
          options={['독립보행 가능', '흰지팡이', '보호자', '안내견', '기타']}
          onChange={v => set('vision_mobility', v)} />
      </Sec>

      <Sec title="청각">
        <Radio label="청각적 결함" value={str(data.hearing_defect)}
          options={['없음', '난청', '기타']} onChange={v => set('hearing_defect', v)} />
        <TextRow label="난청 청력 (Lt / Rt)" value={str(data.hearing_threshold)}
          onChange={v => set('hearing_threshold', v)} placeholder="예: 60dB / 50dB" />
        <Radio label="청신경 손상" value={str(data.hearing_nerve)}
          options={['없음', '있음', '모름', '기타']} onChange={v => set('hearing_nerve', v)} />
        <Radio label="언어 장애" value={str(data.hearing_speech)}
          options={['없음', '있음']} onChange={v => set('hearing_speech', v)} />
        <MultiCheck label="주된 소통 방법"
          options={['구화', '수화', '필담', '기타']}
          values={arr(data.hearing_comm)} onChange={v => set('hearing_comm', v)} />
        <MultiCheck label="대체가능 감각"
          options={['시각', '청각(확대)', '촉각', '기타']}
          values={arr(data.hearing_alt_sense)} onChange={v => set('hearing_alt_sense', v)} />
        <Radio label="큰 소리 반응" value={str(data.hearing_loud_response)}
          options={['없음', '있음']} onChange={v => set('hearing_loud_response', v)} />
        <Radio label="진동 감지" value={str(data.hearing_vibration)}
          options={['가능', '불가능']} onChange={v => set('hearing_vibration', v)} />
        <Radio label="보청기" value={str(data.hearing_aid)}
          options={['사용', '미사용(불필요)', '미사용(사용불가)']} onChange={v => set('hearing_aid', v)} />
      </Sec>
    </div>
  )
}
