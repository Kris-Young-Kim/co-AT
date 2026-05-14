'use client'

import { Sec, Radio, MultiCheck, str, arr, type DomainFieldProps } from './shared'

const POSTURE_OPTIONS = ['앉은 자세', '바로 누운 자세', '옆으로 누운 자세', '기타']

export function CAFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="컴퓨터 소유 및 경험">
        <Radio label="컴퓨터 소유"
          value={str(data.pc_owned)}
          options={['없음', '노트북', '데스크탑']}
          onChange={v => set('pc_owned', v)} />
        <Radio label="컴퓨터 사용 경험"
          value={str(data.pc_experience)}
          options={['있음', '없음']}
          onChange={v => set('pc_experience', v)} />
      </Sec>

      <Sec title="사용 자세">
        <Radio label="현재 사용 자세"
          value={str(data.pc_current_posture)}
          options={POSTURE_OPTIONS}
          onChange={v => set('pc_current_posture', v)} />
        <Radio label="원하는 사용 자세"
          value={str(data.pc_desired_posture)}
          options={POSTURE_OPTIONS}
          onChange={v => set('pc_desired_posture', v)} />
      </Sec>

      <Sec title="입력 장치 사용">
        <Radio label="일반 마우스 사용"
          value={str(data.mouse_use)}
          options={['사용 가능', '보조 도구와 함께 혹은 개조하여 사용', '사용 불가능']}
          onChange={v => set('mouse_use', v)} />
        <Radio label="일반 키보드 사용"
          value={str(data.keyboard_use)}
          options={['사용 가능', '보조 도구와 함께 혹은 개조하여 사용', '사용 불가능']}
          onChange={v => set('keyboard_use', v)} />
      </Sec>

      <Sec title="적합한 신체 부위">
        <MultiCheck label="신체 부위"
          options={['눈', '머리', '입술', '왼팔', '오른팔', '손(왼손)', '손(오른손)', '손(양손)',
            '손가락(왼손)', '손가락(오른손)', '손가락(양손)', '왼발/다리', '오른발/다리', '기타']}
          values={arr(data.body_part)} onChange={v => set('body_part', v)} />
      </Sec>

      <Sec title="필요 사항">
        <MultiCheck label="필요 기능"
          options={['단어 예측', '마운팅', '키가드', '고정키', '마우스 속도 조절', '기타']}
          values={arr(data.ca_needs)} onChange={v => set('ca_needs', v)} />
      </Sec>
    </div>
  )
}
