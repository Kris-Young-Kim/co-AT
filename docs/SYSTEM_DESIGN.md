[사례관리 시스템] 데이터 마이그레이션 및 실적 보고 자동화 설계
1. 개요
본 문서는 기존 구글 스프레드시트 기반의 사례관리 데이터를 차세대 웹 시스템(co-AT, Supabase 기반)으로 전환하고, 중앙보조기기센터 보고 양식에 맞춘 실적 출력 기능을 구현하기 위한 기술 가이드라인이다.
2. 데이터 마이그레이션 전략 (Google Sheets → Supabase)
2.1 표준 텍스트 매핑 (Data Cleansing)
중앙 보고 양식(사례관리 서비스 제공현황 등)은 코드화된 데이터가 아닌 특정 표준 한글 단어를 사용한다. 마이그레이션 시 기존 시트의 자유 기입형 데이터를 아래의 표준 단어로 정제하여 삽입한다.
장애유형: 지체, 뇌병변, 시각, 청각, 언어, 지적, 자폐성, 정신, 신장, 심장, 호흡기, 간, 안면, 장루·요루, 뇌전증
급여종류: 기초, 차상위, 일반
서비스내용: 상담, 평가, 적용, 공적급여 연계, 수리, 사후관리 등
2.2 데이터베이스 스키마 설계 (PostgreSQL)
중앙 보고 양식의 컬럼 순서와 데이터 형식을 반영하여 clients 및 services 테이블을 구성한다.
code
SQL
-- 대상자 정보 테이블 (중앙 보고 양식 기준)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_code TEXT UNIQUE, -- 기존 시트의 등록코드 관리
    name TEXT NOT NULL,
    gender TEXT,           -- '남', '여'
    birth_date DATE,       -- YYYY-MM-DD
    disability_type TEXT,  -- 표준 단어 (지체, 뇌병변 등)
    disability_level TEXT, -- 장애정도
    benefit_type TEXT,     -- 급여종류 (기초, 차상위 등)
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 서비스 제공 기록 (실적보고용 집계 대상)
CREATE TABLE service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    service_date DATE NOT NULL,
    service_content TEXT,  -- '상담', '평가' 등 표준 단어
    device_name TEXT,      -- 보조기기명
    management_note TEXT,  -- 진행사항/사후관리 내용
    is_completed BOOLEAN DEFAULT FALSE
);
3. 업무 프로세스 이식 (Google Sheets Workflow)
기존 구글 시트의 5단계 파일을 웹앱의 인터페이스(UX)로 전환한다.
조회 및 검색 (File 1 Concept):
메인 대시보드에서 성명/등록번호로 실시간 검색.
Supabase RLS(Row Level Security)를 통해 권한별 데이터 접근 제어.
접수 및 상담 (File 2 Concept):
PWA 기반 모바일 최적화 폼 제공.
기존 대상자 선택 시 기본 정보(clients 테이블) 자동 로드.
서비스 제공 및 사후관리 (File 4-5 Concept):
기기 대여/수리/교부 이력을 service_logs 테이블에 타임라인 형태로 기록.
4. 중앙 보고 양식 엑셀 출력 시스템
4.1 시스템 구조
입력된 실시간 데이터를 중앙 보고용 엑셀 파일(XLSX)로 변환하는 자동화 파이프라인을 구축한다.
Backend (Supabase View): 엑셀 양식의 컬럼 순서와 동일한 뷰(v_central_report)를 생성한다.
Frontend (ExcelJS): 원본 엑셀 템플릿 파일에 데이터를 주입(Injection)한다.
4.2 주요 출력 항목 매핑
보고 양식 컬럼	DB 필드 (Supabase)	처리 로직
성명	clients.name	단순 출력
장애유형	clients.disability_type	표준 단어 검증
서비스내용	service_logs.service_content	서비스 일자별 그룹화
사후관리내용	service_logs.management_note	사후관리 시트 전용 출력
4.3 구현 예시 (JavaScript)
code
JavaScript
import ExcelJS from 'exceljs';

async function generateReport() {
  const { data } = await supabase.from('v_central_report').select('*');
  
  const workbook = new ExcelJS.Workbook();
  const template = await fetch('/template_case_report.xlsx').then(res => res.arrayBuffer());
  await workbook.xlsx.load(template);
  
  const sheet = workbook.getWorksheet(1);
  data.forEach((item, index) => {
    const row = sheet.getRow(4 + index); // 4행부터 시작
    row.getCell('B').value = item.name;
    row.getCell('C').value = item.gender;
    row.getCell('D').value = item.birth_date;
    // ... 나머지 컬럼 매핑
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `실적보고서_${new Date().toLocaleDateString()}.xlsx`);
}
5. 기대 효과
보고 업무 단축: 분기별 실적 집계 시간을 수 시간에서 클릭 한 번(1분 이내)으로 단축.
데이터 일관성: 구글 시트의 자유 기입 형식에서 발생하는 오타 및 규격 오류를 원천 차단.
현장성 강화: PWA를 통해 현장에서 즉시 입력된 데이터가 별도의 가공 없이 실적 보고서로 연결.
수정 및 추가 사항:
이 설계는 사용자님이 제공해주신 중앙 보고 양식 3종의 구조를 100% 반영하도록 설계되었습니다.
Supabase의 테이블명이나 컬럼명은 실제 프로젝트 환경에 맞게 변경하여 사용하시기 바랍니다.