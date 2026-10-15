// Content (copy) validation. The bundled site-config.json is the template:
// any imported/draft content is walked against it, keeping only values of the
// same shape, capping lengths, and falling back to the defaults otherwise.
import SITE from '../config/site-config.json'

export const DEFAULT_CONFIG = SITE
export const ICONS = ['sun', 'cloud', 'battery', 'storm', 'heart', 'star', 'flower', 'coffee', 'moon', 'sparkle']
export const MODES = ['personal', 'friend']

const MAX_STR = 600
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const LIST_LIMITS = { moods: [2, 6], options: [2, 6], buckets: [1, 6] }

function cleanStr(v, def) {
  if (typeof v !== 'string') return def
  // strip control chars (keeps newlines), cap length
  const s = v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').slice(0, MAX_STR)
  return s.trim() ? s : def
}

function walk(input, template, key) {
  if (typeof template === 'string') {
    if (key === 'icon') return ICONS.includes(input) ? input : template
    if (key === 'id') return typeof input === 'string' && /^[a-z0-9-]{1,24}$/.test(input) ? input : template
    if (key === 'activeMode') return MODES.includes(input) ? input : template
    if (key === 'passphraseHash') return typeof input === 'string' && /^[0-9a-f]{64}$/.test(input) ? input : template
    return cleanStr(input, template)
  }
  if (typeof template === 'boolean') return typeof input === 'boolean' ? input : template
  if (typeof template === 'number') {
    return Number.isFinite(input) ? Math.min(50, Math.max(1, Math.round(input))) : template
  }
  if (Array.isArray(template)) {
    if (!Array.isArray(input)) return template
    if (typeof template[0] === 'string' || template.length === 0) {
      const list = input.map((s) => cleanStr(s, '')).filter(Boolean).slice(0, 40)
      return list.length ? list : template
    }
    const [min, max] = LIST_LIMITS[key] || [1, 10]
    const items = input.filter(isObj).slice(0, max).map((item, i) => walk(item, template[i] || template[0], null))
    if (items.length < min) return template
    // ids must be unique for React keys / selections
    const seen = new Set()
    items.forEach((it, i) => {
      if ('id' in it) {
        if (seen.has(it.id)) it.id = `${it.id}-${i}`.slice(0, 24)
        seen.add(it.id)
      }
    })
    return items
  }
  if (isObj(template)) {
    const src = isObj(input) ? input : {}
    const out = {}
    for (const k of Object.keys(template)) {
      if (k === 'defaultTheme') out[k] = isObj(src[k]) ? src[k] : template[k] // themes are validated in themes.js
      else if (k === 'overrides') out[k] = isObj(src[k]) ? src[k] : {}
      else out[k] = walk(src[k], template[k], k)
    }
    return out
  }
  return template
}

export function sanitizeConfig(input) {
  return walk(input, DEFAULT_CONFIG, null)
}

/** Replace {name}/{count} tokens. Output is rendered as text, never HTML. */
export function fill(str, vars = {}) {
  return String(str ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}
