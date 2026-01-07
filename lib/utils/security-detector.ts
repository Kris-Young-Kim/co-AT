/**
 * 보안 위협 탐지 유틸리티
 * SQL Injection, XSS 공격 패턴 탐지
 */

export interface SecurityThreat {
  type: "sql_injection" | "xss_attack" | "suspicious_pattern"
  severity: "low" | "medium" | "high" | "critical"
  pattern: string
  description: string
  blocked: boolean
}

/**
 * SQL Injection 패턴
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|\#|\/\*|\*\/)/, // SQL 주석
  /(;|\||&)/, // 명령어 구분자
  /(\bOR\b\s+\d+\s*=\s*\d+)/i, // OR 1=1
  /(\bAND\b\s+\d+\s*=\s*\d+)/i, // AND 1=1
  /('|"|`).*(\bOR\b|\bAND\b).*('|"|`)/i, // 따옴표 내 OR/AND
  /(\bUNION\b.*\bSELECT\b)/i, // UNION SELECT
  /(\bEXEC\b|\bEXECUTE\b)/i, // EXEC 명령어
  /(\bDROP\b.*\bTABLE\b|\bDROP\b.*\bDATABASE\b)/i, // DROP TABLE/DATABASE
] as const

/**
 * XSS 공격 패턴
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // <script> 태그
  /javascript:/i, // javascript: 프로토콜
  /on\w+\s*=/i, // 이벤트 핸들러 (onclick, onerror 등)
  /<iframe[^>]*>/gi, // <iframe> 태그
  /<object[^>]*>/gi, // <object> 태그
  /<embed[^>]*>/gi, // <embed> 태그
  /<img[^>]*onerror/gi, // <img onerror>
  /<svg[^>]*onload/gi, // <svg onload>
  /<body[^>]*onload/gi, // <body onload>
  /eval\s*\(/i, // eval() 함수
  /expression\s*\(/i, // expression() 함수
  /<style[^>]*>.*?<\/style>/gi, // <style> 태그
] as const

/**
 * 의심스러운 패턴
 */
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // 경로 탐색 (../)
  /\.\.\\/, // 경로 탐색 (..\)
  /%2e%2e%2f/i, // URL 인코딩된 경로 탐색
  /\.\.%2f/i, // URL 인코딩된 경로 탐색
  /file:\/\//i, // file:// 프로토콜
  /data:text\/html/i, // data: URL
  /<base[^>]*>/gi, // <base> 태그
] as const

/**
 * 입력값에서 보안 위협 탐지
 */
export function detectSecurityThreats(
  input: string | null | undefined,
  options?: {
    checkSqlInjection?: boolean
    checkXss?: boolean
    checkSuspicious?: boolean
  }
): SecurityThreat[] {
  if (!input || typeof input !== "string") {
    return []
  }

  const threats: SecurityThreat[] = []
  const {
    checkSqlInjection = true,
    checkXss = true,
    checkSuspicious = true,
  } = options || {}

  // SQL Injection 탐지
  if (checkSqlInjection) {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        threats.push({
          type: "sql_injection",
          severity: "high",
          pattern: pattern.toString(),
          description: "SQL Injection 공격 시도가 탐지되었습니다",
          blocked: true,
        })
        break // 첫 번째 패턴만 기록
      }
    }
  }

  // XSS 공격 탐지
  if (checkXss) {
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push({
          type: "xss_attack",
          severity: "high",
          pattern: pattern.toString(),
          description: "XSS 공격 시도가 탐지되었습니다",
          blocked: true,
        })
        break // 첫 번째 패턴만 기록
      }
    }
  }

  // 의심스러운 패턴 탐지
  if (checkSuspicious) {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push({
          type: "suspicious_pattern",
          severity: "medium",
          pattern: pattern.toString(),
          description: "의심스러운 패턴이 탐지되었습니다",
          blocked: false, // 의심스러운 패턴은 차단하지 않고 로깅만
        })
        break
      }
    }
  }

  return threats
}

/**
 * 요청 본문에서 보안 위협 탐지
 */
export function detectThreatsInRequest(
  body: unknown,
  path: string,
  method: string
): SecurityThreat[] {
  const threats: SecurityThreat[] = []

  // 요청 본문을 문자열로 변환하여 검사
  let bodyString = ""
  try {
    if (typeof body === "string") {
      bodyString = body
    } else if (body) {
      bodyString = JSON.stringify(body)
    }
  } catch {
    // JSON 변환 실패 시 무시
  }

  // URL 경로도 검사
  const fullInput = `${path} ${bodyString}`

  // SQL Injection 및 XSS 탐지
  const detected = detectSecurityThreats(fullInput, {
    checkSqlInjection: true,
    checkXss: true,
    checkSuspicious: true,
  })

  threats.push(...detected)

  return threats
}

/**
 * IP 주소 기반 의심스러운 활동 탐지
 */
export function isSuspiciousIP(
  ip: string,
  recentAttempts: number,
  timeWindow: number = 3600000 // 1시간
): boolean {
  // 1시간 내 10회 이상 실패한 로그인 시도
  if (recentAttempts >= 10) {
    return true
  }

  // 특정 IP 패턴 (예: 프록시, VPN 등)은 추가 검증 필요
  // 실제 구현 시 IP 신뢰도 데이터베이스 활용 가능

  return false
}
