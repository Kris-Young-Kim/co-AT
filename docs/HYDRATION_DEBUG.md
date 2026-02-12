# React 418 Hydration 에러 대응 요약

## 적용된 수정 사항

| 대상 | 수정 |
|------|------|
| `VercelAnalyticsProvider` | Analytics/SpeedInsights 마운트 후 렌더 (Speed Insights 이슈 대응) |
| `layout.tsx` | `suppressHydrationWarning` on html, body |
| `HomeCalendarCompact` | `ssr: false` + 마운트 후 날짜 초기화 |
| `HomeCommunityNews` | `ssr: false` + time에 `suppressHydrationWarning` |
| `HomeGallerySlider` | `ssr: false` |
| `PublicHeader` | `ssr: false` |
| `SupportServiceChatbotFloating` | `ssr: false` |
| `AccessibilityToolbar`, `KeyboardNavigator` | `ssr: false` |
| `status` 페이지 | timestamp에 `suppressHydrationWarning` |

## 에러가 계속될 때

1. **시크릿 모드**에서 테스트해 브라우저 확장 영향 여부 확인
2. **개발 모드** (`pnpm dev`)로 실행 후 F12 → Console에서 전체 에러 메시지 확인
3. `Text content does not match` 등이 포함된 에러에서 **Server/Client 값**과 **컴포넌트 스택**을 확인하면 원인 특정 가능

## 참고

- https://react.dev/errors/418
- https://github.com/vercel/speed-insights/issues/89
