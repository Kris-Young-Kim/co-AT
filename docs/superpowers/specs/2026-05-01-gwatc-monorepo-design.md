# GWATC 보조공학센터 모노레포 전체 아키텍처 설계

**작성일:** 2026-05-01
**도메인:** gwatc.cloud (추후 gwatc.or.kr 전환, 시기 미정)
**스택:** Next.js 16 · React 19 · TypeScript · Supabase · Clerk · Tailwind/shadcn · Turbo · pnpm · Vercel · Cloudflare

---

## 1. 목표

보조공학센터 업무 전반을 하나의 모노레포로 통합 관리한다.
공개 포털(web)과 내부 직원용 앱(eval, inventory, stats, automation, hr, approval)을 분리 운영하되, 인증·DB·UI를 공유 패키지로 일원화한다.

---

## 2. 앱 목록 및 도메인

| 앱 | 디렉토리 | 도메인 | 사용자 | 개발 순서 |
|---|---|---|---|---|
| 공개 포털 | `apps/web` | `gwatc.cloud` | 전체 (장애인, 보호자, 직원) | 기존 |
| 권한 관리 허브 | `apps/admin` | `admin.gwatc.cloud` | 관리자(ADMIN) | 기존 |
| 상담/평가 툴 | `apps/eval` | `eval.gwatc.cloud` | 보조공학 전문가 | Phase 1 |
| 자산/재고·대여 | `apps/inventory` | `inventory.gwatc.cloud` | 내부 직원 | Phase 2 |
| 성과 지표 대시보드 | `apps/stats` | `stats.gwatc.cloud` | 관리자·전문가 | Phase 3 |
| 업무 자동화·알림 | `apps/automation` | `automation.gwatc.cloud` | 관리자 | Phase 4 |
| 인사 관리 | `apps/hr` | `hr.gwatc.cloud` | 관리자·HR담당 | Phase 5 |
| 지능형 전자결재 | `apps/approval` | `approval.gwatc.cloud` | 전 직원 | Phase 6 |

---

## 3. 모노레포 디렉토리 구조

```
co-AT/
├── apps/
│   ├── web/           # 기존 — 공개 포털
│   ├── admin/         # 기존 — 권한/설정 허브
│   ├── eval/          # NEW Phase 1
│   ├── inventory/     # NEW Phase 2
│   ├── stats/         # NEW Phase 3
│   ├── automation/    # NEW Phase 4
│   ├── hr/            # NEW Phase 5
│   └── approval/      # NEW Phase 6
│
├── packages/
│   ├── ui/            # 기존 — shadcn 기반 공유 컴포넌트 (@co-at/ui)
│   ├── lib/           # 기존 — Supabase client, 공통 유틸 (@co-at/lib)
│   ├── auth/          # NEW — Clerk 미들웨어, usePermission 훅, 역할 상수 (@co-at/auth)
│   └── types/         # NEW — Supabase 자동생성 타입 + 공통 인터페이스 (@co-at/types)
│
├── turbo.json
├── pnpm-workspace.yaml
└── ...
```

---

## 4. 공유 패키지 상세

### `@co-at/ui`
- shadcn/ui 컴포넌트 래핑 (Button, Table, Modal, Form 등)
- 모든 앱에서 동일한 디자인 시스템 사용
- Tailwind 설정 프리셋 포함

### `@co-at/lib`
- Supabase 브라우저/서버 클라이언트 팩토리
- 날짜, 포맷, 유효성 공통 유틸

### `@co-at/auth`
- Clerk `authMiddleware` / `clerkMiddleware` 공유 설정
- `usePermission(role)` 훅
- 역할 상수: `ROLES = { ADMIN, MANAGER, STAFF }`
- 미인증 시 `admin.gwatc.cloud/sign-in` 리다이렉트

### `@co-at/types`
- `supabase gen types` 자동생성 타입 단일 관리
- 앱 간 공유 인터페이스 (Client, Equipment, Rental, EvalRecord 등)

---

## 5. 권한 모델

```
ADMIN   → 모든 앱 접근 + 사용자 권한 부여/회수
MANAGER → 할당된 앱 접근 (admin에서 on/off)
STAFF   → 할당된 기능만 접근
```

- 권한 부여/회수: `admin.gwatc.cloud` 에서 관리자가 처리
- 각 앱 미들웨어: `@co-at/auth` → Clerk 세션 확인 → 권한 없으면 리다이렉트
- Clerk Metadata에 역할 저장 (`publicMetadata.role`, `publicMetadata.apps[]`)

