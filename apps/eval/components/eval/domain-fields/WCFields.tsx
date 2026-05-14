'use client'

import { Sec, Radio, MultiCheck, TextRow, NumRow, FieldRow, str, arr, type DomainFieldProps } from './shared'

const THREE_OPT = ['가능', '보조인/보조기기 도움으로 가능', '불가능']

export function WCFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="기본 신체 정보">
        <div className="grid grid-cols-2 gap-3">
          <TextRow label="키" value={str(data.height)} onChange={v => set('height', v)} placeholder="cm" />
          <TextRow label="몸무게" value={str(data.weight)} onChange={v => set('weight', v)} placeholder="kg" />
        </div>
        <Radio label="기립성 저혈압" value={str(data.orthostatic_hypotension)}
          options={['없음', '있음']} onChange={v => set('orthostatic_hypotension', v)} />
        <Radio label="스스로 서기" value={str(data.stand_alone)}
          options={['가능', '지지물 도움이 있을 경우 가능', '불가능']} onChange={v => set('stand_alone', v)} />
        <Radio label="자가 보행" value={str(data.self_ambulatory)}
          options={THREE_OPT} onChange={v => set('self_ambulatory', v)} />
        <Radio label="옮겨앉기 (Transfer)" value={str(data.transfer)}
          options={THREE_OPT} onChange={v => set('transfer', v)} />
      </Sec>

      <Sec title="이동 및 조작">
        <div className="flex gap-4">
          <TextRow label="이동방법 — 실내" value={str(data.mobility_indoor)} onChange={v => set('mobility_indoor', v)} />
          <TextRow label="이동방법 — 실외" value={str(data.mobility_outdoor)} onChange={v => set('mobility_outdoor', v)} />
        </div>
        <MultiCheck label="조작 능력"
          options={['손(왼손)', '손(오른손)', '발(왼발)', '발(오른발)', '턱', '머리', '호흡', '기타']}
          values={arr(data.manipulation)} onChange={v => set('manipulation', v)} />
      </Sec>

      <Sec title="욕창">
        <TextRow label="욕창 이력" wide value={str(data.pressure_sore_history)} onChange={v => set('pressure_sore_history', v)} placeholder="없음 / 있음(부위, 시기)" />
        <TextRow label="현재 욕창" wide value={str(data.pressure_sore_current)} onChange={v => set('pressure_sore_current', v)} placeholder="없음 / 있음(부위)" />
      </Sec>

      <Sec title="자가 추진 / 필요 기능">
        <Radio label="자가추진 — 수동 휠체어"
          value={str(data.self_propulsion)}
          options={['가능', '일부 가능', '불가능', '해당없음']}
          onChange={v => set('self_propulsion', v)} />
        <MultiCheck label="필요 기능 (종류)"
          options={['수동 휠체어', '전동 휠체어', '스쿠터']}
          values={arr(data.needed_type)} onChange={v => set('needed_type', v)} />
        <MultiCheck label="옵션"
          options={['틸팅', '리클라이닝', '엘리베이팅', '레그 엘리베이팅', '스탠딩', '기타']}
          values={arr(data.needed_options)} onChange={v => set('needed_options', v)} />
      </Sec>

      <Sec title="치수 측정">
        <div className="grid grid-cols-2 gap-2">
          <NumRow label="시트 깊이 (SD)" value={str(data.m_SD)} onChange={v => set('m_SD', v)} unit="cm" />
          <NumRow label="시트 너비 (SW)" value={str(data.m_SW)} onChange={v => set('m_SW', v)} unit="cm" />
          <NumRow label="바닥~시트 높이 (SH)" value={str(data.m_SH)} onChange={v => set('m_SH', v)} unit="cm" />
          <NumRow label="팔걸이 높이 (AH)" value={str(data.m_AH)} onChange={v => set('m_AH', v)} unit="cm" />
          <NumRow label="발걸이 높이 (LH)" value={str(data.m_LH)} onChange={v => set('m_LH', v)} unit="cm" />
          <NumRow label="발판 높이 (FL)" value={str(data.m_FL)} onChange={v => set('m_FL', v)} unit="cm" />
          <NumRow label="어깨 높이 (SDH)" value={str(data.m_SDH)} onChange={v => set('m_SDH', v)} unit="cm" />
          <NumRow label="등받이 높이 (BH)" value={str(data.m_BH)} onChange={v => set('m_BH', v)} unit="cm" />
        </div>
      </Sec>

      <Sec title="액세서리 / 기타 보조기기">
        <Radio label="액세서리"
          value={str(data.accessories)}
          options={['필요', '불필요']}
          onChange={v => set('accessories', v)} />
        <TextRow label="액세서리 상세" wide value={str(data.accessories_detail)} onChange={v => set('accessories_detail', v)} />
        <TextRow label="보행보조차 / 워커" wide value={str(data.walker)} onChange={v => set('walker', v)} />
        <TextRow label="목발 / 지팡이" wide value={str(data.crutch_cane)} onChange={v => set('crutch_cane', v)} />
        <TextRow label="기타 보조기기" wide value={str(data.other_device)} onChange={v => set('other_device', v)} />
      </Sec>
    </div>
  )
}
