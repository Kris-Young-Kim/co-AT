# AI 상담기록지 초안 생성 설계

**날짜:** 2026-05-17  
**앱:** `apps/eval`  
**상태:** 승인됨

---

## 개요

IntakeForm(상담기록지 작성 화면)에서 직원이 짧은 메모를 입력하면 Gemini AI가
`consultation_content`, `main_activity_place`, `activity_posture`, `main_supporter`,
`environment_limitations` 5개 필드의 초안을 생성해준다.
직원은 AI 초안을 그대로 쓰거나 수정 후 저장한다.

---

## 1. 변경 파일

| 파일 | 변경 유형 |
|------|-----------|
| `actions/ai-actions.ts` | 수정 — `generateIntakeDraft` 추가 |
| `apps/eval/components/eval/IntakeForm.tsx` | 수정 — AI 섹션 추가, 5개 필드 controlled 전환 |

DB 변경 없음. 패키지 추가 없음.

---

## 2. Server Action: `generateIntakeDraft`

### 파일: `actions/ai-actions.ts`

기존 `generateSoapNote` 패턴을 그대로 따른다.

#### 함수 시그니처

```typescript
export interface IntakeDraftInput {
  memo: string          // 직원이 입력한 짧은 메모 (필수)
  applicationId: string // 신청 ID (context 조회용)
  clientId: string      // 클라이언트 ID (context 조회용)
}

export interface IntakeDraft {
  consultation_content: string
  main_activity_place: string
  activity_posture: string
  main_supporter: string
  environment_limitations: string
}

export async function generateIntakeDraft(
  input: IntakeDraftInput
): Promise<{ success: boolean; draft?: IntakeDraft; error?: string }>
```

#### 내부 로직

1. `hasAdminOrStaffPermission()` + `auth()` 확인 (기존 패턴 동일)
2. `memo` 빈값 검증
3. Supabase에서 context 조회 (service role client):
   - clients: `name`, `birth_date`, `disability_type`
   - domain_assessments: `domain`, `evaluator_opinion` — 최대 9개 행, `client_id = input.clientId`
4. Gemini 2.0 Flash 호출 (JSON-only 응답)
5. 마크다운 코드블록 제거 후 JSON 파싱
6. 5개 필드 존재 검증

#### Supabase client import

`actions/ai-actions.ts`에 아직 Supabase import 없음. 추가 필요:

```typescript
import { createSupabaseAdmin } from "@/lib/supabase/admin"
```

#### 시스템 프롬프트 (한국어)

```
당신은 보조기기센터 전문가입니다. 아래 제공된 메모와 클라이언트 정보를 바탕으로
상담기록지 초안을 JSON 형식으로 생성해주세요.

클라이언트 정보:
{clientContext}

영역별 평가 의견:
{assessmentContext}

직원 메모:
{memo}

다음 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요:
{
  "consultation_content": "상담 내용 요약 (3~5문장)",
  "main_activity_place": "주 활동 장소 (예: 자택, 직장)",
  "activity_posture": "주 활동 자세 (예: 앉기, 서기)",
  "main_supporter": "주 부양자 (예: 배우자, 부모)",
  "environment_limitations": "환경적 제한 사항 (예: 엘리베이터 없음)"
}
```

`{clientContext}` 예시: `이름: 홍길동, 생년월일: 1980-03-15, 장애유형: physical`  
`{assessmentContext}` 예시: domain_assessments 행이 없으면 `"평가 정보 없음"`; 있으면 `{domain}: {evaluator_opinion}` 행 나열

---

## 3. IntakeForm UI 변경

### 파일: `apps/eval/components/eval/IntakeForm.tsx`

#### 상태 추가

```typescript
const [memo, setMemo] = useState('')
const [aiLoading, setAiLoading] = useState(false)
const [aiError, setAiError] = useState<string | null>(null)
// 5개 controlled 필드
const [consultationContent, setConsultationContent] = useState('')
const [mainActivityPlace, setMainActivityPlace] = useState('')
const [activityPosture, setActivityPosture] = useState('')
const [mainSupporter, setMainSupporter] = useState('')
const [environmentLimitations, setEnvironmentLimitations] = useState('')
```

#### 폼 submit 변경

FormData 대신 controlled state 값 직접 사용:

```typescript
const result = await createIntakeRecord({
  application_id: applicationId,
  client_id: clientId,
  consult_date: fd.get('consult_date') as string,
  consultation_content: consultationContent || undefined,
  main_activity_place: mainActivityPlace || undefined,
  activity_posture: activityPosture || undefined,
  main_supporter: mainSupporter || undefined,
  environment_limitations: environmentLimitations || undefined,
})
```

#### AI 섹션 (상담 내용 섹션 위에 삽입)

```
┌─────────────────────────────────────────┐
│  AI 초안 생성                            │
│  ┌───────────────────────────────────┐  │
│  │ 짧은 메모를 입력하세요...          │  │
│  │ (placeholder: 예) 40대 남성,     │  │
│  │  지체장애 3급, 전동휠체어 사용 중) │  │
│  └───────────────────────────────────┘  │
│  [AI 초안 생성]  ← 버튼                  │
│  (로딩 중: 스피너 + "생성 중..." 텍스트) │
│  (에러 시: 빨간 텍스트)                  │
└─────────────────────────────────────────┘
```

- memo textarea: `rows={3}`, controlled, `memo` state
- 버튼: `disabled={aiLoading || !memo.trim()}`
- AI 호출 후 `draft` 값으로 5개 state setter 호출
- 로딩 중 5개 필드에 skeleton (Tailwind `animate-pulse bg-gray-200 rounded h-9`) 표시

#### 5개 필드를 controlled textarea/input으로 전환

현재 uncontrolled (`name=` 속성만). 변경:
- `consultation_content`: textarea, `value={consultationContent}`, `onChange={e => setConsultationContent(e.target.value)}`
- `main_activity_place`, `activity_posture`, `main_supporter`, `environment_limitations`: input, 동일 패턴
- `name=` 속성은 제거 (FormData 미사용)

---

## 4. 구현 순서

1. `generateIntakeDraft` 함수 추가 (ai-actions.ts)
2. IntakeForm: 5개 필드를 controlled state로 전환, submit 로직 수정
3. IntakeForm: AI 섹션 추가 (memo textarea + 버튼 + 에러)
4. IntakeForm: AI 호출 핸들러 + skeleton 로딩 상태

---

## 5. 미포함 (후속 작업)

- AI 생성 이력 저장 (어떤 메모로 생성했는지 로그)
- 생성된 초안 수락/거부 명시적 UX (현재는 필드에 바로 채움)
- 스트리밍 응답 (현재는 전체 응답 후 일괄 표시)
