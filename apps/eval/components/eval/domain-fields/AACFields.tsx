'use client'

import { Sec, Radio, MultiCheck, TextRow, str, arr, type DomainFieldProps } from './shared'

const EXPRESSION_OPTIONS = [
  '구어표현이 어려움',
  '표정/제스처/제한된발성으로 표현',
  '한 낱말 수준으로 대답',
  '2~3개 단어 조합/짧은 구/전보식 문장',
  '완벽한 문장',
]

const INTELLIGIBILITY_OPTIONS = [
  '모두 이해가능', '대부분 이해가능', '일부 이해가능', '대부분 이해불가능', '전혀 이해불가능',
]

const COMPREHENSION_OPTIONS = [
  '간단한 지시/예아니오 질문에 반응 못함',
  '간단한 지시/예아니오 질문에 반응, 제스처 동반 시 일부 가능',
  '친숙/반복 일상 상황에서 일부 대화 가능',
  '일상적 상황에서 대화 가능, 억양/제스처 이해',
  '은유적 표현도 이해, 짧은 이야기 이해',
]

const LITERACY_OPTIONS = [
  '전혀 못함',
  '통글자/통문장 형태로만 읽을 수 있음',
  '통글자/통문장 형태로만 만들고 읽을 수 있음',
  '간단한 단어와 일부 문장만 만들고 읽을 수 있음',
  '단어 및 문장을 만들고 읽을 수 있음',
]

const LEARNING_OPTIONS = [
  '전혀 불가능',
  '친숙/반복 일상에서 일부 상징/기능 교육 가능',
  '치료실/학교 구조화된 상황에서 반복 학습 가능',
  '다양한 상황에서 반복학습 가능',
  '학습을 통해 다양하게 응용 사용 가능',
]

export function AACFields({ data, set }: DomainFieldProps) {
  return (
    <div className="space-y-4">
      <Sec title="타기관 검사 결과">
        <Radio label="검사 결과"
          value={str(data.external_test)}
          options={['없음', '있음']}
          onChange={v => set('external_test', v)} />
        <div className="flex gap-3">
          <TextRow label="표현 언어 (세)" value={str(data.expressive_age)} onChange={v => set('expressive_age', v)} placeholder="세" />
          <TextRow label="수용 언어 (세)" value={str(data.receptive_age)} onChange={v => set('receptive_age', v)} placeholder="세" />
        </div>
      </Sec>

      <Sec title="발성 / 발화 / 대체 수단">
        <Radio label="발성" value={str(data.vocalization)}
          options={['유', '무']} onChange={v => set('vocalization', v)} />
        <Radio label="발화" value={str(data.verbalization)}
          options={['유', '무']} onChange={v => set('verbalization', v)} />
        <MultiCheck label="대체 수단"
          options={['구어', '수화', '필담', '제스처', '스마트기기', '기타']}
          values={arr(data.alt_means)} onChange={v => set('alt_means', v)} />
      </Sec>

      <Sec title="의사소통 — 요구/표현">
        <Radio label="인사하기/관심표현/주의끌기/물건요구/부정하기"
          value={str(data.comm_request)}
          options={EXPRESSION_OPTIONS}
          onChange={v => set('comm_request', v)}
          inline={false} />
      </Sec>

      <Sec title="의사소통 — 질문/명료화/선택">
        <Radio label="질문하기/예측하기/명료화요청/선택하기/감정표현"
          value={str(data.comm_complex)}
          options={EXPRESSION_OPTIONS}
          onChange={v => set('comm_complex', v)}
          inline={false} />
      </Sec>

      <Sec title="말 명료도">
        <Radio label="가까운 사람"
          value={str(data.intelligibility_familiar)}
          options={INTELLIGIBILITY_OPTIONS}
          onChange={v => set('intelligibility_familiar', v)}
          inline={false} />
        <Radio label="낯선 사람"
          value={str(data.intelligibility_stranger)}
          options={INTELLIGIBILITY_OPTIONS}
          onChange={v => set('intelligibility_stranger', v)}
          inline={false} />
      </Sec>

      <Sec title="청각적 이해력">
        <Radio label="이해력 수준"
          value={str(data.auditory_comprehension)}
          options={COMPREHENSION_OPTIONS}
          onChange={v => set('auditory_comprehension', v)}
          inline={false} />
      </Sec>

      <Sec title="상징화 / 언어훈련 / 학습인지">
        <Radio label="상징화"
          value={str(data.symbolization)}
          options={['인지하지 못함', '실물 또는 모형', '사진', '그림', '글자']}
          onChange={v => set('symbolization', v)} />
        <Radio label="철자법 및 문해력"
          value={str(data.literacy)}
          options={LITERACY_OPTIONS}
          onChange={v => set('literacy', v)}
          inline={false} />
        <Radio label="학습 인지"
          value={str(data.learning)}
          options={LEARNING_OPTIONS}
          onChange={v => set('learning', v)}
          inline={false} />
      </Sec>

      <Sec title="AAC 신체 부위 및 선택 방법">
        <MultiCheck label="적합한 신체 부위"
          options={['눈', '머리', '왼팔', '오른팔', '손(왼손)', '손(오른손)', '손(양손)',
            '손가락(왼손)', '손가락(오른손)', '손가락(양손)', '왼발/다리', '오른발/다리', '기타']}
          values={arr(data.body_part)} onChange={v => set('body_part', v)} />
        <MultiCheck label="직접 선택"
          options={['터치', '포인팅', '마우스', '눈 응시', '기타']}
          values={arr(data.direct_select)} onChange={v => set('direct_select', v)} />
        <Radio label="간접 선택 — 스캐닝"
          value={str(data.scanning)}
          options={['유', '무']}
          onChange={v => set('scanning', v)} />
        <MultiCheck label="심볼 유형"
          options={['사진', '그림', '글자판', '단어', '기타']}
          values={arr(data.symbol_type)} onChange={v => set('symbol_type', v)} />
        <MultiCheck label="기타 필요 사항"
          options={['단어예측', '마운팅', '키가드', '기타']}
          values={arr(data.aac_needs)} onChange={v => set('aac_needs', v)} />
        <Radio label="별도 단말기"
          value={str(data.dedicated_device)}
          options={['사용', '미사용(스마트기기 사용)', '미사용(기타)']}
          onChange={v => set('dedicated_device', v)} />
      </Sec>
    </div>
  )
}
