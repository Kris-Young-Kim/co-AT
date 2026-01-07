# 기여 가이드

Co-AT 프로젝트에 기여해주셔서 감사합니다!

## 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/your-org/co-AT.git
cd co-AT
```

2. 의존성 설치
```bash
pnpm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요.
자세한 내용은 `env.example` 파일을 참고하세요.

4. 개발 서버 실행
```bash
pnpm dev
```

## 개발 워크플로우

1. 새로운 브랜치 생성
```bash
git checkout -b feature/your-feature-name
```

2. 변경 사항 커밋
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
```

3. 커밋 메시지 컨벤션
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

4. Pull Request 생성
- PR 제목은 명확하게 작성
- 변경 사항을 상세히 설명
- 관련 이슈가 있다면 링크

## 코드 스타일

- ESLint 규칙 준수
- Prettier 포맷팅 적용
- TypeScript 타입 안정성 유지

## 테스트

PR 제출 전에 다음을 확인하세요:
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] `pnpm build` 성공

## 질문이 있으신가요?

이슈를 생성하거나 팀에 문의해주세요!
