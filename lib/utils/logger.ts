import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"
const logLevel = process.env.LOG_LEVEL || (isDev ? "debug" : "info")

/**
 * 구조화된 로깅 유틸리티 (pino 기반)
 * - JSON 출력 (프로덕션)
 * - 로그 레벨: trace, debug, info, warn, error, fatal
 * - 환경변수 LOG_LEVEL로 레벨 제어
 */
export const logger = pino({
  level: logLevel,
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
  base: {
    env: process.env.NODE_ENV,
  },
})

export type Logger = typeof logger
