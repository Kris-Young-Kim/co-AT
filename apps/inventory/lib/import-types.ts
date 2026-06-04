export interface ParsedRow {
  name?: string
  asset_code?: string
  manufacturer?: string
  model?: string
  category?: string
  purchase_date?: string
  purchase_price?: string
  status?: string
  barcode?: string
}

export interface ImportParseResult {
  headers: string[]
  mappedFields: string[]
  rows: ParsedRow[]
  total: number
  unmapped: string[]
}
