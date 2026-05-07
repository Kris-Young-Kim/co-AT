// apps/eval/lib/google-sheets.ts
import { google, sheets_v4 } from 'googleapis'

/**
 * Google Sheets API 클라이언트를 Service Account로 초기화.
 * GOOGLE_SERVICE_ACCOUNT_JSON 환경변수에 Service Account JSON 전체를 저장한다.
 */
function getAuthClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

/**
 * 지정한 스프레드시트의 시트 데이터를 2차원 배열로 반환한다.
 * @param spreadsheetId Google 스프레드시트 ID (URL의 /d/ 뒤 문자열)
 * @param range 읽을 범위 (예: "2026!A:W")
 */
export async function getSheetValues(
  spreadsheetId: string,
  range: string
): Promise<(string | number | boolean | null)[][]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })

  return (response.data.values ?? []) as (string | number | boolean | null)[][]
}

/**
 * 스프레드시트의 모든 시트 이름 목록을 반환한다.
 */
export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const auth = getAuthClient()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.get({ spreadsheetId })
  return (response.data.sheets ?? []).map(
    (s: sheets_v4.Schema$Sheet) => s.properties?.title ?? ''
  )
}
