// Theme presets + the rules every theme value must follow.
// Anything coming from storage, a JSON import or a share link is run through
// sanitizeTheme(), so only whitelisted fonts/enums, clamped numbers and
// #rrggbb colours can ever reach the page's CSS.

export const FONTS = {
  caveat: { label: 'Caveat', kind: 'handwritten', stack: "'Caveat', 'Comic Sans MS', cursive" },
  patrick: { label: 'Patrick Hand', kind: 'handwritten', stack: "'Patrick Hand', 'Comic Sans MS', cursive" },
  gaegu: { label: 'Gaegu', kind: 'handwritten', stack: "'Gaegu', 'Comic Sans MS', cursive" },
  nunito: { label: 'Nunito', kind: 'conventional', stack: "'Nunito', system-ui, sans-serif" },
  atkinson: { label: 'Atkinson Hyperlegible', kind: 'conventional', stack: "'Atkinson Hyperlegible', system-ui, sans-serif" },
  grotesk: { label: 'Space Grotesk', kind: 'conventional', stack: "'Space Grotesk', system-ui, sans-serif" },
  fraunces: { label: 'Fraunces (serif)', kind: 'conventional', stack: "'Fraunces', Georgia, serif" },
  system: { label: 'System default', kind: 'conventional', stack: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
}

// Handwritten fonts are visually smaller than conventional ones at the same px.
export const fontScale = (id) => (FONTS[id]?.kind === 'handwritten' ? (id === 'caveat' ? 1.22 : 1.08) : 1)

export const FONT_PAIRS = [
  { id: 'scrapbook', label: 'Scrapbook', heading: 'caveat', body: 'nunito' },
  { id: 'notebook', label: 'Notebook', heading: 'patrick', body: 'atkinson' },
  { id: 'doodle', label: 'Doodle', heading: 'gaegu', body: 'nunito' },
  { id: 'editorial', label: 'Editorial', heading: 'fraunces', body: 'atkinson' },
  { id: 'loud', label: 'Loud', heading: 'grotesk', body: 'grotesk' },
]

export const COLOR_FIELDS = [
  ['bg', 'Page background'],
  ['surface', 'Cards & surfaces'],
  ['surfaceAlt', 'Soft surface (notes, chips)'],
  ['text', 'Main text'],
  ['textMuted', 'Secondary text'],
  ['accent', 'Primary accent'],
  ['accent2', 'Secondary accent'],
  ['accent3', 'Third accent'],
  ['buttonBg', 'Button background'],
  ['buttonText', 'Button text'],
  ['border', 'Borders'],
  ['deco', 'Doodles & decorations'],
]

export const ENUMS = {
  borderStyle: ['solid', 'dashed', 'dotted', 'none'],
  shadowStyle: ['soft', 'hard'],
  density: ['compact', 'cozy', 'spacious'],
  pattern: ['none', 'dots', 'grid', 'lines', 'hearts', 'stars'],
  motion: ['playful', 'subtle', 'reduced'],
}

export const RANGES = {
  baseSize: [14, 21, 1],
  headingScale: [0.8, 1.5, 0.05],
  headingWeight: [400, 700, 100],
  lineHeight: [1.3, 1.9, 0.05],
  radius: [0, 32, 1],
  shadow: [0, 1, 0.05],
  borderWidth: [0, 4, 1],
  width: [520, 1100, 10],
  gap: [0.6, 1.6, 0.05],
  texture: [0, 1, 0.05],
  tilt: [0, 1.5, 0.05],
}

const base = {
  colors: {
    bg: '#F5E8DA', surface: '#FFF9F2', surfaceAlt: '#F6D5D8', text: '#543B45', textMuted: '#76616A',
    accent: '#D9879A', accent2: '#E7DDF5', accent3: '#DCE9D8', buttonBg: '#D9879A', buttonText: '#3A2530',
    border: '#E2CBBE', deco: '#C46F84',
  },
  type: { heading: 'caveat', body: 'nunito', baseSize: 17, headingScale: 1, headingWeight: 700, lineHeight: 1.6 },
  layout: { radius: 14, shadow: 0.45, shadowStyle: 'soft', borderStyle: 'solid', borderWidth: 1, width: 860, gap: 1, density: 'cozy' },
  deco: { pattern: 'dots', texture: 0.55, stickers: true, doodles: true, tape: true, polaroids: true, tilt: 1 },
  motion: { level: 'playful', decorative: true },
}

export const PRESETS = {
  scrapbook: { label: 'Soft scrapbook', blurb: 'warm paper, washi tape, handwriting', ...base },
  midnight: {
    label: 'Midnight', blurb: 'dark, starry, a little moody',
    colors: {
      bg: '#17131F', surface: '#241D30', surfaceAlt: '#352944', text: '#F2E7EE', textMuted: '#BBAAC4',
      accent: '#E89AAE', accent2: '#4A3B6B', accent3: '#2F4A42', buttonBg: '#E89AAE', buttonText: '#1E1424',
      border: '#43375A', deco: '#F3D27A',
    },
    type: { heading: 'patrick', body: 'nunito', baseSize: 17, headingScale: 1, headingWeight: 400, lineHeight: 1.65 },
    layout: { radius: 16, shadow: 0.7, shadowStyle: 'soft', borderStyle: 'solid', borderWidth: 1, width: 820, gap: 1.05, density: 'cozy' },
    deco: { pattern: 'stars', texture: 0.25, stickers: true, doodles: true, tape: false, polaroids: true, tilt: 0.6 },
    motion: { level: 'subtle', decorative: true },
  },
  pastel: {
    label: 'Dreamy pastel', blurb: 'soft clouds, round corners, gentle',
    colors: {
      bg: '#F3EDFB', surface: '#FFFFFF', surfaceAlt: '#E3F1F8', text: '#463A5E', textMuted: '#776C8E',
      accent: '#C88BBE', accent2: '#D9ECF7', accent3: '#DFF3E6', buttonBg: '#E7C4E0', buttonText: '#3B2C4F',
      border: '#E2D7F0', deco: '#A98BD6',
    },
    type: { heading: 'gaegu', body: 'nunito', baseSize: 17, headingScale: 1.05, headingWeight: 700, lineHeight: 1.7 },
    layout: { radius: 26, shadow: 0.3, shadowStyle: 'soft', borderStyle: 'none', borderWidth: 0, width: 800, gap: 1.15, density: 'spacious' },
    deco: { pattern: 'hearts', texture: 0.15, stickers: true, doodles: true, tape: false, polaroids: true, tilt: 0.5 },
    motion: { level: 'subtle', decorative: true },
  },
  chaos: {
    label: 'Internet chaos', blurb: 'loud colours, hard shadows, zero chill',
    colors: {
      bg: '#FFF27A', surface: '#FFFFFF', surfaceAlt: '#B9F3FF', text: '#1A1033', textMuted: '#45366A',
      accent: '#FF3EA5', accent2: '#7CF0FF', accent3: '#9DFF8A', buttonBg: '#1A1033', buttonText: '#FFF27A',
      border: '#1A1033', deco: '#7A3CFF',
    },
    type: { heading: 'grotesk', body: 'grotesk', baseSize: 17, headingScale: 1.1, headingWeight: 700, lineHeight: 1.5 },
    layout: { radius: 6, shadow: 1, shadowStyle: 'hard', borderStyle: 'solid', borderWidth: 3, width: 900, gap: 0.9, density: 'cozy' },
    deco: { pattern: 'grid', texture: 0, stickers: true, doodles: true, tape: true, polaroids: true, tilt: 1.5 },
    motion: { level: 'playful', decorative: true },
  },
  minimal: {
    label: 'Minimal', blurb: 'quiet, clean, no stickers',
    colors: {
      bg: '#FAF8F6', surface: '#FFFFFF', surfaceAlt: '#F3EEEC', text: '#2A2326', textMuted: '#6A6064',
      accent: '#B65A71', accent2: '#EDE7F2', accent3: '#E8EFE6', buttonBg: '#2A2326', buttonText: '#FFFFFF',
      border: '#E4DDDA', deco: '#B65A71',
    },
    type: { heading: 'fraunces', body: 'atkinson', baseSize: 17, headingScale: 0.9, headingWeight: 600, lineHeight: 1.6 },
    layout: { radius: 8, shadow: 0.12, shadowStyle: 'soft', borderStyle: 'solid', borderWidth: 1, width: 720, gap: 1, density: 'cozy' },
    deco: { pattern: 'none', texture: 0, stickers: false, doodles: false, tape: false, polaroids: false, tilt: 0 },
    motion: { level: 'subtle', decorative: false },
  },
}

export const PRESET_IDS = Object.keys(PRESETS)

// ---------- validation ----------

const HEX = /^#[0-9a-fA-F]{6}$/
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)

