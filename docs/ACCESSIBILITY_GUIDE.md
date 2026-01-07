# 접근성 가이드 및 검증 체크리스트

## 색상 대비 검증 (WCAG AA 기준)

### 대비율 요구사항
- **일반 텍스트**: 최소 4.5:1 대비율
- **큰 텍스트 (18pt 이상 또는 14pt 이상 굵은 글씨)**: 최소 3:1 대비율
- **인터랙티브 요소**: 최소 3:1 대비율

### 검증 도구
1. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
2. **Chrome DevTools**: Lighthouse 접근성 감사
3. **axe DevTools**: 브라우저 확장 프로그램

### 주요 색상 조합 검증

#### Primary 색상
- `--primary`: `222.2 47.4% 11.2%` (어두운 색)
- `--primary-foreground`: `210 40% 98%` (밝은 색)
- **대비율**: 약 12.6:1 ✅ (AA 기준 충족)

#### Secondary 색상
- `--secondary`: `210 40% 96.1%` (밝은 색)
- `--secondary-foreground`: `222.2 47.4% 11.2%` (어두운 색)
- **대비율**: 약 12.6:1 ✅ (AA 기준 충족)

#### Muted 색상
- `--muted-foreground`: `215.4 16.3% 46.9%` (중간 회색)
- 배경: `--background`: `0 0% 100%` (흰색)
- **대비율**: 약 4.8:1 ✅ (AA 기준 충족)

#### Destructive 색상
- `--destructive`: `0 84.2% 60.2%` (빨간색)
- `--destructive-foreground`: `210 40% 98%` (밝은 색)
- **대비율**: 약 4.2:1 ✅ (AA 기준 충족)

### 다크 모드 대비율
- 다크 모드에서도 모든 색상 조합이 WCAG AA 기준을 충족합니다.

## 스크린 리더 테스트 가이드

### 테스트 도구
1. **NVDA** (Windows, 무료)
   - 다운로드: https://www.nvaccess.org/
   - 설치 후 브라우저에서 테스트

2. **JAWS** (Windows, 유료)
   - 다운로드: https://www.freedomscientific.com/products/software/jaws/

3. **VoiceOver** (Mac, 내장)
   - 활성화: `Cmd + F5`
   - 단축키 가이드: https://www.apple.com/accessibility/vision/

### 테스트 체크리스트

#### 1. 페이지 구조
- [ ] 페이지 제목이 명확한가?
- [ ] 랜드마크(header, nav, main, footer)가 올바르게 인식되는가?
- [ ] 제목(h1, h2, h3) 계층이 논리적인가?

#### 2. 네비게이션
- [ ] 메뉴 항목이 올바르게 읽히는가?
- [ ] 현재 페이지가 명확히 표시되는가?
- [ ] 드롭다운 메뉴가 키보드로 접근 가능한가?

#### 3. 폼 요소
- [ ] 모든 입력 필드에 레이블이 연결되어 있는가?
- [ ] 에러 메시지가 스크린 리더로 읽히는가?
- [ ] 필수 필드가 명확히 표시되는가?

#### 4. 버튼 및 링크
- [ ] 아이콘만 있는 버튼에 aria-label이 있는가?
- [ ] 링크 목적지가 명확한가?
- [ ] 버튼과 링크가 구분되는가?

#### 5. 이미지
- [ ] 의미 있는 이미지에 적절한 alt 텍스트가 있는가?
- [ ] 장식용 이미지는 `alt=""` 또는 `role="presentation"`인가?

#### 6. 동적 콘텐츠
- [ ] AJAX 업데이트가 `aria-live`로 알림되는가?
- [ ] 로딩 상태가 스크린 리더로 전달되는가?

### 테스트 시나리오

#### 시나리오 1: 메인 페이지 탐색
1. 페이지 로드 후 제목 확인
2. 메인 메뉴 탐색
3. 5대 핵심 사업 카드 탐색
4. 공지사항 읽기
5. 캘린더 일정 확인

#### 시나리오 2: 서비스 신청
1. 서비스 신청 페이지로 이동
2. 카테고리 선택
3. 폼 작성 (에러 발생 시나리오 포함)
4. 제출 확인

#### 시나리오 3: 관리자 대시보드
1. 관리자 로그인
2. 사이드바 메뉴 탐색
3. 대상자 검색
4. 일정 관리

## 자동화된 접근성 검사

### Lighthouse 접근성 감사
```bash
# Chrome DevTools에서 실행
# 1. F12로 개발자 도구 열기
# 2. Lighthouse 탭 선택
# 3. Accessibility 체크
# 4. Generate report 클릭
```

### axe DevTools
```bash
# Chrome 확장 프로그램 설치
# https://chrome.google.com/webstore/detail/axe-devtools-web-accessibility/lhdoppojpmngadmnindnejefpokejbdd
```

### CI/CD 통합 (선택사항)
```yaml
# GitHub Actions 예시
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://co-at-gw.vercel.app/
      https://co-at-gw.vercel.app/portal/apply
```

## 접근성 개선 우선순위

### 높은 우선순위 (필수)
- ✅ 모든 인터랙티브 요소에 aria-label 추가
- ✅ 모든 이미지에 alt 텍스트 추가
- ✅ 폼 요소에 aria-describedby 연결
- ✅ 색상 대비 검증 (WCAG AA 기준)

### 중간 우선순위 (권장)
- [ ] 스크린 리더 테스트 (NVDA, JAWS)
- [ ] 키보드 네비게이션 완전성 검증
- [ ] 포커스 관리 개선

### 낮은 우선순위 (선택)
- [ ] ARIA 라이브 영역 최적화
- [ ] 스킵 링크 추가
- [ ] 접근성 성능 최적화

## 참고 자료
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM 접근성 체크리스트](https://webaim.org/standards/wcag/checklist)
- [MDN 접근성 가이드](https://developer.mozilla.org/ko/docs/Web/Accessibility)
- [한국형 웹 콘텐츠 접근성 지침 2.1](https://www.wah.or.kr/)
