# 📊 데이터베이스 스키마 분석 보고서

> **분석 일시**: 2025. 12. 06  
> **Supabase Project**: uyjbndiwyddjyjkdfuyi  
> **분석 방법**: Supabase MCP를 통한 실제 스키마 조회

---

## ✅ 실제 데이터베이스 상태 (Supabase MCP 확인 결과)

### 🎉 좋은 소식: 이미 개선되어 있습니다!

실제 데이터베이스는 `co-AT.sql` 파일보다 **훨씬 개선된 상태**입니다.

---

## 📋 테이블별 상세 비교

### 1. **profiles** 테이블

#### ✅ 실제 DB (개선됨)
- `clerk_user_id`: **UNIQUE 제약조건 추가됨** ✅
- `role`: CHECK 제약조건 (`'user' | 'staff' | 'manager'`)
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `clerk_user_id`: UNIQUE 없음
- `updated_at`: 없음

---

### 2. **clients** 테이블

#### ✅ 실제 DB (개선됨)
- `gender`: CHECK 제약조건 (`'남' | '여'`)
- `has_elevator`: 기본값 `false` 설정됨
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `gender`: CHECK 제약조건 없음
- `has_elevator`: 기본값 없음
- `updated_at`: 없음

---

### 3. **inventory** 테이블

#### ✅ 실제 DB (개선됨)
- `status`: CHECK 제약조건 (`'보관' | '대여중' | '수리중' | '소독중' | '폐기'`)
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `status`: CHECK 제약조건 없음
- `updated_at`: 없음

---

### 4. **applications** 테이블 ⭐ 중요

#### ✅ 실제 DB (완전히 개선됨!)
- `client_id`: **올바른 Foreign Key로 설정됨** ✅
- `id2` 컬럼: **제거됨** ✅ (이미 정리 완료)
- `status`: CHECK 제약조건 (`'접수' | '배정' | '진행' | '완료' | '반려'`)
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `client_id`와 `id2` 중복 존재
- `id2`가 실제 FK로 사용됨
- `updated_at`: 없음

---

### 5. **intake_records** 테이블 ⭐ 중요

#### ✅ 실제 DB (완전히 개선됨!)
- `application_id`: **올바른 Foreign Key로 설정됨** ✅
- `id2` 컬럼: **제거됨** ✅ (이미 정리 완료)
- `consult_date`: 기본값 `CURRENT_DATE` 설정됨
- `cognitive_sensory_check`: **ARRAY 타입으로 변경됨** ✅ (`text[]`)
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `application_id`와 `id2` 중복 존재
- `id2`가 실제 FK로 사용됨
- `cognitive_sensory_check`: `text` 타입
- `updated_at`: 없음

---

### 6. **process_logs** 테이블 ⭐ 중요

#### ✅ 실제 DB (완전히 개선됨!)
- `application_id`: **올바른 Foreign Key로 설정됨** ✅
- `staff_id`: **올바른 Foreign Key로 설정됨** ✅
- `id2`, `id3` 컬럼: **제거됨** ✅ (이미 정리 완료)
- `log_date`: 기본값 `CURRENT_DATE` 설정됨
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `application_id`, `staff_id`와 `id2`, `id3` 중복 존재
- `id2`, `id3`가 실제 FK로 사용됨
- `updated_at`: 없음

---

### 7. **domain_assessments** 테이블 ⭐ 중요

#### ✅ 실제 DB (완전히 개선됨!)
- `application_id`: **올바른 Foreign Key로 설정됨** ✅
- `evaluator_id`: **올바른 Foreign Key로 설정됨** ✅
- `id2`, `id3` 컬럼: **제거됨** ✅ (이미 정리 완료)
- `evaluation_date`: 기본값 `CURRENT_DATE` 설정됨
- `updated_at`: **추가됨** ✅ (기본값: `now()`)
- `created_at`: 기본값 `now()` 설정됨

#### ❌ co-AT.sql (구버전)
- `application_id`, `evaluator_id`와 `id2`, `id3` 중복 존재
- `id2`, `id3`가 실제 FK로 사용됨
- `updated_at`: 없음

---

## 📊 개선 사항 요약

### ✅ 이미 완료된 개선 사항

1. **Foreign Key 컬럼명 정리** ✅
   - `applications.id2` → `applications.client_id` ✅
   - `intake_records.id2` → `intake_records.application_id` ✅
   - `process_logs.id2` → `process_logs.application_id` ✅
   - `process_logs.id3` → `process_logs.staff_id` ✅
   - `domain_assessments.id2` → `domain_assessments.application_id` ✅
   - `domain_assessments.id3` → `domain_assessments.evaluator_id` ✅

2. **타임스탬프 필드 추가** ✅
   - 모든 테이블에 `updated_at` 필드 추가됨
   - `created_at`에 기본값 `now()` 설정됨

3. **데이터 무결성 강화** ✅
   - CHECK 제약조건 추가 (gender, role, status)
   - UNIQUE 제약조건 추가 (clerk_user_id)
   - 기본값 설정 개선

4. **타입 개선** ✅
   - `cognitive_sensory_check`: `text` → `text[]` (ARRAY)

---

## ⚠️ 아직 필요한 개선 사항

### 🔴 긴급 (TODO.md에 명시된 항목)

1. **applications 테이블 필드 추가**
   - [ ] `category` 필드: `'consult' | 'experience' | 'custom' | 'aftercare' | 'education'`
   - [ ] `sub_category` 필드: `'repair' | 'rental' | 'custom_make' | 'visit' | 'exhibition'` 등
   - [ ] `desired_date` 필드: `date` 타입
   - [ ] `assigned_staff_id` 필드: `uuid` (FK → profiles.id)

2. **inventory 테이블 필드 추가**
   - [ ] `is_rental_available` 필드: `boolean` (default `true`)
   - [ ] `purchase_date` 필드: `date`
   - [ ] `purchase_price` 필드: `numeric`
   - [ ] `manufacturer` 필드: `text`
   - [ ] `model` 필드: `text`
   - [ ] `qr_code` 필드: `text`

3. **새 테이블 생성**
   - [ ] `service_logs` 테이블 (SOAP 노트, 수리비, 이미지 저장용)
   - [ ] `schedules` 테이블 (일정 관리)
   - [ ] `notices` 테이블 (공지사항)
   - [ ] `rentals` 테이블 (대여 관리)

---

## 🔍 RLS (Row Level Security) 상태

**현재 상태**: 모든 테이블에서 RLS가 **비활성화**되어 있습니다.

```
rls_enabled: false (모든 테이블)
```

⚠️ **보안 주의**: 프로덕션 배포 전에 반드시 RLS 정책을 설정해야 합니다.

---

## 📝 권장 사항

### 1. co-AT.sql 파일 업데이트
현재 `co-AT.sql` 파일이 실제 데이터베이스와 불일치하므로, 실제 스키마를 기반으로 업데이트가 필요합니다.

### 2. 타입 생성
다음 명령어로 최신 타입을 생성하세요:
```bash
npm run gen:types
```

### 3. RLS 정책 설정
보안을 위해 RLS 정책을 작성하고 활성화해야 합니다.

---

## ✅ 결론

**실제 데이터베이스는 이미 대부분의 개선 사항이 완료된 상태입니다!**

- Foreign Key 컬럼명 정리: ✅ 완료
- 타임스탬프 필드 추가: ✅ 완료
- 데이터 무결성 강화: ✅ 완료

**남은 작업**: 
- 추가 필드 및 테이블 생성 (TODO.md Phase 1.3 참조)
- RLS 정책 설정

---

**마지막 업데이트**: 2025. 12. 06

