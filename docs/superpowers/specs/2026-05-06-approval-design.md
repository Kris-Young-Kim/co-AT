# 지능형 전자결재 시스템 설계 (Phase 6)

**작성일:** 2026-05-06
**앱:** `apps/approval` → `approval.gwatc.cloud`
**사용자:** 전 직원 (ADMIN / MANAGER / STAFF)

---

## 1. 목표

보조공학센터 업무에서 발생하는 결재 문서(지출 결의서, 휴가/출장 신청서, 업무 보고서/기안문)를 디지털로 처리한다. 기안자가 문서를 작성하면 고정 2단계(팀장 → 센터장) 순서로 승인이 진행되고, 결재 완료 문서는 PDF 다운로드 및 시스템 보관함에 보존된다.

---

## 2. 결재 워크플로

```
기안자 작성 (draft)
    ↓ 제출
팀장 결재 대기 (pending, step=1)
    ↓ 승인
센터장 결재 대기 (pending, step=2)
    ↓ 승인
최종 승인 완료 (approved)

* 어느 단계에서든 반려(rejected) 가능 → 기안자에게 알림
```

---

## 3. 문서 유형 및 필드

| 유형 | `type` 값 | JSONB `content` 주요 필드 |
|---|---|---|
| 지출 결의서 | `expenditure` | 항목명, 금액, 지출일, 비고, 첨부 영수증 URL |
| 휴가/출장 신청서 | `leave` | 유형(연차/반차/출장/기타), 시작일, 종료일, 사유, 행선지 |
| 업무 보고서/기안문 | `business_report` | 제목, 배경, 내용, 첨부파일 URL 목록 |

---

## 4. 데이터 모델

### `approval_signatures`
직원별 서명 이미지 (1인 1개 유지).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| clerk_user_id | text UNIQUE NOT NULL | Clerk 사용자 ID |
| image_url | text NOT NULL | Supabase Storage URL |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `approval_documents`
기안 문서 본체.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| type | text NOT NULL | `expenditure` \| `leave` \| `business_report` |
| title | text NOT NULL | 문서 제목 |
| content | jsonb NOT NULL | 유형별 필드 |
| status | text NOT NULL | `draft` \| `pending` \| `approved` \| `rejected` |
| created_by | text NOT NULL | 기안자 Clerk user_id |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `approval_steps`
문서당 결재 단계 (제출 시 2개 행 자동 생성).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK | |
| document_id | uuid FK → approval_documents | |
| step | int NOT NULL | 1=팀장, 2=센터장 |
| approver_role | text NOT NULL | `MANAGER` \| `ADMIN` — 해당 역할 보유자 전원이 결재 가능 |
| acted_by | text | 실제 결재 처리한 Clerk user_id (결재 후 기록) |
| status | text NOT NULL | `pending` \| `approved` \| `rejected` |
| signature_url | text | 결재 시 서명 이미지 URL (approval_signatures에서 복사) |
| comment | text | 반려 사유 등 |
| acted_at | timestamptz | 결재 처리 시각 |

---

## 5. 권한 모델

- **기안**: 전 직원 가능 (ADMIN / MANAGER / STAFF)
- **결재**: MANAGER(팀장 역할), ADMIN(센터장 역할)
  - step=1: `MANAGER` 역할 보유 직원이라면 누구나 결재 가능
  - step=2: `ADMIN` 역할 보유 직원이라면 누구나 결재 가능
  - 먼저 처리한 사람이 결재자로 확정 (선착순 1인)
- **보관함 조회**: ADMIN은 전체, MANAGER/STAFF는 본인 문서만

---

## 6. 페이지 구조

```
/                        결재함 대시보드
                         - 내 기안 목록 (상태별)
                         - 내 결재 대기 목록

/new                     문서 유형 선택 → 기안 폼
/[id]                    문서 상세 (결재 현황, 서명 도장 표시)
/[id]/approve            결재 처리 (승인 / 반려 + 사유)
/archive                 보관함 (전체 완료 문서, 검색/필터)
/settings/signature      내 서명 이미지 등록/교체
```

---

## 7. 서명 도장 처리

1. 직원은 `/settings/signature` 에서 서명 이미지(PNG/JPG) 업로드
2. Supabase Storage `approval-signatures` 버킷에 저장 (`{clerk_user_id}/signature.png`)
3. 결재 처리 시 `approval_steps.signature_url`에 해당 URL 기록
4. PDF 생성 시 결재란에 이미지 삽입 (미결재 칸은 빈 박스 표시)

---

## 8. PDF 생성

- 라이브러리: `@react-pdf/renderer` (hr 앱 증명서 패턴과 동일)
- 서버 컴포넌트에서 생성 → `Content-Disposition: attachment` 응답
- **레이아웃:**
  - 상단: 문서 제목, 유형, 기안자명, 기안일
  - 중단: 유형별 본문 내용
  - 하단: 결재란 (기안자 | 팀장 | 센터장) — 각 칸에 서명 이미지 또는 "미결재"

---

## 9. 알림 연동 (FlareLane via automation 앱)

| 이벤트 | 수신자 | 내용 |
|---|---|---|
| 기안 제출 | 팀장(step=1 결재자) | "OOO님이 결재를 요청했습니다: [문서제목]" |
| 팀장 승인 | 센터장(step=2 결재자) | "OOO님의 결재가 대기 중입니다: [문서제목]" |
| 최종 승인 | 기안자 | "결재가 완료되었습니다: [문서제목]" |
| 반려 | 기안자 | "결재가 반려되었습니다: [문서제목] — [사유]" |

- `automation.gwatc.cloud`의 기존 FlareLane 알림 API 재사용
- Server Action 내에서 `fetch('/api/notifications/send', ...)` 호출

---

## 10. Server Actions

| Action | 설명 |
|---|---|
| `createDocument(input)` | 기안 생성 (draft 상태) |
| `submitDocument(id)` | 제출 → status=pending, approval_steps 2개 생성, 알림 발송 |
| `approveStep(stepId, actorId, signatureUrl)` | 단계 승인 → acted_by 기록, 다음 단계 또는 최종 완료 처리 |
| `rejectStep(stepId, actorId, comment)` | 반려 → acted_by 기록, 문서 status=rejected, 기안자 알림 |
| `getMyDocuments(userId)` | 내 기안 목록 |
| `getPendingApprovals(userId)` | 내 결재 대기 목록 |
| `getDocument(id)` | 문서 상세 + steps |
| `getArchive(filters)` | 보관함 (완료 문서 검색) |
| `upsertSignature(userId, imageUrl)` | 서명 이미지 등록/교체 |

---

## 11. 구현 순서

| Task | 내용 |
|---|---|
| 1 | DB 마이그레이션 `041_create_approval_tables.sql` |
| 2 | `@co-at/types` — ApprovalDocument, ApprovalStep, ApprovalSignature 타입 추가 |
| 3 | Server Actions (`apps/approval/actions/approval-actions.ts`) |
| 4 | 서명 이미지 업로드 페이지 `/settings/signature` |
| 5 | 기안 폼 `/new` (유형 선택 + 유형별 폼 컴포넌트) |
| 6 | 결재함 대시보드 `/` |
| 7 | 문서 상세 `/[id]` + 결재 처리 `/[id]/approve` |
| 8 | PDF 생성 (`ApprovalDocumentPdf` 컴포넌트 + `/[id]/pdf` 라우트) |
| 9 | 보관함 `/archive` |
| 10 | FlareLane 알림 연동 |