---

## 6. 데이터 전략

- **Supabase 프로젝트 1개 공유** (무료 플랜 2프로젝트 제한 대응)
- 앱별 테이블 네임스페이스: `eval_*`, `inventory_*`, `hr_*`, `approval_*`
- `@co-at/lib` 에서 단일 Supabase client 제공
- Row Level Security(RLS)로 앱별 데이터 접근 제어

---

## 7. 각 앱 보일러플레이트 구성 (공통)

모든 신규 앱은 아래 구조로 생성:

```
apps/<name>/
├── app/
│   ├── layout.tsx       # @co-at/ui 프로바이더
│   ├── page.tsx         # 대시보드 진입점
│   └── api/             # Route Handlers
├── components/          # 앱 전용 컴포넌트
├── lib/                 # 앱 전용 유틸
├── middleware.ts        # @co-at/auth 미들웨어
├── package.json         # @co-at/* 의존성 포함
├── next.config.mjs
├── tailwind.config.ts   # @co-at/ui 프리셋 확장
└── tsconfig.json        # @co-at/types 경로 포함
```

---

## 8. 빌드 및 배포

- **Turbo** 빌드 파이프라인: `packages/*` 빌드 후 `apps/*` 빌드
- **Vercel**: 앱별 독립 프로젝트, 서브도메인 연결
- **환경변수**: 공통 변수(Supabase URL, Clerk Key)는 각 Vercel 프로젝트에 동일 설정
- **도메인 전환**: `gwatc.cloud` → `gwatc.or.kr` 시 Cloudflare DNS + Vercel 커스텀 도메인 설정 변경

---

## 8-1. Cloudflare 보안 레이어

```
사용자 요청
    ↓
Cloudflare (DNS · WAF · DDoS 보호 · Bot 차단)
    ↓
Vercel (앱별 서브도메인)
    ↓
Next.js 앱 (Clerk 인증 · Supabase)
```

### Cloudflare 역할
| 기능 | 설정 |
|---|---|
| DNS 관리 | `gwatc.cloud` 및 서브도메인 CNAME → Vercel |
| WAF (Web Application Firewall) | OWASP 룰셋, SQL Injection·XSS 차단 |
| DDoS 보호 | 자동 (무료 플랜 포함) |
| Bot 차단 | 악성 봇 자동 차단 |
| SSL/TLS | Full(strict) 모드 — Cloudflare ↔ Vercel 구간도 암호화 |
| 캐싱 | 정적 에셋 엣지 캐싱 (내부 앱은 Cache-Control: no-store) |

### 주의사항
- Vercel 커스텀 도메인 추가 시 **Cloudflare Proxy(주황 구름) ON** 유지
- Vercel SSL 인증서와 충돌 방지: TLS 모드는 반드시 **Full(strict)**
- 내부 앱(`eval`, `hr`, `approval` 등)은 Cloudflare Access로 추가 IP/이메일 제한 가능 (Zero Trust 무료 플랜: 최대 50명)
- `gwatc.or.kr` 전환 시 Cloudflare에서 도메인 추가 후 동일 설정 적용

---

## 9. 개발 단계별 마일스톤

| Phase | 앱 | 핵심 기능 |
|---|---|---|
| 0 (현재) | 보일러플레이트 | 6개 앱 뼈대 생성, packages/auth+types 신설 |
| 1 | eval | 클라이언트 상담기록, 보조기기 평가 폼, PDF 출력 |
| 2 | inventory | 자산 등록/바코드, 대여·반납 자동화, 재고 현황 |
| 3 | stats | 성과 KPI 대시보드, 리포트 다운로드 |
| 4 | automation | 반납 알림, 일정 리마인더, 외부 API 연동 |
| 5 | hr | 직원 프로필, 근태, 자격증 관리 |
| 6 | approval | 기안·결재선·전자서명, 문서 보관 |

---

## 10. 무료 플랜 제약 및 대응

| 서비스 | 무료 제한 | 대응 전략 |
|---|---|---|
| Supabase | 프로젝트 2개, DB 500MB | 단일 프로젝트 공유, 테이블 네임스페이스 분리 |
| Clerk | MAU 10,000명 | 내부 직원 수십~수백명 → 여유 |
| Vercel | 상업적 사용 불가 (Hobby) | 비영리/공공기관 조건 확인 또는 Pro 전환 |
| GitHub | 무제한 private repo | 모노레포 1개 → 문제없음 |
