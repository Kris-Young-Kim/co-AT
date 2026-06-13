import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const APPS = [
  { name: 'web',        color: '#4338ca', initial: 'G' },
  { name: 'admin',      color: '#334155', initial: 'A' },
  { name: 'eval',       color: '#1d4ed8', initial: 'E' },
  { name: 'inventory',  color: '#15803d', initial: 'I' },
  { name: 'stats',      color: '#7c3aed', initial: 'S' },
  { name: 'approval',   color: '#c2410c', initial: 'P' },
  { name: 'automation', color: '#0f766e', initial: 'Au' },
  { name: 'hr',         color: '#be185d', initial: 'H' },
  { name: 'finance',    color: '#047857', initial: 'F' },
]

const SIZES = [
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
  { size: 180, filename: 'apple-touch-icon.png' },
]

function makeSvg(size, color, initial) {
  const fontSize = Math.floor(size * 0.38)
  const r = Math.floor(size * 0.22)
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${color}"/>` +
    `<text x="50%" y="50%" font-family="system-ui,sans-serif" font-size="${fontSize}" ` +
    `font-weight="700" fill="white" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`
  )
}

for (const app of APPS) {
  const dir = path.join(root, 'apps', app.name, 'public', 'icons')
  fs.mkdirSync(dir, { recursive: true })
  for (const { size, filename } of SIZES) {
    try {
      await sharp(makeSvg(size, app.color, app.initial)).png().toFile(path.join(dir, filename))
      console.log(`✓ apps/${app.name}/public/icons/${filename}`)
    } catch (err) {
      console.error(`✗ apps/${app.name}/public/icons/${filename}: ${err.message}`)
      process.exitCode = 1
    }
  }
}
console.log('\nDone. 27 icons generated.')
