'use client'

import { Sec, Radio, MultiCheck, NumRow, str, arr, type DomainFieldProps } from './shared'

const POSTURE_STATE = ['구축', '부분구축', '교정가능']

export function SPFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="주된 활동 자세">
        <Radio label="활동 자세"
          value={str(data.main_posture)}
          options={['앉은 자세', '누운 자세', '선 자세', '기타']}
          onChange={v => set('main_posture', v)} />
      </Sec>

      <Sec title="자세 평가 — 골반">
        <Radio label="전/후방 경사"
          value={str(data.pelvis_tilt)}
          options={['중립', '후방', '전방']}
          onChange={v => set('pelvis_tilt', v)} />
        <Radio label="측방 경사"
          value={str(data.pelvis_lateral)}
          options={['중립', 'Rt경사', 'Lt경사']}
          onChange={v => set('pelvis_lateral', v)} />
        <Radio label="전후 회전"
          value={str(data.pelvis_rotation)}
          options={['중립', 'R전방', 'L전방']}
          onChange={v => set('pelvis_rotation', v)} />
        <MultiCheck label="관절 상태"
          options={POSTURE_STATE}
          values={arr(data.pelvis_joint)} onChange={v => set('pelvis_joint', v)} />
      </Sec>

      <Sec title="자세 평가 — 체간">
        <Radio label="전/후만 상태"
          value={str(data.trunk_sagittal)}
          options={['정상', '후만', '전만']}
          onChange={v => set('trunk_sagittal', v)} />
        <Radio label="측만 상태"
          value={str(data.trunk_lateral)}
          options={['정상', 'R측만', 'L측만']}
          onChange={v => set('trunk_lateral', v)} />
        <Radio label="회전 상태"
          value={str(data.trunk_rotation)}
          options={['정상', 'R전방', 'L전방']}
          onChange={v => set('trunk_rotation', v)} />
        <MultiCheck label="관절 상태"
          options={POSTURE_STATE}
          values={arr(data.trunk_joint)} onChange={v => set('trunk_joint', v)} />
      </Sec>

      <Sec title="자세 평가 — 엉덩관절">
        <Radio label="내/외전 상태"
          value={str(data.hip_abduction)}
          options={['중립', '외전', '내전']}
          onChange={v => set('hip_abduction', v)} />
        <Radio label="바람받이 변형"
          value={str(data.hip_windswept)}
          options={['중립', 'R변형', 'L변형']}
          onChange={v => set('hip_windswept', v)} />
        <Radio label="굴곡/신전 상태"
          value={str(data.hip_flexion)}
          options={['굴곡', '중립', '신전']}
          onChange={v => set('hip_flexion', v)} />
        <MultiCheck label="관절 상태"
          options={POSTURE_STATE}
          values={arr(data.hip_joint)} onChange={v => set('hip_joint', v)} />
      </Sec>

      <Sec title="자세 평가 — 무릎관절 / 발관절">
        <Radio label="무릎 굴곡/신전"
          value={str(data.knee_flexion)}
          options={['굴곡', '중립', '신전']}
          onChange={v => set('knee_flexion', v)} />
        <Radio label="발관절 배굴/저굴"
          value={str(data.ankle_flexion)}
          options={['저굴', '중립', '배굴']}
          onChange={v => set('ankle_flexion', v)} />
        <MultiCheck label="관절 상태"
          options={POSTURE_STATE}
          values={arr(data.knee_joint)} onChange={v => set('knee_joint', v)} />
      </Sec>

      <Sec title="자세 평가 — 머리 / 목">
        <Radio label="굴곡/신전"
          value={str(data.head_sagittal)}
          options={['굴곡', '중립', '신전']}
          onChange={v => set('head_sagittal', v)} />
        <Radio label="회전"
          value={str(data.head_rotation)}
          options={['중립', 'R회전', 'L회전']}
          onChange={v => set('head_rotation', v)} />
        <Radio label="측면 굴곡"
          value={str(data.head_lateral)}
          options={['중립', 'R굴곡', 'L굴곡']}
          onChange={v => set('head_lateral', v)} />
        <MultiCheck label="관절 상태"
          options={POSTURE_STATE}
          values={arr(data.head_joint)} onChange={v => set('head_joint', v)} />
      </Sec>

      <Sec title="신체 치수 측정">
        <div className="grid grid-cols-2 gap-2">
          <NumRow label="A — 앉은 어깨 높이" value={str(data.m_A)} onChange={v => set('m_A', v)} unit="cm" />
          <NumRow label="B — 앉은 겨드랑이 높이" value={str(data.m_B)} onChange={v => set('m_B', v)} unit="cm" />
          <NumRow label="C — 앉은 엉덩이오금 수평길이" value={str(data.m_C)} onChange={v => set('m_C', v)} unit="cm" />
          <NumRow label="D — 허리 두께" value={str(data.m_D)} onChange={v => set('m_D', v)} unit="cm" />
          <NumRow label="E — 앉은 엉덩이 너비" value={str(data.m_E)} onChange={v => set('m_E', v)} unit="cm" />
          <NumRow label="F — 가슴 너비" value={str(data.m_F)} onChange={v => set('m_F', v)} unit="cm" />
          <NumRow label="G — 앉은 오금 높이" value={str(data.m_G)} onChange={v => set('m_G', v)} unit="cm" />
          <NumRow label="H — 슬관절 너비" value={str(data.m_H)} onChange={v => set('m_H', v)} unit="cm" />
          <NumRow label="I — 팔꿈치 높이" value={str(data.m_I)} onChange={v => set('m_I', v)} unit="cm" />
          <NumRow label="P — 앉은 팔꿈치 높이" value={str(data.m_P)} onChange={v => set('m_P', v)} unit="cm" />
        </div>
      </Sec>

      <Sec title="카시트">
        <Radio label="카시트 필요 여부"
          value={str(data.car_seat)}
          options={['필요', '불필요']}
          onChange={v => set('car_seat', v)} />
        <MultiCheck label="옵션"
          options={['ISO FIX', '기타']}
          values={arr(data.car_seat_options)} onChange={v => set('car_seat_options', v)} />
      </Sec>
    </div>
  )
}
