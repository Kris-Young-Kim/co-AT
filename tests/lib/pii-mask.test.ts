import { describe, it, expect } from 'vitest'
import { maskPii } from '@/lib/utils/pii-mask'

describe('maskPii', () => {
  it('전화번호 마스킹 — 010-xxxx-xxxx 형식', () => {
    expect(maskPii('전화번호는 010-1234-5678 입니다')).toBe('전화번호는 ***-****-**** 입니다')
  })

  it('전화번호 마스킹 — 공백 없는 형식', () => {
    expect(maskPii('01012345678로 연락주세요')).toBe('***********로 연락주세요')
  })

  it('주민등록번호 마스킹 — 앞 6자리-뒤 7자리', () => {
    expect(maskPii('주민번호 900101-1234567 입력')).toBe('주민번호 ******-******* 입력')
  })

  it('계좌번호 마스킹 — 숫자-숫자-숫자 패턴', () => {
    expect(maskPii('계좌 123-456-789012')).toBe('계좌 ***-***-******')
  })

  it('마스킹 대상 없으면 원문 그대로 반환', () => {
    const text = '안녕하세요, 오늘 방문 감사합니다.'
    expect(maskPii(text)).toBe(text)
  })

  it('null/undefined 입력 시 빈 문자열 반환', () => {
    expect(maskPii(null)).toBe('')
    expect(maskPii(undefined)).toBe('')
  })
})
