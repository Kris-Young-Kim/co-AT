/**
 * PII masking utility for STT transcripts.
 * Replaces Korean phone numbers (dashed/raw), resident registration numbers,
 * and bank account numbers with asterisks before persistence.
 * Does NOT cover: email addresses, credit card numbers (4x4 format).
 */

const PHONE_DASHED = /(\d{2,3})-(\d{3,4})-(\d{4})/g
const PHONE_RAW = /\b(01[0-9]{9})\b/g
const RRN = /(\d{6})-(\d{7})/g
const ACCOUNT = /\b(\d{3,6})-(\d{3,6})-(\d{6,12})\b/g

export function maskPii(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(ACCOUNT, (_, a, b, c) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}-${'*'.repeat(c.length)}`)
    .replace(PHONE_DASHED, (_, a, b, c) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}-${'*'.repeat(c.length)}`)
    .replace(PHONE_RAW, (m) => '*'.repeat(m.length))
    .replace(RRN, (_, a, b) => `${'*'.repeat(a.length)}-${'*'.repeat(b.length)}`)
}
