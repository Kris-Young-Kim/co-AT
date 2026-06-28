import {
  Html, Head, Body, Container, Heading, Text, Hr, Section, Row, Column
} from '@react-email/components'

interface Props {
  newStaffName: string
  prevStaffName: string | null
  clientName: string
  clientDisabilityType: string | null
  clientBirthDate: string | null
  clientContact: string | null
  lifecycleStatus: string
  serviceCount: number
  consultationCount: number
  hasActiveIppa: boolean
  clientPageUrl: string
}

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  closed: '종결',
  readmit: '재접수',
}

export function StaffHandoverEmail({
  newStaffName,
  prevStaffName,
  clientName,
  clientDisabilityType,
  clientBirthDate,
  clientContact,
  lifecycleStatus,
  serviceCount,
  consultationCount,
  hasActiveIppa,
  clientPageUrl,
}: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 32 }}>
          <Heading style={{ fontSize: 20, color: '#111' }}>담당자 인수인계 안내</Heading>
          <Hr />
          <Text>
            <strong>{newStaffName}</strong>님, 아래 대상자가 새로 배정되었습니다.
          </Text>
          {prevStaffName && (
            <Text style={{ fontSize: 13, color: '#6b7280' }}>
              이전 담당자: {prevStaffName}
            </Text>
          )}

          <Section style={{ background: '#f3f4f6', borderRadius: 6, padding: '16px 20px', marginTop: 16 }}>
            <Heading as="h2" style={{ fontSize: 15, color: '#111', margin: '0 0 12px' }}>
              대상자 기본 정보
            </Heading>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%', color: '#6b7280', fontSize: 13 }}>이름</Column>
              <Column style={{ fontSize: 13, fontWeight: 600 }}>{clientName}</Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%', color: '#6b7280', fontSize: 13 }}>장애유형</Column>
              <Column style={{ fontSize: 13 }}>{clientDisabilityType ?? '—'}</Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%', color: '#6b7280', fontSize: 13 }}>생년월일</Column>
              <Column style={{ fontSize: 13 }}>{clientBirthDate ?? '—'}</Column>
            </Row>
            <Row style={{ marginBottom: 8 }}>
              <Column style={{ width: '40%', color: '#6b7280', fontSize: 13 }}>연락처</Column>
              <Column style={{ fontSize: 13 }}>{clientContact ?? '—'}</Column>
            </Row>
            <Row>
              <Column style={{ width: '40%', color: '#6b7280', fontSize: 13 }}>생애주기</Column>
              <Column style={{ fontSize: 13 }}>{STATUS_LABEL[lifecycleStatus] ?? lifecycleStatus}</Column>
            </Row>
          </Section>

          <Section style={{ marginTop: 16 }}>
            <Heading as="h2" style={{ fontSize: 15, color: '#111', margin: '0 0 12px' }}>
              이력 요약
            </Heading>
            <Row style={{ marginBottom: 6 }}>
              <Column style={{ width: '50%', fontSize: 13, color: '#374151' }}>서비스 기록</Column>
              <Column style={{ fontSize: 13, fontWeight: 600 }}>{serviceCount}건</Column>
            </Row>
            <Row style={{ marginBottom: 6 }}>
              <Column style={{ width: '50%', fontSize: 13, color: '#374151' }}>상담기록지</Column>
              <Column style={{ fontSize: 13, fontWeight: 600 }}>{consultationCount}건</Column>
            </Row>
            <Row>
              <Column style={{ width: '50%', fontSize: 13, color: '#374151' }}>K-IPPA 진행 중</Column>
              <Column style={{ fontSize: 13, fontWeight: 600 }}>{hasActiveIppa ? '예' : '없음'}</Column>
            </Row>
          </Section>

          <Hr />
          <Text>
            <a href={clientPageUrl} style={{ color: '#2563eb' }}>
              대상자 상세 페이지 바로가기 →
            </a>
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            본 메일은 GWATC AX PLATFORM 자동 발송 메일입니다.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const staffHandoverSubject = (clientName: string) =>
  `[GWATC] ${clientName}님 담당자 인수인계`
