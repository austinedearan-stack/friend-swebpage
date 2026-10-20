// Live backend (Supabase). Optional: with no URL/key in src/config/backend.json the
// site runs exactly as before from the bundled site-config.json.
//
// Visitors only ever read, through plain REST calls (no extra library download).
// The Supabase client library is loaded on demand for the admin: login, publishing
// words, and writing announcements. Database rules (RLS, see supabase/schema.sql)
// decide who may write; nothing here is trusted for that.
import BACKEND from '../config/backend.json'
import { sanitizeAnnouncement } from './announcements.js'

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || BACKEND.supabaseUrl || '').trim().replace(/\/+$/, '')
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || BACKEND.supabaseAnonKey || '').trim()
const AUTH_STORAGE_KEY = 'aci.auth'

// VITE_BACKEND=off builds a copy without the backend (the tests use it)
export const backendEnabled = import.meta.env.VITE_BACKEND !== 'off' && /^https:\/\/[^\s/]+$/.test(URL_BASE) && ANON_KEY.length > 20

let clientPromise = null
function client() {
  if (!backendEnabled) return Promise.reject(new Error('backend not configured'))
  clientPromise ||= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_BASE, ANON_KEY, {
      // implicit flow: the login link works even if it opens in a different browser
      // (e.g. the mail app's built-in one), which the stricter PKCE flow can't do
      auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: AUTH_STORAGE_KEY },
    }),
  )
  return clientPromise
}

/** Returning from a login link, or a saved login in this browser. Only then is the client library loaded. */
export function mightHaveSession() {
  if (!backendEnabled) return false
  if (/(?:^#|&)(access_token|error_description)=/.test(window.location.hash)) return true
  try {
    return !!localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return false
  }
}

async function rest(path) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000) // generous: slow mobile connections
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`backend said ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

const must = ({ data, error }) => {
  if (error) throw new Error(error.message || 'backend error')
  return data
}

// ---------- site words ----------

export async function fetchSiteContent() {
  const rows = await rest('site_content?id=eq.main&select=data,updated_at')
  return rows[0] ? { data: rows[0].data, updatedAt: rows[0].updated_at } : null
}

export async function publishSiteContent(cfg) {
  const sb = await client()
  const row = must(await sb.from('site_content').upsert({ id: 'main', data: cfg, updated_at: new Date().toISOString() }).select('updated_at').single())
  return row.updated_at
}

// ---------- announcements ----------

const fromRow = (r) =>
  sanitizeAnnouncement({
    id: r.id, title: r.title, body: r.body, category: r.category, pinned: r.pinned, published: r.published,
    eventAt: r.event_at, expiresAt: r.expires_at, order: r.sort_order, image: r.image,
    linkUrl: r.link_url, linkLabel: r.link_label, createdAt: r.created_at,
  })
const toRow = (a) => ({
  title: a.title, body: a.body, category: a.category, pinned: a.pinned, published: a.published,
  event_at: a.eventAt, expires_at: a.expiresAt, sort_order: a.order, image: a.image,
  link_url: a.linkUrl || null, link_label: a.linkLabel || null,
})

/** Visitors: the database only returns published, unexpired posts to them. */
export async function fetchAnnouncementsPublic() {
  const rows = await rest('announcements?select=*&order=pinned.desc,sort_order.asc,created_at.desc&limit=100')
  return rows.map(fromRow).filter(Boolean)
}

/** Admin: everything, including drafts and expired posts. */
export async function fetchAnnouncementsAdmin() {
  const sb = await client()
  const rows = must(await sb.from('announcements').select('*').order('pinned', { ascending: false }).order('sort_order').order('created_at', { ascending: false }).limit(100))
  return rows.map(fromRow).filter(Boolean)
}

export async function saveAnnouncement(a) {
  const sb = await client()
  const isNew = !a.id || a.id.startsWith('local-') || a.id.startsWith('new-')
  const q = isNew
    ? sb.from('announcements').insert(toRow(a))
    : sb.from('announcements').update({ ...toRow(a), updated_at: new Date().toISOString() }).eq('id', a.id)
  return fromRow(must(await q.select().single()))
}

export async function deleteAnnouncement(id) {
  const sb = await client()
  must(await sb.from('announcements').delete().eq('id', id))
}

export async function setAnnouncementOrder(items) {
  const sb = await client()
  for (const { id, order } of items) must(await sb.from('announcements').update({ sort_order: order }).eq('id', id))
}

// ---------- admin login (magic link) ----------

export async function sendMagicLink(email) {
  const sb = await client()
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin + window.location.pathname },
  })
  if (!error) return
  if (/signups? not allowed|not found/i.test(error.message)) throw new Error("that email isn't set up as an admin.")
  if (/rate limit|too many|seconds/i.test(error.message)) throw new Error('too many login emails. wait a minute and try again.')
  throw new Error(error.message)
}

export async function currentSession() {
  const sb = await client()
  return must(await sb.auth.getSession()).session
}

export async function onAuthChange(cb) {
  const sb = await client()
  // supabase asks that the callback doesn't await other supabase calls directly
  const { data } = sb.auth.onAuthStateChange((event, session) => setTimeout(() => cb(event, session), 0))
  return () => data.subscription.unsubscribe()
}

export async function checkIsAdmin() {
  const sb = await client()
  return must(await sb.rpc('is_admin')) === true
}

export async function signOut() {
  const sb = await client()
  await sb.auth.signOut()
}
