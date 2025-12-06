📊 Project Co-AT: Visual Documentation (Mermaid.md)
프로젝트: GWATC 통합 케어 플랫폼 (Co-AT)
버전: 3.0 (Architecture Locked)
설명: 시스템 아키텍처, 데이터베이스 모델링, 핵심 로직 시각화
작성일: 2025. 12. 06.
1. 🏗️ 시스템 아키텍처 (System Architecture)
Next.js 15 App Router와 Vercel 인프라 위에서 Clerk(인증), Supabase(데이터), Gemini(AI)가 어떻게 상호작용하는지 보여줍니다.
code
Mermaid
graph TD
    %% 스타일 정의
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    User([사용자 / 직원]) -->|HTTPS| Edge[Vercel Edge Network]
    
    subgraph Frontend_Layer [Next.js 15 App Router]
        Edge -->|Auth Check| Middleware
        Middleware -->|RSC Payload| Page[Server Component]
        Middleware -->|Interact| Client[Client Component]
        Client -->|Mutation| Action[Server Actions]
    end

    subgraph Auth_Service [Authentication]
        Clerk[Clerk Auth]
    end
    
    subgraph Backend_Layer [Supabase BaaS]
        DB[(PostgreSQL)]
        Realtime(Realtime Channel)
        Bucket(Storage: Images)
        Vector(pgvector: RAG)
    end

    subgraph AI_Service [Google Cloud]
        Gemini[Gemini 1.5 Flash]
    end

    %% 데이터 흐름
    Middleware -.->|Validate Session| Clerk
    Action -->|Direct SQL| DB
    Action -->|Upload File| Bucket
    Action -->|Generate Content| Gemini
    Gemini -->|JSON Output| Action
    DB -->|State Change| Realtime
    Realtime -.->|Sync| Client

    %% 클래스 적용
    class Edge,Middleware,Page,Client,Action frontend;
    class DB,Realtime,Bucket,Vector backend;
    class Gemini ai;
    class Clerk auth;
2. 🗄️ 데이터베이스 관계도 (ERD)
Clerk User ID를 중심으로 5대 핵심 사업 데이터가 어떻게 연결되는지 정의합니다.
code
Mermaid
erDiagram
    %% 사용자 프로필 (Clerk Mirror)
    PROFILES {
        uuid id PK "Supabase UUID"
        text clerk_user_id UK "CLERK USER ID (Link)"
        text role "user | staff | manager"
        text full_name
        text team "소속 팀"
    }

    %% 재고/자산 (Inventory)
    INVENTORY {
        uuid id PK
        text name "기기명"
        text asset_code "자산번호"
        text status "보관 | 대여중 | 수리중"
        boolean is_rental_available
    }

    %% 통합 신청서 (Center of 5 Business)
    APPLICATIONS {
        uuid id PK
        uuid applicant_id FK "신청자"
        text category "상담|체험|맞춤|사후|교육"
        text sub_category "대여|수리|견학..."
        text status "접수|배정|진행|완료"
        date desired_date
    }

    %% 서비스 로그 (Result Data)
    SERVICE_LOGS {
        uuid id PK
        uuid application_id FK
        uuid staff_id FK
        uuid inventory_id FK "관련 기기"
        jsonb soap_note "AI 상담 데이터"
        integer cost_total "수리/제작비"
        text[] images
    }

    %% 관계선
    PROFILES ||--o{ APPLICATIONS : "requests"
    PROFILES ||--o{ SERVICE_LOGS : "writes (Staff)"
    
    INVENTORY ||--o{ SERVICE_LOGS : "used in"
    
    APPLICATIONS ||--|| SERVICE_LOGS : "results in"
3. 🔄 서비스 신청 및 처리 생명주기 (Lifecycle)
5대 사업 신청서가 접수되어 완료되기까지의 상태 변화 로직입니다.
code
Mermaid
stateDiagram-v2
    [*] --> 접수됨: 온라인 신청 (User)
    
    state "검토 및 배정" as Review {
        접수됨 --> 배정완료: 담당자 지정
        접수됨 --> 반려: 부적격/재고없음
    }

    배정완료 --> 진행중: 방문/내방/서비스 시작

    state "서비스 수행 (5대 사업)" as Processing {
        진행중 --> AI일지작성: 상담/평가
        진행중 --> 재고출고: 대여 서비스
        진행중 --> 수리_제작: 사후관리/맞춤형
    }

    state "비즈니스 로직 체크" as Logic {
        수리_제작 --> 한도초과: 연 10만원/2회 초과 시
        한도초과 --> 수리_제작: 자부담 안내 후 진행
    }

    Processing --> 완료: 결과 보고서 작성
    완료 --> [*]
    반려 --> [*]
4. 🧠 AI SOAP 노트 생성 시퀀스 (AI Sequence)
현장 직원이 모바일로 상담 내용을 입력하고 AI가 정제하는 과정입니다.
code
Mermaid
sequenceDiagram
    autonumber
    actor Staff as 직원 (Mobile)
    participant UI as SoapNoteEditor
    participant Action as Server Action
    participant Gemini as Google Gemini
    participant DB as Supabase

    Staff->>UI: 1. 음성 녹음 또는 메모 입력
    Staff->>UI: 2. [AI 변환] 버튼 클릭
    
    UI->>Action: 3. `generateSoapNote(text)` 호출
    
    Action->>Action: System Prompt 결합 (JSON 강제)
    Action->>Gemini: 4. API Request (Prompt + Input)
    
    activate Gemini
    Gemini-->>Action: 5. Response: { S, O, A, P } JSON
    deactivate Gemini
    
    Action-->>UI: 6. Return Parsed Data
    
    UI->>UI: 7. 에디터에 내용 자동 채움
    Staff->>UI: 8. 내용 수정 및 [저장] 클릭
    
    UI->>Action: 9. `saveServiceLog(data)` 호출
    Action->>DB: 10. INSERT service_logs
    DB-->>Action: 11. Success
    Action-->>UI: 12. Toast "저장 완료"
5. 🗺️ 사이트맵 및 사용자 흐름 (User Flow)
로그인 여부와 권한(Role)에 따른 페이지 접근 구조입니다.
code
Mermaid
graph LR
    Entry((접속)) --> Auth{로그인?}
    
    %% Public Zone
    Auth -- No --> Landing[Public Landing]
    Landing --> ServiceInfo[5대 사업 안내]
    Landing --> Gallery[보조기기 영상]
    Landing --> Calendar[공개 캘린더 (견학/교육 일정)]
    Landing --> Login[Clerk 로그인]

    %% User Zone
    Auth -- Yes (User) --> Portal[마이페이지]
    Portal --> Wizard[통합 신청 마법사]
    Wizard --> SelectType{유형 선택}
    SelectType --> TypeA[상담/체험]
    SelectType --> TypeB[수리/대여]
    SelectType --> TypeC[교육/견학]
    Portal --> Timeline[진행상황 타임라인]

    %% Staff Zone
    Auth -- Yes (Staff) --> Admin[업무 시스템]
    Admin --> Dashboard[통합 대시보드]
    Admin --> CRM[대상자/신청 관리]
    Admin --> Inventory[재고/자산 관리]
    Admin --> AITools[AI 일지/규정검색]