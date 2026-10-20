// End-to-end smoke test. Builds a copy of the site with the live backend switched
// off (so it never touches the real Supabase project), serves it, clicks through everything.
// Usage: npm test   (tests/live.mjs then covers the live backend against a fake Supabase)
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CONFIG = JSON.parse(readFileSync('src/config/site-config.json', 'utf8'))
if (!process.env.BASE_URL) {
  process.env.VITE_BACKEND = 'off'
  await build({ logLevel: 'silent', build: { outDir: 'dist-test', emptyOutDir: true } })
  delete process.env.VITE_BACKEND
}
const server = process.env.BASE_URL ? null : await preview({ build: { outDir: 'dist-test' }, preview: { port: 4321, strictPort: true }, logLevel: 'silent' })
const BASE = process.env.BASE_URL || 'http://localhost:4321/'
const browser = await chromium.launch()
let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
  if (!cond) failures++
}
const newPage = async (opts = {}, init) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  if (init) await ctx.addInitScript(init)
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()))
  return page
}
const cssVar = (page, v) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), v)
// measured once one-off animations (step slide-ins, the portal) have finished
const noOverflow = (page) =>
  page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {})))
    return document.documentElement.scrollWidth <= innerWidth
  })
const nextStep = async (page, heading) => {
  await page.click('.flow-next')
  await page.waitForSelector(heading, { state: 'visible', timeout: 5000 }).catch(() => {})
}
const visible = '.flow-step:not([hidden])'
const settle = (page) => page.waitForTimeout(1100) // portal page transition