function clampNum(v, [min, max, step], fallback) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  const c = Math.min(max, Math.max(min, n))
  return Math.round(c / step) * step
}

/** Return a fully valid theme. Unknown keys are dropped; bad values fall back to `fallback` (a preset). */
export function sanitizeTheme(input, fallback = PRESETS.scrapbook) {
  const src = isObj(input) ? input : {}
  const out = { preset: PRESET_IDS.includes(src.preset) ? src.preset : (fallback.preset || 'scrapbook') }
  const groups = ['colors', 'type', 'layout', 'deco', 'motion']
  for (const g of groups) {
    out[g] = {}
    const s = isObj(src[g]) ? src[g] : {}
    for (const [k, def] of Object.entries(fallback[g])) {
      const v = s[k]
      if (g === 'colors') out[g][k] = typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : def
      else if (k === 'heading' || k === 'body') out[g][k] = typeof v === 'string' && FONTS[v] ? v : def
      else if (k === 'level') out[g][k] = ENUMS.motion.includes(v) ? v : def
      else if (ENUMS[k]) out[g][k] = ENUMS[k].includes(v) ? v : def
      else if (typeof def === 'boolean') out[g][k] = typeof v === 'boolean' ? v : def
      else if (RANGES[k]) out[g][k] = clampNum(v, RANGES[k], def)
      else out[g][k] = def
    }
  }
  if (typeof src.name === 'string') out.name = src.name.slice(0, 40)
  return out
}

export function presetTheme(id) {
  const p = PRESETS[id] || PRESETS.scrapbook
  const { label, blurb, ...rest } = p
  return sanitizeTheme({ ...structuredClone(rest), preset: PRESETS[id] ? id : 'scrapbook' }, { ...rest, preset: id })
}

/** Build a theme from a preset id plus partial overrides (used by the creator default + share links). */
export function themeFrom(presetId, overrides) {
  const basis = presetTheme(presetId)
  const o = isObj(overrides) ? overrides : {}
  const merged = { preset: basis.preset }
  for (const g of ['colors', 'type', 'layout', 'deco', 'motion']) merged[g] = { ...basis[g], ...(isObj(o[g]) ? o[g] : {}) }
  return sanitizeTheme(merged, basis)
}

/** Only the values that differ from the theme's preset. Keeps share links short. */
export function themeDiff(theme) {
  const basis = presetTheme(theme.preset)
  const diff = {}
  for (const g of ['colors', 'type', 'layout', 'deco', 'motion']) {
    for (const [k, v] of Object.entries(theme[g])) {
      if (basis[g][k] !== v) (diff[g] ||= {})[k] = v
    }
  }
  return diff
}

// ---------- contrast helpers (shown as readability hints in the studio) ----------

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
