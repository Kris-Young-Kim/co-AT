import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { hasAdminOrStaffPermission } from '@/lib/utils/permissions'
import type { ParsedRow, ImportParseResult } from '@/inventory/lib/import-types'

export type { ParsedRow, ImportParseResult }

// Korean column name → inventory field mapping
const HEADER_MAP: Record<string, keyof ParsedRow> = {
  // asset_code
  '자산코드': 'asset_code', '자산번호': 'asset_code', '관리번호': 'asset_code',
  '자산 코드': 'asset_code', '자산 번호': 'asset_code', '코드': 'asset_code',
  // name (required)
  '품명': 'name', '기기명': 'name', '자산명': 'name', '물품명': 'name',
  '품목명': 'name', '자산 명': 'name', '기기 명': 'name', '제품명': 'name',
  // manufacturer
  '제조사': 'manufacturer', '제조업체': 'manufacturer', '브랜드': 'manufacturer',
  '제조자': 'manufacturer', '제조 사': 'manufacturer',
  // model
  '모델명': 'model', '모델': 'model', '형식': 'model', '규격': 'model', '모델 명': 'model',
  // category
  '분류': 'category', '종류': 'category', '카테고리': 'category',
  '자산분류': 'category', '품목분류': 'category', '품목 분류': 'category',
  // purchase_date
  '구입일자': 'purchase_date', '구입날짜': 'purchase_date', '취득일': 'purchase_date',
  '취득일자': 'purchase_date', '구매일': 'purchase_date', '구매일자': 'purchase_date',
  '구입 일자': 'purchase_date',
  // purchase_price
  '구입가격': 'purchase_price', '취득가액': 'purchase_price', '금액': 'purchase_price',
  '단가': 'purchase_price', '구입금액': 'purchase_price', '구매가격': 'purchase_price',
  '취득금액': 'purchase_price', '구입 가격': 'purchase_price',
  // status
  '상태': 'status', '현황': 'status', '자산상태': 'status',
  // barcode
  '바코드': 'barcode', 'barcode': 'barcode',
}


function formatCellDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === 'string') {
    // Normalize YYYY.MM.DD or YYYY/MM/DD → YYYY-MM-DD
    const normalized = value.replace(/[./]/g, '-').trim()
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(normalized)) {
      const [y, m, d] = normalized.split('-')
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }
  return String(value ?? '').trim()
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return formatCellDate(value)
  if (typeof value === 'object' && 'richText' in (value as object)) {
    return ((value as { richText: { text: string }[] }).richText ?? [])
      .map((r) => r.text)
      .join('')
      .trim()
  }
  return String(value).trim()
}

export async function POST(req: NextRequest) {
  const hasPermission = await hasAdminOrStaffPermission()
  if (!hasPermission) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: '요청 파싱 실패' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ error: 'Excel 파일(.xlsx, .xls)만 지원합니다' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = Buffer.from(arrayBuffer) as any
  const wb = new ExcelJS.Workbook()

  try {
    await wb.xlsx.load(buffer)
  } catch {
    return NextResponse.json({ error: 'Excel 파일을 읽을 수 없습니다' }, { status: 400 })
  }

  const ws = wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: '시트가 없습니다' }, { status: 400 })

  // Read headers from row 1
  const headers: string[] = []
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    headers.push(cellText(cell.value))
  })

  if (headers.length === 0) {
    return NextResponse.json({ error: '헤더 행을 찾을 수 없습니다' }, { status: 400 })
  }

  // Map header index → field name
  const colToField: Map<number, keyof ParsedRow> = new Map()
  const unmapped: string[] = []

  headers.forEach((h, i) => {
    const field = HEADER_MAP[h]
    if (field) {
      colToField.set(i + 1, field) // ExcelJS columns are 1-based
    } else if (h) {
      unmapped.push(h)
    }
  })

  // Parse data rows
  const rows: ParsedRow[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const obj: ParsedRow = {}
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const field = colToField.get(colNumber)
      if (!field) return

      const text = field === 'purchase_date'
        ? formatCellDate(cell.value)
        : cellText(cell.value)

      if (text) (obj as Record<string, string>)[field] = text
    })

    if (obj.name) rows.push(obj)
  })

  const mappedFields = Array.from(new Set(Array.from(colToField.values())))

  return NextResponse.json({
    headers,
    mappedFields,
    rows: rows.slice(0, 200), // preview cap
    total: rows.length,
    unmapped,
  } satisfies ImportParseResult)
}
