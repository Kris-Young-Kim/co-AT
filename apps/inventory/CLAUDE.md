# inventory 앱 컨텍스트 (inventory.gwatc.cloud)

## 경로 별칭
- `@/inventory/*` → `apps/inventory/*` (로컬)
- `@/*` → 모노레포 루트 (`../../*`)
- `@/components/ui/*` → `packages/ui/ui/*`
- `@/lib/supabase/*` → `packages/lib/supabase/*`
- `@co-at/types` → `packages/types/src/index.ts`

## DB 패턴
```ts
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
// 테이블 네임스페이스: inventory_*
```

## 라우트 구조
- `devices/` — 보조기기 목록·CRUD
- `scan/` — QR/바코드 스캔
- `rentals/` — 대여 관리
- `cleaning/` — 소독·세척 이력
- `maintenance/` — 유지보수
- `fab-equipment/` — 제작 장비
- `custom-orders/` — 맞춤 제작 주문
- `reuse/` — 재사용 처리
- `map/` — 자산 위치 지도
- `reports/` — 재고 보고서

## 주요 특징
- 로컬 액션: `actions/map-actions.ts`, `actions/report-actions.ts`
- 공유 액션: 루트 `actions/` (cleaning, fab-equipment, custom-order 등)
- QR 스캔: `qrcode.react` 사용
- `lib/import-types.ts` — 엑셀 가져오기 타입 정의
