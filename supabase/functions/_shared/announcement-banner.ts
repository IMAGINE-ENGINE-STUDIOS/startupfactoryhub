// Server-side renderer for the branded startup-announcement banner.
// Renders an SVG through resvg-wasm so every channel (LinkedIn auto-post, studio
// exports) uses the exact same template. Supports standard social sizes.

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

/** Standard social sizes. `landscape` is the LinkedIn/OG default. */
export const BANNER_SIZES = {
  landscape: { w: 1200, h: 630, label: 'Landscape 1200x630' },
  square: { w: 1080, h: 1080, label: 'Square 1080x1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080x1350' },
} as const

export type BannerSize = keyof typeof BANNER_SIZES

export function normalizeSize(v?: string | null): BannerSize {
  const k = (v || '').toLowerCase()
  if (k === 'square' || k === '1080x1080') return 'square'
  if (k === 'portrait' || k === '1080x1350' || k === 'story') return 'portrait'
  return 'landscape'
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
  size?: BannerSize
}

export async function renderAnnouncementBanner(input: BannerInput): Promise<Uint8Array> {
  await ready()

  const size = input.size || 'landscape'
  const { w: W, h: H } = BANNER_SIZES[size]
  const stacked = size !== 'landscape'

  const primary = input.primaryColor || '#10b981'
  const accent = input.accentColor || '#7c3aed'
  const logo = await logoDataUri(input.logoUrl)

  // Scale everything off the landscape reference so proportions stay identical.
  const s = stacked ? W / 1000 : W / 1200
  const pad = Math.round(90 * s)

  const nameMaxChars = stacked ? 18 : 22
  const nameLines = wrap(input.name, nameMaxChars, 2)
  const baseNameSize = nameLines.length > 1 || input.name.length > 16 ? 62 : 76
  const nameSize = Math.round(baseNameSize * s)
  const nameStep = nameSize + Math.round(8 * s)

  const tagline = (input.tagline || '').replace(/\s+/g, ' ').trim()
  const taglineLines = wrap(tagline, stacked ? 42 : 58, stacked ? 3 : 2)
  const taglineSize = Math.round(27 * s)
  const taglineStep = Math.round(38 * s)

  const meta = [input.stage, input.industry].filter(Boolean).join(' · ')
  const metaSize = Math.round(24 * s)
  const eyebrowSize = Math.round(22 * s)

  const logoBox = Math.round((stacked ? 230 : 205) * s)
  const logoRadius = Math.round(36 * s)
  const logoInset = Math.round(16 * s)

  // Layout anchors
  const logoX = pad
  const logoY = stacked ? Math.round(H * 0.16) : Math.round((H - logoBox) / 2)
  const textX = stacked ? pad : logo ? Math.round(400 * s) : pad

  // First text baseline
  let y = stacked
    ? logo ? logoY + logoBox + Math.round(96 * s) : Math.round(H * 0.3)
    : Math.round(152 * s)

  const parts: string[] = []

  parts.push(
    `<text x="${textX}" y="${y}" font-family="Inter" font-weight="700" font-size="${eyebrowSize}" letter-spacing="${(4 * s).toFixed(1)}" fill="${primary}">${esc((input.eyebrow || 'NEW STARTUP JOINED').toUpperCase())}</text>`,
  )

  y += Math.round(86 * s)
  nameLines.forEach((l, i) => {
    parts.push(
      `<text x="${textX}" y="${y + i * nameStep}" font-family="Inter" font-weight="700" font-size="${nameSize}" fill="#ffffff">${esc(l)}</text>`,
    )
  })
  y += (nameLines.length - 1) * nameStep

  if (meta) {
    y += Math.round(52 * s)
    parts.push(
      `<text x="${textX}" y="${y}" font-family="Inter" font-weight="700" font-size="${metaSize}" fill="${accent}">${esc(meta.toUpperCase())}</text>`,
    )
  }

  if (taglineLines.length) {
    y += Math.round(60 * s)
    taglineLines.forEach((l, i) => {
      parts.push(
        `<text x="${textX}" y="${y + i * taglineStep}" font-family="Inter" font-weight="400" font-size="${taglineSize}" fill="#c7d2df">${esc(l)}</text>`,
      )
    })
  }

  const footY = H - Math.round(52 * s)
  const glowR = Math.round((stacked ? 620 : 420) * s)

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
    <clipPath id="logoClip"><rect x="${logoX}" y="${logoY}" width="${logoBox}" height="${logoBox}" rx="${logoRadius}"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${Math.round(120 * s)}" cy="${Math.round(80 * s)}" r="${glowR}" fill="url(#glow)" opacity="0.35"/>
  <rect x="0" y="0" width="${W}" height="${Math.round(8 * s)}" fill="url(#rule)"/>

  ${logo ? `<rect x="${logoX}" y="${logoY}" width="${logoBox}" height="${logoBox}" rx="${logoRadius}" fill="#ffffff" opacity="0.96"/>
  <image href="${esc(logo)}" x="${logoX + logoInset}" y="${logoY + logoInset}" width="${logoBox - logoInset * 2}" height="${logoBox - logoInset * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)"/>` : ''}

  ${parts.join('\n  ')}

  <rect x="${textX}" y="${footY - Math.round(44 * s)}" width="${Math.round(120 * s)}" height="${Math.round(4 * s)}" rx="2" fill="url(#rule)"/>
  <text x="${textX}" y="${footY}" font-family="Inter" font-weight="700" font-size="${Math.round(24 * s)}" fill="#ffffff">Startup Factory Hub</text>
  <text x="${textX + Math.round(250 * s)}" y="${footY}" font-family="Inter" font-weight="400" font-size="${Math.round(22 * s)}" fill="#7c8ba1">startupfactoryhub.com</text>
</svg>`

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontBuffers: fontCache!, defaultFontFamily: 'Inter', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}
