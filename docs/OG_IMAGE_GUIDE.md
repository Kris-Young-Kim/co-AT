# 🖼️ OG 이미지 생성 가이드

> **Open Graph 이미지 생성 및 설정 가이드**

---

## 개요

Open Graph (OG) 이미지는 소셜 미디어(페이스북, 트위터, 카카오톡 등)에서 링크를 공유할 때 표시되는 이미지입니다. 적절한 OG 이미지를 설정하면 클릭률을 높이고 브랜드 인지도를 향상시킬 수 있습니다.

---

## 권장 사양

### 이미지 크기

- **최적 크기**: 1200 x 630 픽셀 (1.91:1 비율)
- **최소 크기**: 600 x 315 픽셀
- **최대 크기**: 1200 x 1200 픽셀
- **파일 형식**: PNG 또는 JPG
- **파일 크기**: 1MB 이하 권장

### 디자인 가이드라인

1. **텍스트 포함**
   - 사이트명 또는 브랜드명
   - 주요 메시지 또는 제목
   - 텍스트는 이미지 중앙에 배치

2. **브랜드 일관성**
   - 로고 포함
   - 브랜드 색상 사용
   - 일관된 디자인 스타일

3. **가독성**
   - 텍스트와 배경의 대비 확보
   - 작은 크기에서도 읽을 수 있는 폰트 크기
   - 중요한 정보는 중앙에 배치

---

## 이미지 생성 방법

### 방법 1: 디자인 도구 사용 (권장)

#### Figma / Adobe XD / Canva

1. 1200 x 630 픽셀 캔버스 생성
2. 배경 디자인 (브랜드 색상 또는 이미지)
3. 로고 및 텍스트 추가
4. PNG 또는 JPG로 내보내기

#### 예시 디자인 요소

```
┌─────────────────────────────────────┐
│                                     │
│         [로고]                      │
│                                     │
│    GWATC 보조기기센터              │
│                                     │
│  강원특별자치도 통합 케어 플랫폼    │
│                                     │
│         [배경 이미지]               │
│                                     │
└─────────────────────────────────────┘
```

### 방법 2: Next.js ImageResponse API 사용 (동적 생성)

Next.js 13+ App Router에서는 `ImageResponse` API를 사용하여 동적으로 OG 이미지를 생성할 수 있습니다.

**예시**: `app/og/route.tsx`

```typescript
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 20 }}>GWATC</div>
        <div>보조기기센터</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

### 방법 3: 온라인 도구 사용

- [Canva](https://www.canva.com/) - 무료 템플릿 제공
- [Bannerbear](https://www.bannerbear.com/) - API 기반 동적 생성
- [OG Image Generator](https://og-image.vercel.app/) - Vercel 제공

---

## 파일 저장 위치

### 정적 이미지

```
public/
└── og-image.jpg          # 기본 OG 이미지
└── og/
    ├── services.jpg       # 서비스 페이지용
    ├── notices.jpg        # 공지사항용
    └── about.jpg          # 센터소개용
```

### 동적 이미지 (Next.js)

```
app/
└── og/
    └── route.tsx          # 동적 OG 이미지 생성
```

---

## 메타데이터 설정

### 루트 레이아웃 (`app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "GWATC 보조기기센터",
      },
    ],
  },
}
```

### 페이지별 설정

```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: `${baseUrl}/og/services.jpg`,
        width: 1200,
        height: 630,
        alt: "주요사업 | GWATC 보조기기센터",
      },
    ],
  },
}
```

---

## 테스트 방법

### 1. Facebook Sharing Debugger

- URL: https://developers.facebook.com/tools/debug/
- 사이트 URL 입력 후 "디버그" 클릭
- OG 이미지 미리보기 확인
- 캐시 삭제 후 다시 확인

### 2. Twitter Card Validator

- URL: https://cards-dev.twitter.com/validator
- 사이트 URL 입력
- Twitter Card 미리보기 확인

### 3. LinkedIn Post Inspector

- URL: https://www.linkedin.com/post-inspector/
- 사이트 URL 입력
- LinkedIn 공유 미리보기 확인

### 4. 카카오톡 링크 미리보기

- 카카오톡에서 링크 공유 시 자동으로 OG 이미지 표시
- 실제 공유 테스트 권장

---

## 현재 프로젝트 상태

### ✅ 완료된 항목

- [x] 메타데이터에 OG 이미지 필드 추가 (`app/layout.tsx`)
- [x] 기본 OG 이미지 경로 설정

### 📋 작업 필요 항목

- [ ] 실제 OG 이미지 파일 생성 (`public/og-image.jpg`)
  - 권장 크기: 1200 x 630 픽셀
  - 브랜드 로고 및 메시지 포함
- [ ] 페이지별 OG 이미지 생성 (선택 사항)
  - 서비스 페이지용
  - 공지사항용
  - 센터소개용

---

## 추천 디자인 요소

### 색상 팔레트

- **주 색상**: 브랜드 프라이머리 컬러
- **보조 색상**: 브랜드 세컨더리 컬러
- **텍스트**: 고대비 색상 (검정 또는 흰색)

### 텍스트 내용

- **메인 제목**: "GWATC 보조기기센터"
- **서브 제목**: "강원특별자치도 통합 케어 플랫폼"
- **추가 정보**: "상담 · 체험 · 맞춤형 지원 · 사후관리 · 교육/홍보"

### 이미지 요소

- 센터 건물 사진 (선택)
- 보조기기 이미지 (선택)
- 브랜드 로고
- 배경 패턴 또는 그라데이션

---

## 참고 자료

- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response)

---

**마지막 업데이트**: 2025. 01. 27
