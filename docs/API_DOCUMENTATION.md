# 🔌 API 문서

## 안녕하세요, 개발자님! 👋

이 문서는 **Co-AT API**를 사용하는 방법을 설명합니다.  
초등학생도 이해할 수 있도록 쉽게 설명했습니다!

---

## 목차

1. [API란?](#1-api란)
2. [Server Actions 사용하기](#2-server-actions-사용하기)
3. [주요 API 목록](#3-주요-api-목록)
4. [에러 처리하기](#4-에러-처리하기)
5. [예제 코드](#5-예제-코드)

---

## 1. API란?

### 1.1 API는 무엇인가요?

**API**는 **Application Programming Interface**의 줄임말입니다.

쉽게 말하면:
> **컴퓨터 프로그램들이 서로 대화하는 방법**입니다! 💬

예를 들어:
- 웹사이트(프론트엔드)가 데이터베이스(백엔드)에 "데이터 주세요!"라고 요청
- 데이터베이스가 "여기 있어요!"라고 응답

이런 대화를 가능하게 해주는 것이 **API**입니다!

### 1.2 Co-AT의 API 구조

Co-AT는 **Next.js Server Actions**를 사용합니다.

```
┌─────────────┐         ┌──────────────┐
│  웹사이트   │ ────→   │  Server      │
│  (사용자)   │  요청   │  Actions     │
│             │ ←────   │  (API)       │
└─────────────┘  응답   └──────────────┘
                            ↓
                    ┌──────────────┐
                    │  데이터베이스 │
                    │  (Supabase)  │
                    └──────────────┘
```

---

## 2. Server Actions 사용하기

### 2.1 Server Actions란?

**Server Actions**는 Next.js에서 제공하는 기능입니다.

**장점:**
- ✅ 별도의 API 라우트를 만들 필요 없음
- ✅ 타입 안정성 (TypeScript)
- ✅ 자동으로 서버에서 실행됨

### 2.2 사용 방법

#### 1단계: Server Action 파일 만들기

`actions/` 폴더에 파일을 만듭니다.

예: `actions/my-action.ts`

```typescript
"use server"  // 이 파일은 서버에서 실행됩니다!

export async function myAction() {
  // 여기에 코드를 작성합니다
  return { success: true, data: "안녕하세요!" }
}
```

#### 2단계: 컴포넌트에서 사용하기

```typescript
import { myAction } from "@/actions/my-action"

export function MyComponent() {
  const handleClick = async () => {
    const result = await myAction()
    console.log(result) // { success: true, data: "안녕하세요!" }
  }

  return <button onClick={handleClick}>클릭하세요!</button>
}
```

> 💡 **팁**: `"use server"`를 파일 맨 위에 써야 해요!

---

## 3. 주요 API 목록

### 3.1 신청서 관련 API

#### `createApplication` - 신청서 만들기

**어디에 있나요?** `actions/application-actions.ts`

**무엇을 하나요?** 새로운 서비스 신청서를 만듭니다.

**사용 방법:**
```typescript
import { createApplication } from "@/actions/application-actions"

const result = await createApplication({
  category: "repair",  // 수리
  sub_category: "repair",
  description: "휠체어 바퀴가 안 돌아요",
  contact: "010-1234-5678"
})

if (result.success) {
  console.log("신청서가 만들어졌어요!", result.applicationId)
} else {
  console.error("에러:", result.error)
}
```

**반환값:**
```typescript
{
  success: true,
  applicationId: "abc-123-def-456"
}
또는
{
  success: false,
  error: "에러 메시지"
}
```

#### `getApplications` - 신청서 목록 가져오기

**무엇을 하나요?** 모든 신청서 목록을 가져옵니다.

**사용 방법:**
```typescript
import { getApplications } from "@/actions/application-actions"

const result = await getApplications()

if (result.success) {
  result.applications.forEach(app => {
    console.log(app.id, app.category, app.status)
  })
}
```

---

### 3.2 대상자 관련 API

#### `getClientById` - 대상자 정보 가져오기

**어디에 있나요?** `actions/client-actions.ts`

**무엇을 하나요?** 특정 대상자의 정보를 가져옵니다.

**사용 방법:**
```typescript
import { getClientById } from "@/actions/client-actions"

const result = await getClientById("client-id-123")

if (result.success) {
  const client = result.client
  console.log(client.name)  // 홍길동
  console.log(client.contact)  // 010-1234-5678
}
```

#### `getClientHistory` - 대상자 이력 가져오기

**무엇을 하나요?** 대상자가 받은 모든 서비스 이력을 가져옵니다.

**사용 방법:**
```typescript
import { getClientHistory } from "@/actions/client-actions"

const result = await getClientHistory("client-id-123")

if (result.success) {
  result.history.forEach(item => {
    console.log(item.date, item.service, item.status)
  })
}
```

---

### 3.3 재고 관련 API

#### `getInventoryList` - 재고 목록 가져오기

**어디에 있나요?** `actions/inventory-actions.ts`

**무엇을 하나요?** 모든 재고 목록을 가져옵니다.

**사용 방법:**
```typescript
import { getInventoryList } from "@/actions/inventory-actions"

const result = await getInventoryList()

if (result.success) {
  result.items.forEach(item => {
    console.log(item.name, item.status)  // 전동휠체어, 보관
  })
}
```

#### `createInventory` - 재고 추가하기

**무엇을 하나요?** 새로운 재고를 추가합니다.

**사용 방법:**
```typescript
import { createInventory } from "@/actions/inventory-actions"

const result = await createInventory({
  name: "전동휠체어",
  category: "이동보조기",
  status: "보관"
})

if (result.success) {
  console.log("재고가 추가되었어요!", result.id)
}
```

---

### 3.4 통계 관련 API

#### `getStatsSummary` - 통계 요약 가져오기

**어디에 있나요?** `actions/stats-actions.ts`

**무엇을 하나요?** 전체 통계 요약을 가져옵니다.

**사용 방법:**
```typescript
import { getStatsSummary } from "@/actions/stats-actions"

const startDate = "2025-01-01"
const endDate = "2025-01-31"

const result = await getStatsSummary(startDate, endDate)

if (result.success && result.summary) {
  const summary = result.summary
  console.log("전체 신청:", summary.totalApplications)
  console.log("대상자 수:", summary.totalClients)
  console.log("완료율:", summary.completionRate + "%")
}
```

#### `getMonthlyStats` - 월별 통계 가져오기

**무엇을 하나요?** 특정 연도의 월별 통계를 가져옵니다.

**사용 방법:**
```typescript
import { getMonthlyStats } from "@/actions/stats-actions"

const result = await getMonthlyStats(2025)

if (result.success && result.stats) {
  result.stats.forEach(month => {
    console.log(month.monthLabel, month.total)
  })
}
```

---

### 3.5 일정 관련 API

#### `getSchedules` - 일정 목록 가져오기

**어디에 있나요?** `actions/schedule-actions.ts`

**무엇을 하나요?** 모든 일정 목록을 가져옵니다.

**사용 방법:**
```typescript
import { getSchedules } from "@/actions/schedule-actions"

const result = await getSchedules()

if (result.success) {
  result.schedules.forEach(schedule => {
    console.log(schedule.date, schedule.type)
  })
}
```

#### `createSchedule` - 일정 만들기

**무엇을 하나요?** 새로운 일정을 만듭니다.

**사용 방법:**
```typescript
import { createSchedule } from "@/actions/schedule-actions"

const result = await createSchedule({
  schedule_type: "visit",  // 방문
  scheduled_date: "2025-02-01",
  scheduled_time: "14:00",
  client_id: "client-id-123"
})

if (result.success) {
  console.log("일정이 만들어졌어요!", result.scheduleId)
}
```

---

## 4. 에러 처리하기

### 4.1 에러가 났을 때

모든 API는 다음과 같은 형식으로 응답합니다:

```typescript
{
  success: true,   // 성공했으면 true
  data: {...}      // 데이터
}
또는
{
  success: false,  // 실패했으면 false
  error: "에러 메시지"  // 왜 실패했는지 설명
}
```

### 4.2 에러 처리 예제

```typescript
async function handleAction() {
  try {
    const result = await someAction()
    
    if (result.success) {
      // 성공했을 때 할 일
      console.log("성공!", result.data)
    } else {
      // 실패했을 때 할 일
      console.error("에러:", result.error)
      alert("에러가 발생했습니다: " + result.error)
    }
  } catch (error) {
    // 예상치 못한 에러
    console.error("예상치 못한 에러:", error)
    alert("알 수 없는 에러가 발생했습니다")
  }
}
```

### 4.3 자주 발생하는 에러

#### 권한 없음 에러
```typescript
{
  success: false,
  error: "권한이 없습니다"
}
```
**해결 방법:** 관리자 권한이 있는 계정으로 로그인하세요.

#### 데이터 없음 에러
```typescript
{
  success: false,
  error: "데이터를 찾을 수 없습니다"
}
```
**해결 방법:** 올바른 ID를 사용했는지 확인하세요.

---

## 5. 예제 코드

### 5.1 신청서 만들기 예제

```typescript
"use client"

import { createApplication } from "@/actions/application-actions"
import { useState } from "react"

export function ApplicationForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const result = await createApplication({
        category: "repair",
        sub_category: "repair",
        description: "휠체어 수리가 필요해요",
        contact: "010-1234-5678"
      })

      if (result.success) {
        setMessage("신청서가 성공적으로 만들어졌어요! 🎉")
      } else {
        setMessage("에러: " + result.error)
      }
    } catch (error) {
      setMessage("알 수 없는 에러가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? "처리 중..." : "신청하기"}
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}
```

### 5.2 통계 가져오기 예제

```typescript
"use client"

import { getStatsSummary } from "@/actions/stats-actions"
import { useEffect, useState } from "react"

export function StatsDisplay() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadStats() {
      const startDate = "2025-01-01"
      const endDate = "2025-01-31"
      
      const result = await getStatsSummary(startDate, endDate)
      
      if (result.success && result.summary) {
        setStats(result.summary)
      }
    }

    loadStats()
  }, [])

  if (!stats) {
    return <div>로딩 중...</div>
  }

  return (
    <div>
      <h2>통계 요약</h2>
      <p>전체 신청: {stats.totalApplications}건</p>
      <p>대상자 수: {stats.totalClients}명</p>
      <p>완료율: {stats.completionRate}%</p>
    </div>
  )
}
```

---

## 🎉 축하합니다!

이제 Co-AT API를 사용할 수 있습니다!

**더 자세한 정보가 필요하시면:**
- 📖 코드를 직접 보기: `actions/` 폴더
- 💬 개발팀에 문의
- 🐛 버그 발견 시: GitHub 이슈 생성

**행운을 빕니다!** 😊

---

**마지막 업데이트**: 2025년 1월 27일
