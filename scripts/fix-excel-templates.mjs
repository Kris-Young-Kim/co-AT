/**
 * One-time script: strip shared formula references from xlsx templates.
 * ExcelJS throws "Shared Formula master cell not found" on files with shared formulas.
 * This patches only the worksheet XML inside each zip — all other styles are untouched.
 *
 * Run: node scripts/fix-excel-templates.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Use jszip bundled with exceljs (transitive dep, guaranteed present)
const jszipPaths = [
  path.join(__dirname, '..', 'node_modules', 'jszip'),
  path.join(__dirname, '..', 'node_modules', '.pnpm', 'jszip@3.10.1', 'node_modules', 'jszip'),
]
let JSZip
for (const p of jszipPaths) {
  if (fs.existsSync(p)) { JSZip = require(p); break }
}
if (!JSZip) throw new Error('jszip not found — run pnpm install first')

const TEMPLATES_DIR = path.join(__dirname, '..', 'apps', 'stats', 'public', 'templates')
const templates = [
  'business_report_template.xlsx',
  'service_record_template.xlsx',
  'call_log_template.xlsx',
]

for (const filename of templates) {
  const filePath = path.join(TEMPLATES_DIR, filename)
  if (!fs.existsSync(filePath)) { console.log(`skip (not found): ${filename}`); continue }

  const raw = fs.readFileSync(filePath)
  const zip = await JSZip.loadAsync(raw)

  let patchedCount = 0
  for (const [name, file] of Object.entries(zip.files)) {
    if (!name.match(/^xl\/worksheets\/sheet\d+\.xml$/)) continue

    let xml = await file.async('string')
    const before = xml

    // Convert master shared formulas → regular formulas (keep formula text, drop type/ref/si attrs)
    xml = xml.replace(/<f\b[^>]*\bt="shared"\b[^>]*>([^<]+)<\/f>/g, '<f>$1</f>')

    // Remove reference shared formulas (self-closing, no formula text)
    xml = xml.replace(/<f\b[^>]*\bt="shared"\b[^>]*\/>/g, '')

    if (xml !== before) {
      zip.file(name, xml)
      patchedCount++
      console.log(`  patched ${name}`)
    }
  }

  if (patchedCount > 0) {
    const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    fs.writeFileSync(filePath, out)
    console.log(`✓ ${filename} — ${patchedCount} sheet(s) patched`)
  } else {
    console.log(`  ${filename} — no shared formulas found`)
  }
}

console.log('\nDone. Templates are now safe for ExcelJS direct load.')