try {
  // ---------- check-in page (home) ----------
  let page = await newPage()
  await page.goto(BASE)
  ok((await page.textContent('#greeting')).includes('heyyy'), 'home opens the check-in page with the first-visit greeting')
  ok(await noOverflow(page), 'no horizontal overflow on phone')
  const navLabels = await page.$$eval('.nav-tab', (els) => els.map((e) => e.textContent.trim()))
  ok(navLabels.length === 3 && navLabels.includes('announcements'), `nav shows the current page + public pages (${navLabels.join(', ')})`)
  ok((await page.getAttribute('.nav-tab.is-active', 'aria-current')) === 'page', 'current page marked in the nav')
  ok((await page.$$('.stepper li')).length === 5, 'stepper shows five steps')

  // keyboard: tab to the start button and press Enter
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.classList.contains('btn-big'))) break
  }
  ok(await page.evaluate(() => document.activeElement?.classList.contains('btn-big')), 'start button reachable by keyboard')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  ok((await page.evaluate(() => location.hash)) === '#/checkin/mood', 'start goes to the mood step (in the URL)')
  ok(await page.evaluate(() => document.activeElement?.id === 'checkin-h'), 'focus moves to the step heading')
  ok(!(await page.isVisible('.welcome')), 'previous step is hidden (one step at a time)')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  ok((await page.getAttribute('.mood-card:nth-child(2)', 'aria-checked')) === 'true', 'mood selectable with arrow keys + Enter')

  const moods = await page.$$('.mood-card')
  for (let i = 0; i < moods.length; i++) {
    await page.click(`.mood-card:nth-child(${i + 1})`)
    const sel = await page.$$eval('.mood-card[aria-checked="true"]', (els) => els.length)
    const text = await page.textContent('.checkin .response-card')
    ok(sel === 1 && text.length > 20, `mood ${i + 1} → selected + response`)
  }
  ok(await page.isVisible('.speech-helper'), 'blue helper pops up with a line')
  const first = await page.textContent('.checkin .response-body p')
  await page.click('text=say something else')
  const second = await page.textContent('.checkin .response-body p')
  ok(first !== second, 'responses don’t repeat back-to-back')
  await page.click('.mood-card:nth-child(4)')
  ok((await page.textContent('.checkin .response-card')).includes('picked that'), 'repeat-pick easter egg after 3 picks')
  await page.click('text=change my answer')
  ok((await page.$$('.mood-card[aria-checked="true"]')).length === 0, 'change answer clears selection')
  await page.click('.mood-card:nth-child(1)')

  await nextStep(page, '#tomorrow-h')
  ok((await page.evaluate(() => location.hash)) === '#/checkin/tomorrow' && (await page.isVisible('#tomorrow-h')), 'next button → tomorrow step')
  for (let i = 1; i <= 4; i++) {
    await page.click(`.choice:nth-child(${i})`)
    ok((await page.$$('.choice[aria-pressed="true"]')).length === 1 && (await page.isVisible('.tomorrow .response-card')), `tomorrow option ${i} → reaction`)
  }
  ok((await page.textContent('.closing')).includes('Austine'), 'closing message appears')

  await nextStep(page, '#extras-h')
  for (const b of await page.$$('.btn-sticker')) {
    await b.click()
    ok((await page.textContent('.extras-line')).length > 5, `extras button “${(await b.textContent()).trim()}” works`)
  }

  await nextStep(page, '#rps-h')
  ok(await page.isVisible('#rps-h'), 'next button → game step')
  const beats = { '✊': '✌️', '✋': '✊', '✌️': '✋' }
  let mismatches = 0
  for (let i = 0; i < 30; i++) {
    await page.click(`.rps-move:nth-child(${(i % 3) + 1})`)
    const you = await page.textContent('.hand-you')
    const me = await page.textContent('.hand-me')
    const verdict = await page.textContent('.verdict-pill')
    const expected = you === me ? 'draw' : beats[you] === me ? 'you win' : 'i win'
    if (verdict.trim().toLowerCase() !== expected) mismatches++
  }
  ok(mismatches === 0, 'rps verdict correct for 30 random rounds')
  const totals = await page.$$eval('.scoreboard b', (bs) => bs.reduce((s, b) => s + Number(b.textContent), 0))
  ok(totals === 30, 'scoreboard counts every round')
  await page.click('.rps .toggle')
  ok((await page.$$eval('.scoreboard b', (bs) => bs.map((b) => b.textContent).join())) === '0,0,0', 'best-of-three resets score')
  for (let i = 0; i < 40 && !(await page.isVisible('.rps-match')); i++) await page.click('.rps-move:nth-child(1)')
  ok(await page.isVisible('.rps-match'), 'best-of-three ends with a match result')
  ok(await page.isDisabled('.rps-move:nth-child(1)'), 'moves locked after match')
  await page.click('text=play again')
  ok(!(await page.isDisabled('.rps-move:nth-child(1)')), 'play again re-enables the game')

  await page.goBack()
  await page.waitForTimeout(300)
  ok((await page.evaluate(() => location.hash)) === '#/checkin/extras' && (await page.isVisible('#extras-h')), 'browser back goes to the previous step')
  await page.click('.stepper li:nth-child(2) a')
  await page.waitForTimeout(300)
  ok((await page.$$('.mood-card[aria-checked="true"]')).length === 1, 'answers are kept when going back to a step')
  await page.click('.stepper li:nth-child(1) a')
  await page.waitForTimeout(300)

  // ---------- easter eggs ----------
  for (let i = 0; i < 5; i++) await page.click('.site-title')
  ok(await page.isVisible('.secret-note'), 'title ×5 reveals secret')
  await page.click('.secret-note .link-btn')
  await page.click('.polaroid')
  ok((await page.getAttribute('.polaroid', 'aria-pressed')) === 'true', 'polaroid flips')
  await page.click('.sticker-heart')
  ok(await page.isVisible('.sticker-heart .speech'), 'heart sticker talks back')
  await page.click('.sticker-pickle')
  ok(await page.isVisible('.sticker-pickle .speech'), 'hidden pickle talks back')
  await page.click('.compliment-btn')
  ok((await page.textContent('.compliment')).length > 5, 'random compliment')
  ok(page.errors.length === 0, `no console errors (check-in) ${page.errors.join(' | ')}`)

  // ---------- page switching ----------
  await page.click('.nav-tab:has-text("friends")')
  await page.waitForTimeout(150)
  ok(await page.isVisible('.portal-warp.is-on'), 'switching page opens the portal transition')
  await settle(page)
  ok((await page.evaluate(() => location.hash)) === '#/friends' && (await page.textContent('#greeting')).includes('oi'), 'friends page shows friend words')
  ok((await cssVar(page, '--bg')) === '#EEE6D3', 'friends page has its own look (lab notebook)')
  ok(!(await page.isVisible('.nav-tab:has-text("check-in")')), 'private check-in page is not in the friends menu')
  await page.click('.welcome .btn-big')
  await page.waitForTimeout(400)
  ok((await page.textContent('#checkin-h')).includes('Status report'), 'friends flow uses friend questions')
  await page.click('.nav-tab:has-text("announcements")')
  await settle(page)
  ok((await cssVar(page, '--bg')) === '#0B0A0C', 'announcements page is dark neon')
  ok((await page.textContent('#ann-h')).includes(CONFIG.pages.announcements.heading), 'announcements heading')
  ok((await page.$$('.ann-card')).length === CONFIG.announcements.length, 'all seed announcements shown')
  ok((await page.$$('.ann-card.is-featured')).length === 1, 'pinned announcement featured')
  await page.click('.ann-filter:has-text("fun")')
  ok((await page.$$('.ann-card')).length === 1, 'category filter works')
  ok(!(await page.isVisible('.btn-studio')), 'visitors get no theme studio on announcements')
  ok(await noOverflow(page), 'no horizontal overflow on announcements (phone)')
  ok(page.errors.length === 0, `no console errors (navigation) ${page.errors.join(' | ')}`)

  // ---------- theme studio (per page) ----------
  page = await newPage()
  await page.goto(BASE + '#/checkin')
  await page.click('.btn-studio')
  ok(await page.isVisible('.studio.is-open'), 'studio opens')
  ok(await noOverflow(page), 'no overflow with studio open')
  await page.click('.preset:has-text("Midnight")')
  ok((await cssVar(page, '--bg')) === '#17131F', 'preset changes page live')
  await page.click('.tab:has-text("colours")')
  await page.fill('#ctl-colors-accent-hex', '#11AA55')
  ok((await cssVar(page, '--accent')) === '#11AA55', 'colour field updates page live')
  await page.click('.tab:has-text("layout")')
  await page.click('#ctl-layout-density button:has-text("compact")')
  ok((await cssVar(page, '--pad')) === '0.72', 'layout density applies')
  await page.click('.tab:has-text("decor")')
  await page.click('#ctl-deco-stickers .toggle')
  ok(!(await page.isVisible('.sticker-heart')), 'decor toggle hides stickers')
  await page.click('button[aria-label="undo last change"]')
  ok(await page.isVisible('.sticker-heart'), 'undo restores previous state')
  await page.waitForTimeout(500)
  await page.reload()
  ok((await cssVar(page, '--bg')) === '#17131F' && (await cssVar(page, '--accent')) === '#11AA55', 'theme persists after refresh')
  ok((await page.textContent('#greeting')) !== 'heyyy, you.', 'greeting changes on revisit')
  await page.goto(BASE + '#/friends')
  await settle(page)
  ok((await cssVar(page, '--bg')) === '#EEE6D3', 'a look picked on one page doesn’t leak onto another')
  await page.goto(BASE + '#/checkin')
  await settle(page)

  // save / load named theme
  await page.click('.btn-studio')
  await page.click('.tab:has-text("save")')
  await page.fill('#save-name', 'night owl')
  await page.click('.save-row button')
  ok(await page.isVisible('.saved-list li:has-text("night owl")'), 'named theme saved')
  await page.click('.studio-foot button:has-text("reset to default")')
  ok((await cssVar(page, '--bg')) === '#F5E8DA', 'reset returns to default')
  await page.click('.saved-list li:has-text("night owl") button:has-text("load")')
  ok((await cssVar(page, '--bg')) === '#17131F', 'saved theme loads')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=download theme file')])
  ok(dl.suggestedFilename().endsWith('.json'), 'theme exports as JSON')

  // import malformed + hostile
  const dir = mkdtempSync(join(tmpdir(), 'aci-'))
  const bad = join(dir, 'bad.json')
  writeFileSync(bad, '{ not json')
  await page.setInputFiles('.file-btn input', bad)
  await page.waitForSelector('[role="alert"]', { timeout: 5000 }).catch(() => {})
  ok((await page.isVisible('[role="alert"]')) && (await cssVar(page, '--bg')) === '#17131F', 'malformed import rejected, theme unchanged')
  const hostile = join(dir, 'hostile.json')
  writeFileSync(hostile, JSON.stringify({ preset: 'chaos', colors: { bg: 'red;} body{display:none', text: '#000000' }, type: { heading: '<script>', baseSize: 9999 } }))
  await page.setInputFiles('.file-btn input', hostile)
  await page.waitForTimeout(200)
  ok((await cssVar(page, '--bg')) === '#FFF27A' && (await cssVar(page, '--text')) === '#000000' && (await cssVar(page, '--base-size')) === '21px', 'hostile import sanitised (bad values → preset defaults, numbers clamped)')

  // share link
  await page.click('.tab:has-text("save")')
  await page.click('text=copy share link')
  const link = await page.inputValue('.link-box')
  ok(link.includes('#/checkin&theme=') && link.length < 1000, `share link keeps the page (${link.length} chars)`)
  ok(page.errors.length === 0, `no console errors (studio) ${page.errors.join(' | ')}`)

  const p2 = await newPage()
  await p2.goto(link.replace('#', '?mode=friend&activeMode=friend#'))
  ok((await cssVar(p2, '--bg')) === '#FFF27A', 'share link applies theme for a new visitor')
  ok(await p2.isVisible('.shared-banner'), 'shared-theme banner shown (not auto-saved)')
  ok((await p2.textContent('#greeting')).includes('heyyy'), 'URL params cannot change the words')
  await p2.click('.shared-banner >> text=no thanks')
  ok((await cssVar(p2, '--bg')) === '#F5E8DA', '“no thanks” returns to the creator default')
  ok((await p2.evaluate(() => location.hash)) === '#/checkin', '…and keeps you on the same page')
  await p2.goto(BASE + '#theme=!!!garbage')
  await p2.waitForTimeout(200)
  ok((await cssVar(p2, '--bg')) === '#F5E8DA' && p2.errors.length === 0, 'garbage theme link falls back safely')

  // ---------- admin (local passphrase mode, no backend configured) ----------
  const p3 = await newPage()
  await p3.goto(BASE + '#admin')
  ok(await p3.isVisible('#gate-h'), '#admin opens the passphrase prompt')
  await p3.fill('.modal input', 'wrong')
  await p3.click('text=unlock')
  ok(await p3.isVisible('.error'), 'wrong passphrase rejected')
  if (process.env.ADMIN_PASS) {
    await p3.fill('.modal input', process.env.ADMIN_PASS)
    await p3.click('text=unlock')
    ok(await p3.isVisible('.admin-bar'), 'correct passphrase unlocks admin')
  }

  // the rest of the admin checks use a pre-unlocked browser (no passphrase needed)
  const p4 = await newPage({}, `localStorage.setItem('aci.admin.v1', ${JSON.stringify(JSON.stringify(CONFIG.admin.passphraseHash))})`)
  await p4.goto(BASE)
  ok(await p4.isVisible('.admin-bar'), 'admin bar shown when unlocked')
  ok(await p4.isVisible('.nav-tab:has-text("check-in") .nav-flag'), 'admin sees hidden pages flagged in the menu')
  await p4.click('.admin-bar >> text=pages & words')
  await p4.fill('.ed-section[open] input >> nth=0', 'Austine checking in (test)')
  ok((await p4.textContent('.site-title')).includes('(test)'), 'content editor updates page live')
  await p4.click('#ed-nav-checkin .toggle')
  await p4.click('#ed-on-friends .toggle')
  ok((await p4.textContent('.nav-tab:has-text("friends") .nav-flag')) === 'off', 'turning a page off shows it flagged for the admin')
  await p4.click('#ed-home button:has-text("announcements")')
  await p4.click('.admin-bar >> text=announcements')
  await p4.click('.studio button:has-text("+ new announcement")')
  await p4.fill('.ann-editor input >> nth=0', 'test night at mine')
  await p4.fill('.ann-editor textarea', 'bring snacks.\nsecond line.')
  await p4.click('#ann-cat button:has-text("event")')
  await p4.fill('#ann-event', '2099-01-01T19:00')
  await p4.click('.photo-opt[title="teal neon “SKY”"]')
  ok(await p4.isVisible('.ann-preview .ann-countdown'), 'editor preview shows the countdown')
  await p4.click('.ann-editor .btn-primary')
  await p4.click('.studio button[aria-label="close the studio"]')
  await p4.click('.nav-tab:has-text("announcements")')
  await settle(p4)
  ok(await p4.isVisible('.ann-card:has-text("test night at mine") .ann-countdown'), 'new announcement shows on the board with a countdown')
  await p4.click('.ann-card:has-text("test night at mine") .ann-edit')
  await p4.click('#ann-pin .toggle')
  await p4.click('.ann-editor .btn-primary')
  ok((await p4.$$('.ann-card.is-featured')).length === 2, 'pinning from the card works')
  await p4.click('.tab:has-text("publish")')
  const [cfgDl] = await Promise.all([p4.waitForEvent('download'), p4.click('button:has-text("download site-config.json")')])
  const published = JSON.parse(readFileSync(await cfgDl.path(), 'utf8'))
  ok(cfgDl.suggestedFilename() === 'site-config.json' && published.announcements.some((a) => a.title === 'test night at mine'), 'published config includes the new announcement')
  ok(published.pages.friends.enabled === false && published.site.homePage === 'announcements' && published.pages.checkin.inNav === true, 'published config includes page settings')
  await p4.click('.admin-bar >> text=lock')
  ok((await p4.textContent('.site-title')).includes('Austine checking in') && !(await p4.textContent('.site-title')).includes('(test)'), 'locking returns to the published words')
  ok(p4.errors.length === 0, `no console errors (admin) ${p4.errors.join(' | ')}`)

  // ---------- reduced motion ----------
  const p5 = await newPage({ reducedMotion: 'reduce' })
  await p5.goto(BASE)
  ok((await p5.evaluate(() => document.documentElement.dataset.motion)) === 'reduced', 'OS reduced-motion respected')
  await p5.click('.nav-tab:has-text("friends")')
  await p5.waitForTimeout(100)
  ok(!(await p5.isVisible('.portal-warp.is-on')) && (await p5.textContent('#greeting')).includes('oi'), 'reduced motion: page switches instantly, no portal')

  // ---------- desktop layout ----------
  const p6 = await newPage({ viewport: { width: 1280, height: 900 } })
  for (const h of ['#/checkin', '#/friends', '#/announcements']) {
    await p6.goto(BASE + h)
    await p6.waitForTimeout(300)
    ok(await noOverflow(p6), `no overflow on desktop (${h})`)
  }
} catch (e) {
  console.error(e)
  failures++
} finally {
  await browser.close()
  if (server) await new Promise((r) => server.httpServer.close(r))
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
