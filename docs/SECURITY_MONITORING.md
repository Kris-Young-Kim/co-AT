# 보안 모니터링 및 위협 탐지 가이드

> **최종 업데이트**: 2025. 01. 27

---

## 📋 개요

이 문서는 강원특별자치도 보조기기센터 시스템의 보안 모니터링 및 위협 탐지 시스템을 설명합니다.

---

## 🔍 탐지 기능

### 1. 로그인 시도 추적

모든 로그인 시도는 자동으로 추적됩니다:

- **로그인 성공**: `login_success` 이벤트
- **로그인 실패**: `login_failure` 이벤트
- **로그인 시도**: `login_attempt` 이벤트

**기록 정보**:
- 사용자 ID (Clerk)
- IP 주소
- User Agent
- 타임스탬프

### 2. SQL Injection 탐지

다음 패턴을 탐지하여 차단합니다:

- SQL 키워드 (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP` 등)
- SQL 주석 (`--`, `#`, `/* */`)
- 명령어 구분자 (`;`, `|`, `&`)
- OR/AND 조건 조작 (`OR 1=1`, `AND 1=1`)
- UNION SELECT 공격
- EXEC/EXECUTE 명령어
- DROP TABLE/DATABASE 명령어

**심각도**: `high`  
**차단**: 자동 차단

### 3. XSS 공격 탐지

다음 패턴을 탐지하여 차단합니다:

- `<script>` 태그
- `javascript:` 프로토콜
- 이벤트 핸들러 (`onclick`, `onerror` 등)
- `<iframe>`, `<object>`, `<embed>` 태그
- `eval()`, `expression()` 함수
- `<style>` 태그

**심각도**: `high`  
**차단**: 자동 차단

### 4. 의심스러운 활동 탐지

다음 패턴을 탐지하여 로깅합니다:

- 경로 탐색 (`../`, `..\`)
- `file://` 프로토콜
- `data:` URL
- `<base>` 태그

**심각도**: `medium`  
**차단**: 로깅만 (차단하지 않음)

### 5. Rate Limit 초과

1분 내 100회 이상 요청 시:

- 요청 차단 (429 응답)
- 보안 로그에 기록
- IP 주소 추적

**심각도**: `medium`

---

## 📊 보안 로그

### 보안 로그 테이블

`security_logs` 테이블에 다음 정보가 기록됩니다:

- 이벤트 타입
- 심각도 (low, medium, high, critical)
- 사용자 정보 (ID, IP, User Agent)
- 요청 정보 (경로, 메서드, 본문)
- 탐지된 패턴
- 차단 여부
- 알림 발송 여부

### 보안 로그 조회

#### API 엔드포인트

```bash
# 모든 보안 이벤트 조회
GET /api/security/events

# 심각도별 필터링
GET /api/security/events?severity=high

# 이벤트 타입별 필터링
GET /api/security/events?type=sql_injection

# IP 주소별 필터링
GET /api/security/events?ip=192.168.1.1

# 차단된 이벤트만 조회
GET /api/security/events?blocked=true

# 복합 필터링
GET /api/security/events?severity=high&type=sql_injection&limit=20
```

#### 응답 형식

```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "sql_injection",
      "severity": "high",
      "ip_address": "192.168.1.1",
      "request_path": "/api/applications",
      "detected_pattern": "/(\\bSELECT\\b)/i",
      "threat_description": "SQL Injection 공격 시도가 탐지되었습니다",
      "blocked": true,
      "created_at": "2025-01-27T10:00:00Z"
    }
  ],
  "stats": {
    "total": 50,
    "bySeverity": {
      "critical": 2,
      "high": 15,
      "medium": 20,
      "low": 13
    },
    "byType": {
      "sql_injection": 5,
      "xss_attack": 3,
      "login_failure": 10
    },
    "blocked": 8,
    "notified": 2
  }
}
```

---

## 🚨 크리티컬 보안 이벤트 알림

### 자동 알림 발송

다음 조건에서 자동으로 알림이 발송됩니다:

- **심각도**: `critical` 또는 `high`
- **이벤트 타입**: `sql_injection`, `xss_attack`, `unauthorized_access`

### 알림 채널 (향후 구현)

1. **Notion 데이터베이스** (우선)
   - 보안 이벤트를 Notion 데이터베이스에 자동 기록
   - 실시간 모니터링 가능

2. **Google Sheet** (대안)
   - 보안 이벤트를 Google Sheet에 자동 기록
   - 스프레드시트로 분석 가능

3. **Slack/Discord** (선택사항)
   - 즉시 알림 필요 시

### 알림 내용

- 이벤트 타입 및 심각도
- 탐지된 패턴
- IP 주소 및 사용자 정보
- 요청 경로 및 메서드
- 타임스탬프

---

## 🔧 설정 및 커스터마이징

### 환경 변수

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000  # 1분
RATE_LIMIT_MAX=100          # 최대 요청 수

# 보안 알림 (향후)
NOTION_API_KEY=your_notion_api_key
NOTION_SECURITY_DB_ID=your_database_id
GOOGLE_SERVICE_ACCOUNT=your_service_account
GOOGLE_SECURITY_SHEET_ID=your_sheet_id
```

### 패턴 커스터마이징

`lib/utils/security-detector.ts`에서 탐지 패턴을 수정할 수 있습니다:

```typescript
// SQL Injection 패턴 추가
const SQL_INJECTION_PATTERNS = [
  // 기존 패턴...
  /your_custom_pattern/i,
]

// XSS 패턴 추가
const XSS_PATTERNS = [
  // 기존 패턴...
  /your_custom_pattern/i,
]
```

---

## 📈 모니터링 대시보드

### 주요 지표

1. **일일 보안 이벤트 수**
2. **심각도별 분포**
3. **가장 많이 차단된 IP 주소**
4. **가장 많이 탐지된 공격 유형**
5. **로그인 실패율**

### 권장 모니터링 주기

- **실시간**: 크리티컬 이벤트 (즉시 알림)
- **일일**: 보안 이벤트 요약 확인
- **주간**: 보안 트렌드 분석
- **월간**: 보안 정책 검토

---

## ⚠️ 주의사항

1. **False Positive**
   - 일부 정상적인 요청이 위협으로 탐지될 수 있음
   - 패턴을 지속적으로 개선 필요

2. **성능 영향**
   - 보안 탐지는 비동기로 실행되어 응답 지연 최소화
   - 대량 요청 시 성능 모니터링 필요

3. **개인정보 보호**
   - IP 주소 및 User Agent는 보안 목적으로만 사용
   - GDPR 등 개인정보 보호 규정 준수

4. **로그 보관**
   - 보안 로그는 90일간 보관 (설정 가능)
   - 장기 보관이 필요한 경우 아카이빙

---

## 🔗 관련 문서

- [SaaS 안정화 체크리스트](./TODO.md#saas-안정화-최우선)
- [보안 가이드](./SECURITY_GUIDE.md)
- [재해 복구 계획](./DISASTER_RECOVERY.md)

---

**문의**: 보안 관련 문의는 시스템 관리자에게 연락하세요.
