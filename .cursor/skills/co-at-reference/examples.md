# Co-AT 스킬 사용 예시

## 새 페이지 추가 시

1. `app/(admin)/새경로/page.tsx` 또는 적절한 Route Group 선택
2. `components/features/` 에 도메인별 컴포넌트 추가
3. `components/layout/admin-sidebar.tsx` 에 메뉴 항목 추가 (admin인 경우)

## 새 API 라우트 추가 시

1. `app/api/경로/route.ts` 생성
2. GET/POST 등 메서드별 핸들러 export

## 폼 추가/수정 시

1. `lib/validators.ts` 에 Zod 스키마 정의
2. `components/features/application/forms/` 에 폼 컴포넌트
3. `actions/` 에 해당 Server Action

## DB 스키마 변경 후

```bash
pnpm gen:types
```

→ `types/database.types.ts` 자동 갱신
