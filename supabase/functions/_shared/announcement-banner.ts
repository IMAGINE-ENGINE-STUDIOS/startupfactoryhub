// Server-side renderer for the branded startup-announcement banner (1200x627, LinkedIn ratio).
// Renders an SVG through resvg-wasm so the automated LinkedIn post always follows the template.

import { initWasm, Resvg } from 'https://esm.sh/@resvg/resvg-wasm@2.6.2'

const WASM_URL = 'https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm'
const FONT_BOLD = 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.2.3/Inter_700Bold.ttf'
const FONT_REGULAR = 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.2.3/Inter_400Regular.ttf'

let wasmReady: Promise<void> | null = null
let fontCache: Uint8Array[] | null = null

async function ready() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const res = await fetch(WASM_URL)
      await initWasm(await res.arrayBuffer())
    })()
  }
  await wasmReady
  if (!fontCache) {
    const [b, r] = await Promise.all([fetch(FONT_BOLD), fetch(FONT_REGULAR)])
    fontCache = [new Uint8Array(await b.arrayBuffer()), new Uint8Array(await r.arrayBuffer())]
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim())
      cur = w
      if (lines.length === maxLines) break
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur.trim())
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]$/, '') + '…'
  }
  return lines
}

async function logoDataUri(url?: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') || 'image/png'
    if (type.includes('svg')) return null
    const buf = new Uint8Array(await res.arrayBuffer())
    let bin = ''
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i])
    return `data:${type};base64,${btoa(bin)}`
  } catch {
    return null
  }
}

export interface BannerInput {
  name: string
  industry?: string | null
  stage?: string | null
  tagline?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
  accentColor?: string | null
  eyebrow?: string
}

export async function renderAnnouncementBanner(input: BannerInput): Promise<Uint8Array> {
  await ready()

  const W = 1200
  const H = 627
  const primary = input.primaryColor || '#10b981'
  const accent = input.accentColor || '#7c3aed'
  const logo = await logoDataUri(input.logoUrl)

  const nameLines = wrap(input.name, 22, 2)
  const nameSize = nameLines.length > 1 || input.name.length > 16 ? 62 : 76
  const tagline = (input.tagline || '').replace(/\s+/g, ' ').trim()
  const taglineLines = wrap(tagline, 58, 2)

  const meta = [input.stage, input.industry].filter(Boolean).join(' · ')

  const textX = logo ? 400 : 90

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050b16"/>
      <stop offset="55%" stop-color="#0b1a2e"/>
      <stop offset="100%" stop-color="#0a0f22"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <clipPath id="logoClip"><rect x="110" y="211" width="205" height="205" rx="36"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="120" cy="80" r="420" fill="url(#glow)" opacity="0.35"/>
  <rect x="0" y="0" width="${W}" height="8" fill="url(#rule)"/>

  ${logo ? `<rect x="110" y="211" width="205" height="205" rx="36" fill="#ffffff" opacity="0.96"/>
  <image href="${esc(logo)}" x="126" y="227" width="173" height="173" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)"/>` : ''}

  <text x="${textX}" y="152" font-family="Inter" font-weight="700" font-size="22" letter-spacing="4" fill="${primary}">${esc((input.eyebrow || 'NEW STARTUP JOINED').toUpperCase())}</text>

  ${nameLines
    .map((l, i) => `<text x="${textX}" y="${238 + i * (nameSize + 8)}" font-family="Inter" font-weight="700" font-size="${nameSize}" fill="#ffffff">${esc(l)}</text>`)
    .join('\n  ')}

  ${meta ? `<text x="${textX}" y="${238 + nameLines.length * (nameSize + 8) + 10}" font-family="Inter" font-weight="700" font-size="24" fill="${accent}">${esc(meta.toUpperCase())}</text>` : ''}

  ${taglineLines
    .map((l, i) => `<text x="${textX}" y="${238 + nameLines.length * (nameSize + 8) + 70 + i * 38}" font-family="Inter" font-weight="400" font-size="27" fill="#c7d2df">${esc(l)}</text>`)
    .join('\n  ')}

  <rect x="${textX}" y="${H - 96}" width="120" height="4" rx="2" fill="url(#rule)"/>
  <text x="${textX}" y="${H - 52}" font-family="Inter" font-weight="700" font-size="24" fill="#ffffff">Startup Factory Hub</text>
  <text x="${textX + 250}" y="${H - 52}" font-family="Inter" font-weight="400" font-size="22" fill="#7c8ba1">startupfactoryhub.com</text>
</svg>`

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontBuffers: fontCache!, defaultFontFamily: 'Inter', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}
