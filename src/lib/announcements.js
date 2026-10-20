// Announcement rules. Everything coming from the database, the config file or the
// admin form goes through sanitizeAnnouncement(), and is only ever rendered as text.

export const CATEGORIES = {
  important: { label: 'important', blurb: 'pulses red. use sparingly.' },
  event: { label: 'event', blurb: 'something happening. add a date for a countdown.' },
  fun: { label: 'fun', blurb: 'memes, news nobody asked for, chaos.' },
  info: { label: 'info', blurb: 'general updates.' },
}
export const CATEGORY_IDS = Object.keys(CATEGORIES)
export const PHOTO_IDS = ['none', 'neon-red', 'neon-teal', 'too-late', 'eclipse', 'balcony']

const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').slice(0, max) : '')
const isoOrNull = (v) => {
  if (!v) return null
  const t = Date.parse(v)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}
export function safeUrl(v) {
  const s = clean(v, 500).trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : ''
  } catch {
    return ''
  }
}

export function sanitizeAnnouncement(a, i = 0) {
  if (!a || typeof a !== 'object') return null
  const title = clean(a.title, 140).trim()
  if (!title) return null
  return {
    id: typeof a.id === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(a.id) ? a.id : `local-${i}`,
    title,
    body: clean(a.body, 4000).trim(),
    category: CATEGORY_IDS.includes(a.category) ? a.category : 'info',
    pinned: a.pinned === true,
    published: a.published !== false,
    eventAt: isoOrNull(a.eventAt),
    expiresAt: isoOrNull(a.expiresAt),
    order: Number.isFinite(a.order) ? Math.round(a.order) : i,
    image: PHOTO_IDS.includes(a.image) ? a.image : 'none',
    linkUrl: safeUrl(a.linkUrl),
    linkLabel: clean(a.linkLabel, 60).trim(),
    createdAt: isoOrNull(a.createdAt),
  }
}

export function sanitizeAnnouncements(list) {
  if (!Array.isArray(list)) return []
  return list.slice(0, 80).map(sanitizeAnnouncement).filter(Boolean)
}

export const isExpired = (a, now = Date.now()) => !!a.expiresAt && Date.parse(a.expiresAt) <= now

/** pinned first, then manual order, then newest. Visitors never see drafts or expired posts. */
export function visibleAnnouncements(list, { now = Date.now(), isAdmin = false } = {}) {
  return list
    .filter((a) => isAdmin || (a.published && !isExpired(a, now)))
    .sort((a, b) => (b.pinned - a.pinned) || (a.order - b.order) || (Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0)))
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return ''
  const s = Math.round((now - Date.parse(iso)) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return d === 1 ? 'yesterday' : `${d} days ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function countdownParts(iso, now = Date.now()) {
  let ms = Date.parse(iso) - now
  if (ms <= 0) return { done: true }
  const days = Math.floor(ms / 86400000)
  ms -= days * 86400000
  const hours = Math.floor(ms / 3600000)
  ms -= hours * 3600000
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms - mins * 60000) / 1000)
  return { done: false, days, hours, mins, secs }
}

// <input type="datetime-local"> works in local time without a zone
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export const fromLocalInput = (s) => (s ? new Date(s).toISOString() : null)
