// apps/eval/lib/google-sheets.ts
import { google, sheets_v4 } from 'googleapis'

function createSheetsClient(): sheets_v4.Sheets {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('Missing required env var: GOOGLE_SERVICE_ACCOUNT_JSON')
  }
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(raw) as object,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

// Lazy singleton — initialized on first use so missing env var surfaces as a runtime error
// inside the caller's try/catch rather than crashing at module load time.
let _sheetsClient: ReturnType<typeof createSheetsClient> | null = null
function getSheetsClient() {
  if (!_sheetsClient) {
    _sheetsClient = createSheetsClient()
  }
  return _sheetsClient
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
  const response = await getSheetsClient().spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })

  // googleapis SDK types values as any[][] — cast to the expected union type.
  // Cell values from Sheets are always primitives when UNFORMATTED_VALUE is used.
  return (response.data.values ?? []) as (string | number | boolean | null)[][]
}

/**
 * 스프레드시트의 모든 시트 이름 목록을 반환한다.
 */
export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const response = await getSheetsClient().spreadsheets.get({ spreadsheetId })
  return (response.data.sheets ?? []).map(
    (s: sheets_v4.Schema$Sheet) => s.properties?.title ?? ''
  )
}
