import { readFileSync } from 'fs'

const CSV_PATH = 'D:\\AILeader1\\project\\valuewith\\co-AT\\.playwright-mcp\\2-강원특별자치도보조기기센터-2026년-지역보조기기센터-서비스-실적-xlsx---보조기기-서비스-상세.csv'
const SKIP_LINES = 43  // skip header + summary rows

// ── CSV parser ─────────────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const fields = []
  let i = 0
  while (i <= line.length) {
    if (line[i] === '"') {
      let j = i + 1
      let val = ''
      while (j < line.length) {
        if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2 }
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

// ── helpers ────────────────────────────────────────────────────────────────────
function toStr(v) {
  if (v === null || v === undefined || v === '') return null
  const s = v.trim()
  return s || null
}

function toBool(v) {
  if (!v) return false
  const s = String(v).trim()
  return s !== '' && s !== 'FALSE' && s !== 'false' && s !== '0'
}

function parseServiceDate(v) {
  if (!v) return null
  const s = String(v).trim().replace('.0', '')
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  if (/^\d{6}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-01`
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

function parseBirthDate(v) {
  if (!v) return null
  const s = String(v).trim()
  const m = s.match(/^(\d{2})(\d{2})(\d{2})/)
  if (m) {
    const yy = parseInt(m[1])
    const cent = yy <= (new Date().getFullYear() % 100) ? '20' : '19'
    return `${cent}${m[1]}-${m[2]}-${m[3]}`
  }
  return null
}

function deriveServiceFlags(cat) {
  const c = (cat || '').trim()
  return {
    is_consult:         c.includes('상담'),
    is_assessment:      c.includes('평가') && !c.includes('교부'),
    is_trial:           c.includes('체험'),
    is_rental:          c === '대여',
    is_custom_make:     c.includes('맞춤') && !c.includes('교부'),
    is_grant:           c.includes('교부'),
    is_education:       c.includes('교육'),
    is_other_business:  c.includes('기타사업'),
    is_info_provision:  c.includes('정보제공') || c === '정보',
    is_repair:          c.includes('수리'),
    is_cleaning:        c.includes('세척') || c.includes('소독'),
    is_reuse:           c === '재사용',
    is_monitoring:      c.includes('모니터링'),
  }
}

function sqlLit(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

// ── main ────────────────────────────────────────────────────────────────────────
const raw = readFileSync(CSV_PATH, 'utf-8')

// Normalize line endings and handle multi-line quoted fields
function splitCSVLines(text) {
  const lines = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') inQuote = !inQuote
    if (!inQuote && (ch === '\n' || (ch === '\r' && text[i+1] === '\n'))) {
      if (ch === '\r') i++ // skip \n after \r
      lines.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current) lines.push(current)
  return lines
}

const allLines = splitCSVLines(raw)
// Find first line where col[1] is a positive integer (the seq number)
let dataStart = 0
for (let i = 0; i < allLines.length; i++) {
  const f = parseCSVLine(allLines[i])
  const seq = (f[1] || '').trim()
  if (seq && /^\d+$/.test(seq) && parseInt(seq) > 0) {
    dataStart = i
    break
  }
}
process.stderr.write(`Header ends at logical line ${dataStart} (physical SKIP_LINES was ${SKIP_LINES})\n`)
const dataLines = allLines.slice(dataStart)

const rows = []
let skipped = 0

for (const line of dataLines) {
  if (!line.trim()) continue
  const f = parseCSVLine(line)

  const seq = toStr(f[1])
  if (!seq || isNaN(parseInt(seq))) { skipped++; continue }

  const name = toStr(f[7])
  if (!name) { skipped++; continue }

  const receivedAt = parseServiceDate(f[0])
  const birthDate = parseBirthDate(f[8])
  const serviceCategory = toStr(f[13])
  const flags = deriveServiceFlags(serviceCategory)

  const rawItemCat = toStr(f[15])
  const itemCategory = rawItemCat === '#N/A' ? null : rawItemCat
  const rawArea = toStr(f[17])
  const serviceArea = rawArea === '#N/A' ? null : rawArea

  const closedStatus = toStr(f[39])
  const isClosed = closedStatus === '종결'
  const recordStatus = isClosed ? '완료' : (closedStatus === '취소' ? '취소' : '미정')

  const appNo = toStr(f[6])

  rows.push({
    received_at:        receivedAt,
    application_year:   receivedAt ? parseInt(receivedAt.split('-')[0]) : null,
    application_month:  receivedAt ? parseInt(receivedAt.split('-')[1]) : null,
    application_no:     appNo ? parseInt(appNo) : null,
    is_re_application:  toBool(f[4]),
    name,
    birth_date:         birthDate,
    gender:             toStr(f[10]),
    region:             toStr(f[11]),
    disability_type:    toStr(f[12]),
    service_category:   serviceCategory,
    product_name:       toStr(f[14]),
    item_category:      itemCategory,
    service_content:    toStr(f[16]),
    service_area:       serviceArea,
    ...flags,
    is_public_funding:  toBool(f[27]),
    is_private_funding: toBool(f[28]),
    is_self_pay:        toBool(f[29]),
    is_funding_secured: toBool(f[30]),
    referral_type:      toStr(f[35]),
    is_phone:           toBool(f[36]),
    is_visit_in:        toBool(f[37]),
    is_visit_out:       toBool(f[38]),
    is_closed:          isClosed,
    record_status:      recordStatus,
    staff_name:         toStr(f[40]),
    contact:            toStr(f[41]),
    address:            toStr(f[42]),
    source:             'csv',
  })
}

// Output SQL batches
const COLS = [
  'received_at','application_year','application_month','application_no','is_re_application',
  'name','birth_date','gender','region','disability_type',
  'service_category','product_name','item_category','service_content','service_area',
  'is_consult','is_assessment','is_trial','is_rental','is_custom_make','is_grant',
  'is_education','is_other_business','is_info_provision','is_repair','is_cleaning',
  'is_reuse','is_monitoring',
  'is_public_funding','is_private_funding','is_self_pay','is_funding_secured',
  'referral_type','is_phone','is_visit_in','is_visit_out',
  'is_closed','record_status','staff_name','contact','address','source',
]

const BATCH = 50
let batchNum = 0
for (let i = 0; i < rows.length; i += BATCH) {
  batchNum++
  const batch = rows.slice(i, i + BATCH)
  const vals = batch.map(r => `(${COLS.map(c => sqlLit(r[c])).join(', ')})`).join(',\n')
  const sql = `INSERT INTO eval_service_records (${COLS.join(', ')}) VALUES\n${vals}\nON CONFLICT DO NOTHING;`
  console.log(`-- BATCH ${batchNum} (rows ${i+1}-${Math.min(i+BATCH, rows.length)})`)
  console.log(sql)
  console.log()
}

process.stderr.write(`Parsed: ${rows.length} rows, skipped: ${skipped}\n`)
