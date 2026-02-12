# 📊 Supabase 테이블 분석 (Co-AT)

> **분석 기준**: `types/database.types.ts` + `migrations/`  
> **Supabase Project**: uyjbndiwyddjyjkdfuyi  
> **분석 일시**: 2025. 02. 12

> ⚠️ **참고**: Supabase MCP가 현재 환경에 연결되어 있지 않아, 타입 파일과 마이그레이션을 기반으로 분석했습니다.  
> 실제 DB와 차이가 있을 수 있으니 `npm run gen:types`로 타입 재생성 권장.

---

## 📋 테이블 목록 (18개)

| # | 테이블 | 용도 | FK | Array/JSON |
|---|--------|------|-----|------------|
| 1 | profiles | Clerk 사용자 → 센터 직원 프로필 | - | - |
| 2 | clients | 대상자(장애인/노인) 정보 | - | - |
| 3 | applications | 서비스 신청서 | profiles, clients | - |
| 4 | intake_records | 상담 기록 | applications, profiles | cognitive_sensory_check[], body_function_data, current_devices |
| 5 | domain_assessments | 도메인별 평가 | applications, profiles | evaluation_data, measurements |
| 6 | process_logs | 서비스 진행 기록 | applications, profiles | - |
| 7 | service_logs | 수리/작업 기록, SOAP | applications, inventory, profiles | images_before[], images_after[] |
| 8 | inventory | 재고/보조기기 | - | - |
| 9 | rentals | 대여 관리 | applications, clients, inventory | - |
| 10 | custom_makes | 맞춤제작 | applications, clients, profiles, equipment | design_files[], reference_images[], result_images[], measurements |
| 11 | custom_make_progress | 맞춤제작 진행 | custom_makes, profiles | images[] |
| 12 | equipment | 장비(제작용) | profiles | specifications |
| 13 | schedules | 일정 | applications, clients, profiles | - |
| 14 | notices | 공지사항 | profiles | - |
| 15 | regulations | RAG 규정 문서 (벡터) | - | embedding |
| 16 | backup_logs | 백업 로그 | - | - |
| 17 | security_logs | 보안 로그 | - | - |
| 18 | notifications | 알림 | - | - |
| 19 | audit_logs | 감사 로그 | - | - |

---

## 🔗 ER 관계 요약

```
profiles (직원)
    ├── applications.assigned_staff_id
    ├── intake_records.consultant_id
    ├── domain_assessments.evaluator_id
    ├── process_logs.staff_id
    ├── service_logs.staff_id
    ├── custom_makes.assigned_staff_id
    ├── custom_make_progress.staff_id
    ├── equipment.manager_id
    ├── schedules.staff_id
    └── notices.created_by

clients (대상자)
    ├── applications.client_id
    ├── custom_makes.client_id
    └── rentals.client_id

applications (신청서)
    ├── intake_records.application_id
    ├── domain_assessments.application_id
    ├── process_logs.application_id
    ├── service_logs.application_id
    ├── custom_makes.application_id
    ├── rentals.application_id
    └── schedules.application_id

inventory (재고)
    ├── service_logs.inventory_id
    └── rentals.inventory_id

equipment (장비)
    └── custom_makes.equipment_id
```

---

## 📐 테이블별 상세

### 1. profiles
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| clerk_user_id | string | Clerk 사용자 ID (UNIQUE) |
| full_name | string? | 이름 |
| email | string? | 이메일 |
| role | string? | user \| staff \| manager |
| team | string? | 팀 |
| created_at, updated_at | timestamptz? | |

### 2. clients
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | string | 이름 |
| registration_number | string? | 장애인등록번호 |
| birth_date | date? | 생년월일 |
| gender | string? | 남/여 |
| contact | string? | 연락처 |
| address | string? | 주소 |
| disability_type, disability_grade | string? | 장애 유형/등급 |
| housing_type | string? | 주거 형태 |
| has_elevator | boolean? | 엘리베이터 유무 |
| ... | | (기타 장애/경제 정보) |

### 3. applications
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| client_id | uuid | FK → clients |
| assigned_staff_id | uuid? | FK → profiles |
| category | string? | consult, experience, custom, aftercare, education |
| sub_category | string? | repair, rental, custom_make, visit, exhibition 등 |
| status | string? | 접수, 배정, 진행, 완료, 반려 |
| desired_date | date? | 희망 일자 |
| service_year | number? | 서비스 연도 |

### 4. inventory
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | string | 기기명 |
| category | string? | 분류 |
| status | string? | 보관, 대여중, 수리중, 소독중, 폐기 |
| is_rental_available | boolean? | 대여 가능 여부 |
| qr_code | string? | QR 코드 |
| manufacturer, model | string? | 제조사, 모델 |
| purchase_date, purchase_price | date?, number? | 구입 정보 |

※ `image_url`은 migration 019로 추가됨. 타입 파일에 없을 수 있음.

### 5. service_logs
| 컬럼 | 타입 | 설명 |
|------|------|------|
| application_id | uuid | FK |
| inventory_id | uuid? | FK |
| staff_id | uuid? | FK |
| service_type, work_type | string? | 서비스/작업 유형 |
| cost_materials, cost_labor, cost_other, cost_total | number? | 비용 |
| images_before[], images_after[] | string[]? | 작업 전/후 사진 |
| work_description, work_result | string? | SOAP 등 |

### 6. schedules
| 컬럼 | 타입 | 설명 |
|------|------|------|
| staff_id | uuid | FK (필수) |
| application_id, client_id | uuid? | FK |
| schedule_type | string | 상담, 평가, 대여, 제작 등 |
| scheduled_date | date | |
| scheduled_time | string? | |
| status | string? | scheduled, completed, cancelled 등 |

### 7. regulations
| 컬럼 | 타입 | 설명 |
|------|------|------|
| title | string | 문서 제목 |
| content | text | 본문 |
| section | string? | 섹션 |
| category | string? | 분류 |
| embedding | vector(768) | pgvector (RAG) |

---

## ⚠️ 정규화/타입 이슈 (DB 정규화 검토 시)

| 테이블 | 항목 | 내용 |
|--------|------|------|
| intake_records | cognitive_sensory_check | text[] → 별도 테이블 권장 |
| service_logs | images_before, images_after | string[] → 별도 테이블 권장 |
| custom_makes | design_files, reference_images, result_images | string[] → 별도 테이블 권장 |
| custom_make_progress | images | string[] → 별도 테이블 권장 |
| notices | attachments | migration 008에서 notice_attachments 분리 |

---

## 📁 마이그레이션 파일 (타입에 반영 안 된 테이블)

- `notice_attachments` (008)
- `regulations` (012)
- `backup_logs` (015)
- `security_logs` (016)
- `notifications`, `notification_preferences`, `notification_logs` (017)
- `audit_logs` (018)

타입 재생성: `npm run gen:types`
