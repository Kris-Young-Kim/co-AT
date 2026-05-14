'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

export function LFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="사용 환경">
        <MultiCheck label="환경"
          options={['실내', '실외(산)', '실외(바다)', '실외(강)', '실외(기타)']}
          values={arr(data.environment)} onChange={v => set('environment', v)} />
        <TextRow label="상세" value={str(data.environment_detail)} onChange={v => set('environment_detail', v)} wide />
      </Sec>

      <Sec title="근골격계">
        <Radio label="자세의 정렬"
          value={str(data.posture_alignment)}
          options={['대칭', '비대칭']}
          onChange={v => set('posture_alignment', v)} />
        <Radio label="기능적 각도 유지"
          value={str(data.functional_angle)}
          options={['가능', '일부가능', '불가능']}
          onChange={v => set('functional_angle', v)} />
        <Radio label="전방 미끄러짐"
          value={str(data.forward_slip)}
          options={['없음', '있음']}
          onChange={v => set('forward_slip', v)} />
        <Radio label="척추 변형"
          value={str(data.spine_deformity)}
          options={['해당 없음', '전만', '측만', '후만']}
          onChange={v => set('spine_deformity', v)} />
        <TextRow label="척추 변형 각도" value={str(data.spine_degree)} onChange={v => set('spine_degree', v)} placeholder="°" />
        <Radio label="관절 구축"
          value={str(data.joint_contracture)}
          options={['해당 없음', '있음']}
          onChange={v => set('joint_contracture', v)} />
        <TextRow label="구축 부위" value={str(data.joint_contracture_site)} onChange={v => set('joint_contracture_site', v)} />
        <Radio label="견관절"
          value={str(data.shoulder_joint)}
          options={['해당 없음', '탈구(Lt)', '탈구(Rt)', '아탈구(Lt)', '아탈구(Rt)']}
          onChange={v => set('shoulder_joint', v)} />
        <Radio label="고관절"
          value={str(data.hip_joint)}
          options={['해당 없음', '탈구(Lt)', '탈구(Rt)', '아탈구(Lt)', '아탈구(Rt)']}
          onChange={v => set('hip_joint', v)} />
        <Radio label="독립적 체위 변환"
          value={str(data.position_change)}
          options={['가능', '불가능']}
          onChange={v => set('position_change', v)} />
      </Sec>

      <Sec title="착석">
        <Radio label="균형 유지"
          value={str(data.sitting_balance)}
          options={['가능', '보조기기 있을 경우 가능', '불가능']}
          onChange={v => set('sitting_balance', v)} />
        <Radio label="지지 필요"
          value={str(data.sitting_support)}
          options={['필요', '보조기기 있을 경우 가능', '불필요']}
          onChange={v => set('sitting_support', v)} />
      </Sec>

      <Sec title="인지 및 훈련">
        <Radio label="인지적 결함"
          value={str(data.cognitive_defect)}
          options={['없음', '있음']}
          onChange={v => set('cognitive_defect', v)} />
        <MultiCheck label="결함 유형"
          options={['입체감각', '도서감각', '실행', '시지각', '신체상', '기타']}
          values={arr(data.cognitive_type)} onChange={v => set('cognitive_type', v)} />
        <MultiCheck label="운동 및 훈련"
          options={['상하지운동', '스트레칭', '밸런스유지', '기타']}
          values={arr(data.exercise)} onChange={v => set('exercise', v)} />
      </Sec>
    </div>
  )
}
