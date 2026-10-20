// Live-backend test: builds the site pointed at a fake Supabase project, then
// answers its network calls in the browser (no real account needed). Checks the
// visitor reads, the offline fallback, magic-link login, and live publishing.
// Usage: npm test (runs after tests/smoke.mjs)
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const SB = 'https://fake-project.supabase.co'
process.env.VITE_SUPABASE_URL = SB
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-0123456789abcdef'
await build({ logLevel: 'silent', build: { outDir: 'dist-live', emptyOutDir: true } })
const server = await preview({ build: { outDir: 'dist-live' }, preview: { port: 4323, strictPort: true }, logLevel: 'silent' })
const BASE = 'http://localhost:4323/'

const CONFIG = JSON.parse(readFileSync('src/config/site-config.json', 'utf8'))
const browser = await chromium.launch()
let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} [live] ${msg}`)
  if (!cond) failures++
}

/** An in-memory stand-in for the Supabase REST + auth API. */
function fakeBackend({ admin = true, down = false } = {}) {
  const db = {
    content: { ...structuredClone(CONFIG), site: { ...CONFIG.site, title: 'LIVE TITLE' } },
    updatedAt: '2026-10-01T10:00:00Z',
    anns: [{ id: '11111111-1111-4111-8111-111111111111', title: 'from the database', body: 'hello from supabase', category: 'important', pinned: false, published: true, event_at: null, expires_at: null, sort_order: 0, image: 'none', link_url: null, link_label: null, created_at: '2026-10-19T10:00:00Z' }],
    calls: [],
  }
  const handler = async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const method = req.method()
    db.calls.push(`${method} ${url.pathname}`)
    if (down) return route.fulfill({ status: 503, body: 'down' })
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    const single = /vnd\.pgrst\.object/.test(req.headers().accept || '')
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
    if (url.pathname === '/auth/v1/user') return json({ id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'admin@test.dev', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' })
    if (url.pathname === '/auth/v1/otp') return json({})
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 })
    if (url.pathname === '/rest/v1/rpc/is_admin') return json(admin)
    if (url.pathname === '/rest/v1/site_content') {
      if (method === 'GET') return json([{ data: db.content, updated_at: db.updatedAt }])
      const body = JSON.parse(req.postData())
      db.content = body.data
      db.updatedAt = new Date().toISOString()
      return json(single ? { updated_at: db.updatedAt } : [{ updated_at: db.updatedAt }])
    }
    if (url.pathname === '/rest/v1/announcements') {
      if (method === 'GET') return json(db.anns)
      if (method === 'POST') {
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...JSON.parse(req.postData()) }
        db.anns.push(row)
        return json(single ? row : [row], 201)
      }
      const id = url.searchParams.get('id')?.replace('eq.', '')
      if (method === 'PATCH') {
        const row = db.anns.find((a) => a.id === id)
        Object.assign(row, JSON.parse(req.postData()))
        return json(single ? row : [row])
      }
      if (method === 'DELETE') {
        db.anns = db.anns.filter((a) => a.id !== id)
        return route.fulfill({ status: 204 })
      }
    }
    return json({ message: `unexpected ${method} ${url.pathname}` }, 404)
  }
  return { db, handler }
}

async function newPage(fake, opts = {}) {
  const ctx = opts.ctx || (await browser.newContext({ viewport: { width: 390, height: 844 } }))
  await ctx.route(`${SB}/**`, fake.handler)
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  return page
}

try {
  // ---------- visitor: words + announcements come from the database ----------
  const fake = fakeBackend()
  const p1 = await newPage(fake)
  await p1.goto(BASE)
  await p1.waitForSelector('.site-title:has-text("LIVE TITLE")', { timeout: 15000 }).catch(() => {})
  ok((await p1.textContent('.site-title')).includes('LIVE TITLE'), 'visitor sees the words from the database')
  await p1.click('.nav-tab:has-text("announcements")')
  await p1.waitForTimeout(1200)
  ok(await p1.isVisible('.ann-card:has-text("from the database")'), 'visitor sees announcements from the database')
  ok(!fake.db.calls.some((c) => c.includes('/auth/')), 'visitors never load the login machinery')
  ok(p1.errors.length === 0, `no page errors (visitor) ${p1.errors.join(' | ')}`)

  // same browser, backend down: last copy is used
  const ctx = p1.context()
  await ctx.unroute(`${SB}/**`)
  await ctx.route(`${SB}/**`, (r) => r.fulfill({ status: 503, body: 'down' }))
  await p1.reload()
  await p1.waitForTimeout(800)
  ok((await p1.textContent('.site-title')).includes('LIVE TITLE'), 'backend down: the last live words are kept')
  ok(await p1.isVisible('.ann-card:has-text("from the database")') && (await p1.isVisible('.ann-status')), 'backend down: last announcements shown with a notice')

  // brand-new visitor, backend down: bundled words
  const p2 = await newPage(fakeBackend({ down: true }))
  await p2.goto(BASE)
  await p2.waitForTimeout(1500)
  ok((await p2.textContent('.site-title')).includes(CONFIG.site.title), 'backend down + first visit: bundled words used')

  // ---------- admin: magic-link login ----------
  const f3 = fakeBackend()
  const p3 = await newPage(f3)
  await p3.goto(BASE + '#admin')
  ok((await p3.getAttribute('.modal input', 'type')) === 'email', 'live mode asks for an email, not a passphrase')
  await p3.fill('.modal input', 'admin@test.dev')
  await p3.click('text=send login link')
  await p3.waitForSelector('.modal:has-text("for a login link")', { timeout: 5000 }).catch(() => {})
  ok(f3.db.calls.includes('POST /auth/v1/otp') && (await p3.textContent('.modal')).includes('admin@test.dev'), 'login link requested')

  // the email link opens as a fresh page load
  await p3.goto('about:blank')
  await p3.goto(BASE + '#access_token=fake-token&expires_in=3600&refresh_token=fake-refresh&token_type=bearer&type=magiclink')
  await p3.waitForSelector('.admin-bar', { timeout: 8000 }).catch(() => {})
  ok(await p3.isVisible('.admin-bar'), 'opening the login link turns admin mode on')
  ok((await p3.textContent('.admin-bar')).includes('admin@test.dev'), 'admin bar shows who is logged in')
  ok(!(await p3.evaluate(() => location.hash)).includes('access_token'), 'login token removed from the address bar')

  // write an announcement → goes straight to the database
  await p3.click('.admin-bar >> text=announcements')
  await p3.click('.studio button:has-text("+ new announcement")')
  await p3.fill('.ann-editor input >> nth=0', 'posted live')
  await p3.fill('.ann-editor textarea', 'straight to the database')
  await p3.click('.ann-editor .btn-primary')
  await p3.waitForTimeout(600)
  ok(f3.db.anns.some((a) => a.title === 'posted live'), 'saving an announcement writes it to the database')

  // edit words → publish live
  await p3.click('.tab:has-text("pages & words")')
  await p3.fill('.ed-section[open] input >> nth=0', 'PUBLISHED LIVE')
  await p3.click('.tab:has-text("publish")')
  await p3.click('button:has-text("publish now")')
  await p3.waitForTimeout(600)
  ok(f3.db.content.site.title === 'PUBLISHED LIVE', 'publish now writes the words to the database')
  ok(p3.errors.length === 0, `no page errors (admin) ${p3.errors.join(' | ')}`)

  const p4 = await newPage(f3)
  await p4.goto(BASE + '#/announcements')
  await p4.waitForTimeout(1500)
  ok((await p4.textContent('.site-title')).includes('PUBLISHED LIVE') && (await p4.isVisible('.ann-card:has-text("posted live")')), 'a new visitor sees the published words and the new post')

  await p3.click('.admin-bar >> text=log out')
  await p3.waitForTimeout(300)
  ok(!(await p3.isVisible('.admin-bar')), 'log out ends admin mode')

  // ---------- someone logs in who isn't on the admin list ----------
  const p5 = await newPage(fakeBackend({ admin: false }))
  await p5.goto(BASE + '#access_token=fake-token&expires_in=3600&refresh_token=fake-refresh&token_type=bearer&type=magiclink')
  await p5.waitForTimeout(2000)
  ok(!(await p5.isVisible('.admin-bar')) && (await p5.textContent('.toasts')).includes("isn't on the admin list"), 'a non-admin login gets no admin powers')
} catch (e) {
  console.error(e)
  failures++
} finally {
  await browser.close()
  await new Promise((r) => server.httpServer.close(r))
}
console.log(failures ? `\n${failures} live check(s) failed` : '\nall live checks passed')
process.exit(failures ? 1 : 0)
