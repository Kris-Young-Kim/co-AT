# 🔍 SEO 표준 (SEO Standard)

> **Co-AT 프로젝트 SEO 가이드라인**  
> 검색 엔진 최적화를 위한 필수 규칙 및 권장 사항

---

## 📚 목차

1. [소개](#소개-introduction)
2. [콘텐츠](#콘텐츠-content)
3. [내비게이션](#내비게이션-navigation)
4. [미디어](#미디어-media)
5. [메타데이터](#메타데이터-metadata)
6. [크롤링 가능성](#크롤링-가능성-crawlability)
7. [URL 및 도메인](#url-및-도메인-urls--domains)
8. [모바일](#모바일-mobile)
9. [구조화된 데이터](#구조화된-데이터-structured-data)
10. [지역 및 언어 타겟팅](#지역-및-언어-타겟팅-geo--language-targeting)
11. [기술적 요소](#기술적-요소-technical)
12. [추천 SEO 도구](#추천-seo-도구-및-리소스)

---

## 소개 (Introduction)

### 개요 (Overview)

#### 요약 (Summary)

검색 엔진 최적화(SEO)란 검색 엔진의 크롤링(수집) 및 인덱싱(색인)을 관리하기 위해 사이트에 콘텐츠 전략, 기술적 설정, 전술을 적용하는 방법론을 의미합니다. SEO 프로그램의 최종 목표는 높은 순위를 획득하여 유기적(Organic) 검색을 통해 관련성 높은 웹페이지로 유입되는 사용자 수를 늘리는 것입니다.

**참고**: 이 SEO 표준은 **Public Zone(메인 홈페이지, 서비스 신청 페이지 등)**에만 적용됩니다. 관리자 페이지는 내부용이므로 SEO 최적화 대상에서 제외됩니다.

### 검색 엔진 작동 원리

검색 엔진은 크롤링(Crawling), 인덱싱(Indexing), 랭킹(Ranking)의 세 단계로 작동합니다.

#### 1. 크롤링 (Crawling)

- 검색 엔진은 "크롤러", "봇" 또는 "스파이더"라고 불리는 자동화된 로봇을 사용하여 페이지의 콘텐츠를 찾고 저장합니다.
- 로봇은 페이지에 진입한 뒤 그 페이지에서 발견한 링크를 통해 나가도록 설계되어 있습니다.
- XML 사이트맵이나 RSS 피드를 통해 새로운 URL을 발견하기도 합니다.

#### 2. 인덱싱 (Indexing)

- URL을 발견한 후, 검색 엔진 로봇은 페이지의 콘텐츠를 인덱싱(색인)합니다.
- 페이지 제목, 메타데이터, 페이지 콘텐츠 등의 정보를 추출하여 검색 엔진 데이터베이스에 저장합니다.
- 이 데이터베이스를 검색 엔진 "인덱스(Index)"라고 하며, 검색 엔진이 저장하고 있는 페이지의 버전을 "캐시(Cache)"라고 합니다.

#### 3. 랭킹 (Ranking)

- 검색이 수행되면 검색 엔진은 자체 인덱스를 검토하여 제공된 기준에 따라 가장 관련성 높은 결과를 찾으려 합니다.
- 특정 문서의 관련성은 자동화된 랭킹 알고리즘에 의해 결정되며, 이 알고리즘은 최적의 결과를 결정하기 위해 수백 개의 신호를 고려합니다.

### 랭킹 신호 (Ranking Signals)

#### 주요 랭킹 신호

검색 엔진이 콘텐츠 순위를 매기기 위해 집중하는 네 가지 주요 영역:

1. **콘텐츠 품질 및 E-E-A-T (Content Quality & E-E-A-T)**
   - **E-E-A-T**: 경험(Experience), 전문성(Expertise), 권위(Authoritativeness), 신뢰성(Trustworthiness)
   - 사이트 콘텐츠의 독창성 및 유용성
   - 사용자의 검색 의도(Search Intent)와의 일치도
   - **AI로 생성된 콘텐츠는 반드시 인간의 검토(Human-in-the-loop)를 거쳐야 합니다.**

2. **아키텍처 (Architecture)**
   - 크롤링 및 인덱싱 용이성
   - 페이지 로딩 속도 및 코어 웹 바이탈(Core Web Vitals) 성능
   - HTTPS 보안 연결 지원 (필수)
   - 모바일 친화성(Mobile Friendliness)

3. **링크 그래프 (Link Graph)**
   - 독립된 별도의 웹사이트에서 문서로 연결되는 인바운드 링크(백링크)는 관련성을 나타내는 투표로 간주됩니다.
   - 링크를 게시하는 사이트의 권위와 주제적 일치 여부가 중요합니다.

4. **사용자 신호 (User Signals)**
   - 검색 결과 페이지(SERP)에서의 클릭률(CTR)과 체류 시간(Dwell time)
   - 사용자가 결과 페이지에서 사이트로 이동한 후 만족스러운 경험을 했는지가 랭킹에 반영됩니다.

#### 모바일 랭킹 신호 (Mobile Ranking Signals)

구글은 **"모바일 우선(mobile-first)"** 인덱싱을 사용합니다. 이는 모바일 기기에 제공되는 콘텐츠, 사용자 경험 및 기술 아키텍처가 모든 플랫폼의 검색 성능의 기준이 된다는 것을 의미합니다.

- **반응형 디자인(Responsive Design)**이 표준이며 필수적입니다.
- 방해가 되는 전면 광고나 팝업은 랭킹에 부정적인 영향을 미칩니다.
- 터치 타겟(버튼 등)은 탭하기 충분히 커야 합니다 (최소 44x44 CSS 픽셀).
- 페이지 속도는 모바일의 강력한 랭킹 요소입니다.

---

## 콘텐츠 (Content)

### 핵심 (Core)

#### 규칙: 페이지 제목은 고유하고 명확하며 설명적이어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 모든 페이지에는 제목 태그(`<title>`)가 채워져 있어야 합니다. (필수)
- 모든 페이지의 제목은 사이트 전체에서 일관된 패턴을 따라야 합니다. (필수)
- 키워드는 제목의 시작 부분 쪽으로 배치해야 합니다. (권장)
- 반복되는 정보는 제목의 끝부분에 배치해야 합니다. (권장)
- 페이지 제목은 약 60자 이내(픽셀 너비 580px)를 권장합니다. (권장)
- 모든 페이지 제목에는 브랜드 접미사가 포함되어야 합니다. (필수)
- 제목 태그에는 페이지 언어에 대한 참조가 포함되어서는 안 됩니다. (필수)
- 특수 문자는 이스케이프 처리해야 합니다. (필수)

**예시**:
```html
<!-- ✅ 좋은 예 -->
<title>보조기기센터 서비스 신청 | GWATC</title>

<!-- ❌ 나쁜 예 -->
<title>GWATC | 보조기기센터 서비스 신청</title> <!-- 키워드가 뒤에 있음 -->
```

#### 규칙: 헤딩(Headings)은 검색 엔진에 페이지 구조를 명확히 알려야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 헤딩은 콘텐츠 섹션을 나타내는 데 사용되어야 합니다. (필수)
- `<h1>`은 주요 콘텐츠의 시작을 나타내는 데 사용되어야 합니다. (필수)
- 헤딩은 해당 섹션의 콘텐츠를 정확하고 설명적으로 나타내야 합니다. (필수)
- 페이지당 정확히 하나의 `<h1>`이 사용되어야 합니다. (필수)
- 헤딩은 논리적이고 순차적인 순서(H1 → H2 → H3)로 사용되어야 합니다. (필수)
- 헤딩은 스타일링 목적으로 사용되어서는 안 됩니다. (필수)

**예시**:
```html
<!-- ✅ 좋은 예 -->
<h1>보조기기센터 서비스 안내</h1>
  <h2>상담 서비스</h2>
    <h3>방문 상담</h3>
    <h3>전화 상담</h3>
  <h2>대여 서비스</h2>

<!-- ❌ 나쁜 예 -->
<h1>보조기기센터 서비스 안내</h1>
<h3>상담 서비스</h3> <!-- H2를 건너뜀 -->
<h1>대여 서비스</h1> <!-- H1이 중복됨 -->
```

#### 규칙: 콘텐츠는 자연어로 작성되어야 하며 AI 생성 콘텐츠는 검토가 필요함

**수준**: 권장 (SHOULD)

**구현 가이드라인**:

- 키워드 조사를 수행하여 사용자가 검색하는 단어를 파악해야 합니다. (권장)
- **AI로 생성된 콘텐츠는 반드시 인간의 검토(Human-in-the-loop)를 거쳐야 합니다.** (필수)
  - 사실 관계 확인 없이 대량 생성된 AI 콘텐츠는 저품질로 간주되어 페널티를 받을 수 있습니다.
- 콘텐츠는 주로 사용자를 위해, 읽기 쉽고 명확하게 작성되어야 합니다.

#### 규칙: 기능 이름에 대시 또는 마이너스 기호를 사용해서는 안 됨

**수준**: 권장 (SHOULD)

검색 연산자(-)와 혼동될 수 있으므로 기능 명칭에 마이너스 기호 사용을 지양합니다.

---

## 내비게이션 (Navigation)

### 규칙: 링크는 적절하게 사용되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- URL 단축기를 사용해서는 안 됩니다. (권장)
- 타겟 페이지는 리디렉션을 거치지 않고 직접 링크되어야 합니다. (권장)
- 링크는 자바스크립트 없이도 크롤링 가능해야 합니다. (필수)
- 제3자 속성이나 광고성 링크에는 `rel="nofollow"` 또는 `rel="sponsored"`를 사용해야 합니다. (권장)
- 앵커 텍스트는 목적지를 설명해야 하며 "여기를 클릭" 같은 용어는 피해야 합니다. (권장)
- 내부 링크를 통해 관련 콘텐츠를 연결하십시오. (권장)

**예시**:
```html
<!-- ✅ 좋은 예 -->
<a href="/services/consult">상담 서비스 안내</a>

<!-- ❌ 나쁜 예 -->
<a href="/services/consult">여기를 클릭</a>
<a href="#" onclick="goToConsult()">상담 서비스</a> <!-- 자바스크립트 의존 -->
```

### 규칙: 브레드크럼은 적절하게 사용되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 브레드크럼 구현은 자바스크립트가 비활성화된 상태에서도 접근 가능해야 합니다. (필수)
- 브레드크럼 내비게이션은 모든 페이지에 일관되게 나타나야 합니다. (권장)
- 구조화된 데이터(Schema.org)를 사용하여 검색 엔진에 노출해야 합니다. (권장)

**예시**:
```html
<nav aria-label="브레드크럼">
  <ol>
    <li><a href="/">홈</a></li>
    <li><a href="/services">서비스</a></li>
    <li>상담 서비스</li>
  </ol>
</nav>
```

---

## 미디어 (Media)

### 규칙: 이미지는 적절하게 사용되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 모든 이미지에는 `alt` 속성이 있어야 합니다. (필수)
- 이미지 검색이 중요한 자산에는 `alt` 속성을 반드시 채워야 합니다. (필수)
- 구조화된 데이터(ImageObject)를 사용하십시오. (권장)
- 이미지 XML 사이트맵을 활용하십시오. (권장)
- 이미지 내 텍스트보다는 시스템 텍스트를 사용해야 합니다. (권장)
- 차세대 이미지 포맷(WebP, AVIF) 사용을 권장합니다. (권장)

**예시**:
```html
<!-- ✅ 좋은 예 -->
<img src="/images/wheelchair.jpg" alt="전동 휠체어 대여 서비스" />

<!-- 장식용 이미지 -->
<img src="/images/decoration.jpg" alt="" role="presentation" />

<!-- ❌ 나쁜 예 -->
<img src="/images/wheelchair.jpg" /> <!-- alt 속성 없음 -->
```

### 규칙: 비디오는 적절하게 사용되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 비디오는 HTML 페이지에 직접 임베드 되어야 합니다. (권장)
- 비디오 구조화된 데이터(VideoObject)를 사용하십시오. (권장)
- 비디오에는 텍스트 스크립트(자막/대본)가 포함되어야 합니다. (필수)
- 비디오 XML 사이트맵을 활용하십시오. (권장)

### 규칙: PDF 콘텐츠는 사용해서는 안 됨

**수준**: 권장 (SHOULD)

검색 노출이 주 목적인 콘텐츠는 PDF가 아닌 웹 페이지로 제작해야 합니다.

### 규칙: 파일 이름은 적절하게 지정되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 파일 이름에는 콘텐츠를 설명하는 키워드가 포함되어야 합니다. (권장)
- 키워드는 하이픈(-)으로 구분해야 합니다. (권장)
- 파일 이름은 소문자, 숫자, 하이픈으로만 구성되어야 합니다. (권장)

**예시**:
```
✅ 좋은 예:
- wheelchair-rental-service.jpg
- assistive-device-center.jpg

❌ 나쁜 예:
- IMG_1234.jpg
- 파일명.jpg
- image 1.png
```

---

## 메타데이터 (Metadata)

### 규칙: 메타 설명은 적절하게 사용되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 모든 페이지에는 고유한 메타 설명이 포함되어야 합니다. (권장)
- 메타 설명은 30~150자(한중일 30~75자) 사이여야 합니다. (권장)
- 클릭을 유도하는(CTA) 문구를 포함하는 것이 좋습니다. (권장)

**예시**:
```html
<meta name="description" content="보조기기센터에서 제공하는 상담, 대여, 맞춤제작 등 5대 핵심 서비스를 신청하세요. 전문가 상담과 맞춤형 지원을 받을 수 있습니다." />
```

### 규칙: 메타 키워드 태그는 사용하지 않는 것이 좋음 (Deprecated)

**수준**: 권장 (SHOULD)

메타 키워드는 구글과 Bing에서 무시되며, 오히려 경쟁사에게 키워드 전략을 노출할 수 있으므로 사용을 권장하지 않습니다.

### 규칙: 페이지네이션 시리즈는 `rel="prev"` 및 `rel="next"`를 구현해야 함

**수준**: 권장 (SHOULD)

**예시**:
```html
<link rel="prev" href="/notices?page=1" />
<link rel="next" href="/notices?page=3" />
```

---

## 크롤링 가능성 (Crawlability)

### 사이트맵 (Sitemap)

#### 규칙: 사이트맵은 적절하게 구현되어야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- 표준(Canonical) URL만 XML 사이트맵에 포함되어야 합니다. (필수)
- robots.txt에 의해 차단된 URL은 포함해서는 안 됩니다. (필수)
- XML 사이트맵 인덱스 파일은 50MB(비압축 기준) 또는 50,000개 이상의 URL을 포함해서는 안 됩니다. (필수)
- XML 사이트맵은 UTF-8로 인코딩되어야 합니다. (필수)

**구현 위치**: `app/sitemap.ts` 또는 `public/sitemap.xml`

### 리디렉션 (Redirects)

#### 규칙: 영구적인 이동에는 301(307), 일시적인 이동에는 302(308)를 사용해야 함

**수준**: 필수 (MUST)

- 301 리디렉션은 링크 권위를 전달하지만, 302는 전달하지 않습니다.

#### 규칙: 리디렉션 체인을 최소화해야 함

**수준**: 필수 (MUST)

#### 규칙: 메타 리프레시 및 자바스크립트 리디렉션은 사용하지 않아야 함

**수준**: 필수 (MUST)

### 검색 엔진 관리 (Search Engine Management)

#### 규칙: robots `<meta>` 태그는 적절하게 구현되어야 함

**수준**: 필수 (MUST)

인덱싱을 방지하려면 `noindex`를 사용하는 것이 가장 확실합니다.

**예시**:
```html
<!-- 관리자 페이지 등 인덱싱 방지 -->
<meta name="robots" content="noindex, nofollow" />
```

#### 규칙: Robots.txt는 적절하게 사용되어야 함

**수준**: 필수 (MUST)

robots.txt는 크롤링(접근)을 제어하는 용도이며, 인덱싱을 완전히 막지 못할 수 있습니다. 민감한 정보 차단에는 `noindex`나 암호 보호를 사용하십시오.

**구현 위치**: `public/robots.txt`

**예시**:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://co-at-gw.vercel.app/sitemap.xml
```

#### 규칙: 웹마스터 도구는 검색 엔진 인덱스를 관리하는 데 사용되어야 함

**수준**: 필수 (MUST)

- [Google Search Console](https://search.google.com/search-console)
- [Naver Search Advisor](https://searchadvisor.naver.com/)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

---

## URL 및 도메인 (URLs & Domains)

### 규칙: HTTPS가 기본 프로토콜로 사용되어야 함

**수준**: 필수 (MUST)

보안 연결(HTTPS)은 필수적인 랭킹 신호입니다. HTTP 요청은 반드시 HTTPS로 301 리디렉션되어야 합니다.

### 규칙: URL은 콘텐츠 허브를 중심으로 생성되어야 함

**수준**: 권장 (SHOULD)

**예시**:
```
✅ 좋은 예:
/services/consult
/services/rental
/services/custom-make

❌ 나쁜 예:
/page1
/page2
```

### 규칙: 개별 하위 디렉터리 내의 모든 단어는 하이픈을 사용하여 구분해야 함

**수준**: 필수 (MUST)

밑줄(_)이나 공백은 피해야 합니다.

**예시**:
```
✅ 좋은 예:
/services/custom-make
/notices/2024-01-27

❌ 나쁜 예:
/services/custom_make
/services/customMake
```

### 규칙: URL 내의 모든 문자는 소문자여야 함

**수준**: 필수 (MUST)

### 규칙: URL은 정규화되고 인코딩되어야 함

**수준**: 필수 (MUST)

### 규칙: 중복 콘텐츠 방지를 위해 Canonical 태그를 사용해야 함

**수준**: 필수 (MUST)

동일하거나 매우 유사한 콘텐츠가 여러 URL에서 접근 가능한 경우, 검색 엔진에게 원본 URL을 알려주어야 합니다.

**예시**:
```html
<link rel="canonical" href="https://co-at-gw.vercel.app/services/consult" />
```

---

## 모바일 (Mobile)

### 규칙: 반응형 디자인 사용은 필수임 (Responsive Design must be used)

**수준**: 필수 (MUST)

데스크톱과 모바일의 콘텐츠가 일치해야 합니다. 반응형 디자인은 단일 URL로 모든 기기에 대응하므로 SEO에 가장 유리합니다.

### 규칙: 독립 모바일 사이트(m.example.com)는 지양해야 함

**수준**: 권장 (SHOULD)

별도의 모바일 URL은 관리 비용을 증가시키고 링크 권위를 분산시킬 위험이 있습니다.

### 규칙: 상호작용 요소는 충분한 타겟 영역을 가져야 함

**수준**: 필수 (MUST)

터치 타겟은 최소 44x44 CSS 픽셀 이상이어야 하며, 요소 간 간격을 충분히 확보해야 합니다.

### 규칙: `meta name="viewport"` 태그가 정의되어야 함

**수준**: 필수 (MUST)

**예시**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### 규칙: 구식 기술(Flash 등)은 사용하지 않아야 함

**수준**: 필수 (MUST)

모바일 및 최신 브라우저에서 지원하지 않는 플러그인 기반 콘텐츠는 사용하지 마십시오.

---

## 구조화된 데이터 (Structured Data)

### 규칙: JSON-LD 형식을 사용한 Schema.org 마크업을 권장함

**수준**: 권장 (SHOULD)

검색 엔진이 가장 선호하고 유지보수가 쉬운 포맷은 JSON-LD입니다.

**예시**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "보조기기센터",
  "url": "https://co-at-gw.vercel.app",
  "logo": "https://co-at-gw.vercel.app/logo.png"
}
</script>
```

### 규칙: 구조화된 데이터는 페이지 콘텐츠를 정확히 반영해야 함

**수준**: 필수 (MUST)

사용자에게 보이지 않는 콘텐츠를 허위로 마크업 하거나, 관련 없는 유형을 사용하는 것은 가이드라인 위반입니다.

### 규칙: Open Graph 및 Twitter Card 마크업은 적절하게 구현되어야 함

**수준**: 필수 (MUST)

소셜 미디어 공유 시 최적화된 경험을 제공하기 위해 OG 태그를 구현하십시오.

**예시**:
```html
<meta property="og:title" content="보조기기센터 서비스 안내" />
<meta property="og:description" content="5대 핵심 서비스를 제공하는 보조기기센터입니다." />
<meta property="og:image" content="https://co-at-gw.vercel.app/og-image.jpg" />
<meta property="og:url" content="https://co-at-gw.vercel.app/services" />
```

---

## 지역 및 언어 타겟팅 (Geo & Language Targeting)

### 규칙: 언어는 `lang` 속성으로 적절하게 표시되어야 함

**수준**: 필수 (MUST)

**예시**:
```html
<html lang="ko">
```

### 규칙: `hreflang`은 적절하게 구현되어야 함 (다국어/다국가 사이트의 경우)

**수준**: 필수 (MUST)

다국어/다국가 사이트의 경우 `hreflang` 태그를 사용하여 사용자 언어/지역에 맞는 페이지를 제공하고 중복 콘텐츠 문제를 방지해야 합니다.

---

## 기술적 요소 (Technical)

### 자바스크립트 (JavaScript)

#### 규칙: 핵심 콘텐츠는 자바스크립트 없이도 접근 가능하거나, SSR을 사용해야 함

**수준**: 필수 (MUST)

**구현 가이드라인**:

- SPA(Single Page Application)는 SSR(Server-Side Rendering) 또는 정적 생성(Static Generation)을 사용해야 합니다. (권장)
- 클라이언트 사이드 렌더링(CSR)만 사용할 경우 검색 봇이 빈 페이지를 보거나 콘텐츠를 늦게 발견할 위험이 있습니다.
- **Hashbang(#!) 방식은 폐기되었습니다.** History API를 사용하여 깨끗한 URL을 제공하십시오. (필수)

**Co-AT 적용**: Next.js 15 App Router는 기본적으로 SSR을 사용하므로 이 요구사항을 충족합니다.

#### 규칙: 모든 페이지는 고유하고 SEO 친화적인 URL로 접근 가능해야 함

**수준**: 필수 (MUST)

### 성능 (Performance)

#### 규칙: 로드 시간을 최적화해야 함 (Load time must be optimized)

**수준**: 필수 (MUST)

2025년 기준 최신 성능 지표 및 권장 기준(Core Web Vitals)은 다음과 같습니다:

1. **LCP (Largest Contentful Paint)**: 가장 큰 콘텐츠가 화면에 표시되는 시간. **2.5초 이하** 권장.
2. **INP (Interaction to Next Paint)**: 클릭/터치 등 상호작용 후 반응까지의 지연 시간 (기존 FID 대체). **200ms 이하** 권장.
3. **CLS (Cumulative Layout Shift)**: 시각적 안정성(레이아웃 이동) 측정. **0.1 이하** 권장.

**구현 가이드라인**:

- 텍스트 기반 자산(HTML, CSS, JS)은 축소(Minify) 및 압축(GZIP/Brotli)해야 합니다. (권장)
- 사용하지 않는 자바스크립트 실행을 최소화하여 INP를 개선하십시오. (권장)
- 이미지 및 비디오 자산을 최적화하고 CDN을 활용하십시오. (권장)
- HTTP 캐싱을 활성화하십시오. (권장)

**Co-AT 적용**:
- Next.js Image 컴포넌트 사용 (자동 최적화)
- Vercel CDN 활용
- `next.config.mjs`에서 이미지 최적화 설정

---

## 추천 SEO 도구 및 리소스 (Recommended SEO Tools & Resources)

### 웹마스터 도구

- [Google Search Console](https://search.google.com/search-console) - 구글 공식 웹마스터 도구
- [Bing Webmaster Tools](https://www.bing.com/webmasters) - 마이크로소프트 Bing 웹마스터 도구
- [Naver Search Advisor](https://searchadvisor.naver.com/) - 네이버 검색 어드바이저
- [Daum 웹마스터도구](https://webmaster.daum.net/) - 카카오 검색 최적화용

### 테스트 및 검증 도구

- [Rich Results Test](https://search.google.com/test/rich-results) - 구조화된 데이터 테스트
- [Schema.org Validator](https://validator.schema.org) - Schema.org 마크업 검증
- [PageSpeed Insights](https://pagespeed.web.dev/) - 코어 웹 바이탈 성능 분석

### SEO 분석 도구

- [Majestic SEO](https://majestic.com) - 백링크 분석 및 링크 인텔리전스
- [Screaming Frog](https://www.screamingfrog.co.uk/seo-spider/) - 기술적 SEO 감사를 위한 웹사이트 크롤러
- [Ahrefs](https://ahrefs.com) - 종합 SEO 도구 세트
- [SEMrush](https://www.semrush.com) - 올인원 마케팅 툴킷

### 유용한 리소스

- [Google Search Central](https://developers.google.com/search) - 구글 검색 공식 문서
- [Schema.org](https://schema.org) - 구조화된 데이터 어휘 문서

---

## Co-AT 프로젝트 적용 체크리스트

### ✅ 완료된 항목

- [x] Next.js 16 App Router (SSR 기본 지원)
- [x] 반응형 디자인 (Tailwind CSS)
- [x] HTTPS 기본 프로토콜 (Vercel 배포)
- [x] 이미지 최적화 (Next.js Image 컴포넌트)
- [x] 메타데이터 기본 설정 (`app/layout.tsx`)
- [x] XML 사이트맵 생성 (`app/sitemap.ts`)
- [x] robots.txt 파일 생성 (`public/robots.txt`)
- [x] 각 페이지별 고유한 메타 설명 추가 (Public Zone 주요 페이지)
- [x] 구조화된 데이터(Schema.org) 마크업 추가
  - Organization (메인 페이지)
  - NewsArticle (공지사항 상세)
  - BreadcrumbList (브레드크럼)
- [x] Open Graph 및 Twitter Card 태그 추가 (루트 레이아웃 및 페이지별)
- [x] 브레드크럼 구조화된 데이터 추가 (`components/common/breadcrumb.tsx`)
- [x] Canonical URL 태그 추가 (모든 Public Zone 페이지)
- [x] OG 이미지 설정 가이드 제공 (`docs/OG_IMAGE_GUIDE.md`)

### 📋 수동 작업 필요 항목

- [ ] 실제 OG 이미지 파일 생성 (`public/og-image.jpg`)
  - 권장 크기: 1200 x 630 픽셀
  - 참고: `docs/OG_IMAGE_GUIDE.md`
- [ ] Google Search Console 등록
  - 사이트 URL 등록
  - 인증 코드를 `app/layout.tsx`의 `verification.google`에 추가
- [ ] Naver Search Advisor 등록
  - 사이트 URL 등록
  - 인증 코드를 `app/layout.tsx`의 `verification.other["naver-site-verification"]`에 추가

---

**마지막 업데이트**: 2025. 01. 27
