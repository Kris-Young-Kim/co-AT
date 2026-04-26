1. design.md에 포함될 주요 내용
   Color Palette: 브랜드 컬러, 시맨틱 컬러(Success, Error), 다크/라이트 모드 변수명.
   Typography: 폰트 패밀리, 사이즈 계층(H1~H6), 자간 및 행간 설정.
   Spacing & Grid: 여백 시스템(예: 4px 단위), 컨테이너 최대 너비.
   Components: 버튼, 입력창, 카드 등 주요 UI 요소의 상태별(Hover, Active) 스타일 규정.
   Icons & Assets: 사용할 아이콘 라이브러리(Lucide, FontAwesome 등) 및 에셋 경로.

2. AI 에이전트 활용 팁
   프롬프트 연결: AI에게 "프로젝트의 UI를 구현할 때 design.md의 스타일 가이드를 엄격히 준수해줘"라고 지시하면, 별도의 설명 없이도 정의된 변수와 스타일을 사용합니다.
   기술 스택 명시: CSS Variable, Tailwind CSS, 또는 Styled-components 중 어떤 방식을 사용할지 design.md 상단에 명시하면 코드가 더 깔끔해집니다.
   이 파일을 프로젝트 루트(Root)에 두면 AI가 컨텍스트를 파악할 때 우선적으로 참조하게 됩니다. 혹시 특정 프레임워크(React, Next.js 등)에 맞춘 템플릿이 필요하신가요? 혹은 직접 작성 중인 디자인 시스템의 초안을 보여주시면 AI가 읽기 좋게 최적화해 드릴 수 있습니다.
