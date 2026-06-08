import { readFileSync, writeFileSync } from 'fs'

const CSV_PATH = 'D:\\AILeader1\\project\\valuewith\\co-AT\\.playwright-mcp\\2-강원특별자치도보조기기센터-2026년-지역보조기기센터-서비스-실적-xlsx---품목명.csv'
const OUT_PATH = 'D:\\AILeader1\\project\\valuewith\\co-AT\\apps\\eval\\lib\\item-categories.ts'

function parseCSVLine(line) {
  const fields = []
  let i = 0
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1, val = ''
      while (j < line.length) {
        if (line[j] === '"' && line[j+1] === '"') { val += '"'; j += 2 }
        else if (line[j] === '"') { j++; break }
        else { val += line[j++] }
      }
      fields.push(val.trim())
      if (line[j] === ',') j++
      i = j
    } else {
      let j = i
      while (j < line.length && line[j] !== ',') j++
      fields.push(line.slice(i, j).trim())
      i = j + 1
    }
  }
  return fields
}

const raw = readFileSync(CSV_PATH, 'utf-8')
const lines = raw.split(/\r?\n/)

// Skip 3 header rows (title, blank, column header)
const items = []
for (const line of lines.slice(3)) {
  if (!line.trim()) continue
  const f = parseCSVLine(line)
  const name = f[2]?.trim()
  const area = f[3]?.trim()
  if (!name || !area) continue
  items.push({ name, area })
}

process.stderr.write(`Parsed ${items.length} items\n`)

// Collect unique area codes
const areas = [...new Set(items.map(i => i.area))].sort()
process.stderr.write(`Areas: ${areas.join(', ')}\n`)

const ts = `// Auto-generated from 품목명 탭 — do not edit manually
export interface ItemCategory {
  name: string
  area: string
}

export const ITEM_CATEGORIES: ItemCategory[] = ${JSON.stringify(items, null, 2)}
`

writeFileSync(OUT_PATH, ts, 'utf-8')
process.stderr.write(`Written to ${OUT_PATH}\n`)
