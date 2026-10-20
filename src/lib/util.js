// Small helpers: safe storage, randomness, share-link encoding, file download.
import { sanitizeTheme, themeDiff, themeFrom, PRESET_IDS } from '../config/themes.js'
import { parseHash, routeHash } from './router.js'

export const KEYS = {
  theme: 'aci.theme.v1', // this browser's chosen theme (+ '.<page>' per page; the bare key is the old single-page one)
  saved: 'aci.savedThemes.v1', // named themes saved in this browser
  draft: 'aci.adminDraft.v1', // creator's unpublished content draft (admin only)
  admin: 'aci.admin.v1', // admin unlock token
  visits: 'aci.visits.v1',
  previewAsVisitor: 'aci.previewVisitor.v1',
  liveCache: 'aci.liveContent.v1', // last words fetched from the live backend (instant next load)
  annCache: 'aci.announcements.v1', // last announcements fetched from the live backend
}

export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
  },
}

/** Cryptographically random integer in [0, n). */
export function randInt(n) {
  if (n <= 1) return 0
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / n) * n // avoid modulo bias
  do crypto.getRandomValues(buf); while (buf[0] >= limit)
  return buf[0] % n
}

/** Pick an index from list, avoiding `lastIndex` when there's an alternative. */
export function pickIndex(length, lastIndex) {
  if (length <= 1) return 0
  let i = randInt(length - 1)
  if (lastIndex != null && i >= lastIndex) i += 1
  return i
}

/** Remembers the last pick per key so the same line never repeats twice in a row. */
export function makePicker() {
  const last = new Map()
  return (key, list) => {
    if (!list?.length) return ''
    const i = pickIndex(list.length, last.get(key))
    last.set(key, i)
    return list[i]
  }
}

// ---- share links (theme only; content and mode are never read from the URL) ----
const MAX_URL_PAYLOAD = 1800

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlDecode(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function encodeThemeForUrl(theme, page) {
  const payload = b64urlEncode(JSON.stringify({ p: theme.preset, d: themeDiff(theme) }))
  if (payload.length > MAX_URL_PAYLOAD) return { ok: false, reason: 'too-long', length: payload.length }
  const url = new URL(window.location.href)
  url.hash = page ? `/${page}&theme=${payload}` : `theme=${payload}`
  url.search = ''
  return { ok: true, url: url.toString(), length: payload.length }
}

/** Reads #theme=... from the current URL. Returns a sanitized theme, or null. */
export function readThemeFromUrl() {
  const m = /(?:^#|&)theme=([A-Za-z0-9_-]{1,4000})/.exec(window.location.hash)
  if (!m) return null
  try {
    const data = JSON.parse(b64urlDecode(m[1]))
    if (!data || typeof data !== 'object') return null
    const preset = PRESET_IDS.includes(data.p) ? data.p : 'scrapbook'
    return themeFrom(preset, data.d)
  } catch {
    return 'invalid'
  }
}

/** Drops one-off bits of the hash (#admin, #theme=…, login tokens) but keeps the page route. */
export function clearUrlHash() {
  const { page, step } = parseHash()
  history.replaceState(null, '', window.location.pathname + window.location.search + (page ? routeHash(page, step) : ''))
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file chosen'))
    if (file.size > 200_000) return reject(new Error('That file is too big to be a theme (max 200 KB).'))
    const r = new FileReader()
    r.onload = () => {
      try { resolve(JSON.parse(String(r.result))) } catch { reject(new Error("That file isn't valid JSON.")) }
    }
    r.onerror = () => reject(new Error("Couldn't read that file."))
    r.readAsText(file)
  })
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export { sanitizeTheme }
