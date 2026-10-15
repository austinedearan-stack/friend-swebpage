// End-to-end smoke test: builds nothing, serves ./dist, clicks through everything.
// Usage: npm run build && npm test
import { preview } from 'vite'
import { chromium } from 'playwright'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const server = await preview({ preview: { port: 4321, strictPort: true }, logLevel: 'silent' })
const BASE = 'http://localhost:4321/'
const browser = await chromium.launch()
let failures = 0
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
  if (!cond) failures++
}
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts })
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && page.errors.push(m.text()))
  return page
}
const cssVar = (page, v) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), v)

try {
  // ---------- main flow ----------
  let page = await newPage()
  await page.goto(BASE)
  ok((await page.textContent('#greeting')).includes('heyyy'), 'first-visit greeting shown')
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow on phone')

  // keyboard: tab to the start button and press Enter
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    if ((await page.evaluate(() => document.activeElement?.textContent)).includes('start the check-in')) break
  }
  ok((await page.evaluate(() => document.activeElement?.textContent)).includes('start the check-in'), 'start button reachable by keyboard')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(600)
  ok(await page.evaluate(() => document.activeElement?.classList.contains('mood-card')), 'start moves focus to the first mood')
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
  const first = await page.textContent('.checkin .response-body p')
  await page.click('text=say something else')
  const second = await page.textContent('.checkin .response-body p')
  ok(first !== second, 'responses don’t repeat back-to-back')
  await page.click('.mood-card:nth-child(4)')
  ok((await page.textContent('.checkin .response-card')).includes('picked that'), 'repeat-pick easter egg after 3 picks')
  await page.click('text=change my answer')
  ok((await page.$$('.mood-card[aria-checked="true"]')).length === 0, 'change answer clears selection')

  for (let i = 1; i <= 4; i++) {
    await page.click(`.choice:nth-child(${i})`)
    ok((await page.$$('.choice[aria-pressed="true"]')).length === 1 && (await page.isVisible('.tomorrow .response-card')), `tomorrow option ${i} → reaction`)
  }
  ok((await page.textContent('.closing')).includes('Austine'), 'closing message appears')

  for (const b of await page.$$('.btn-sticker')) {
    await b.click()
    ok((await page.textContent('.extras-line')).length > 5, `extras button “${(await b.textContent()).trim()}” works`)
  }

  // ---------- rock paper scissors ----------
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

  // ---------- easter eggs ----------
  for (let i = 0; i < 5; i++) await page.click('.site-title')
  ok(await page.isVisible('.secret-note'), 'title ×5 reveals secret')
  await page.click('.polaroid')
  ok((await page.getAttribute('.polaroid', 'aria-pressed')) === 'true', 'polaroid flips')
  await page.click('.sticker')
  ok(await page.isVisible('.speech'), 'sticker talks back')
  await page.click('.compliment-btn')
  ok((await page.textContent('.compliment')).length > 5, 'random compliment')

  // ---------- theme studio ----------
  await page.click('.btn-studio')
  ok(await page.isVisible('.studio.is-open'), 'studio opens')
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow with studio open')
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
  ok(!(await page.isVisible('.sticker')), 'decor toggle hides stickers')
  await page.click('button[aria-label="undo last change"]')
  ok(await page.isVisible('.sticker'), 'undo restores previous state')
  await page.waitForTimeout(500)
  await page.reload()
  ok((await cssVar(page, '--bg')) === '#17131F' && (await cssVar(page, '--accent')) === '#11AA55', 'theme persists after refresh')
  ok((await page.textContent('#greeting')) !== 'heyyy, you.', 'greeting changes on revisit')

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

  // export
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
  writeFileSync(hostile, JSON.stringify({ preset: 'chaos', colors: { bg: 'red;} body{display:none', text: '#000000' }, type: { heading: '<script>' , baseSize: 9999 } }))
  await page.setInputFiles('.file-btn input', hostile)
  await page.waitForTimeout(200)
  ok((await cssVar(page, '--bg')) === '#FFF27A' && (await cssVar(page, '--text')) === '#000000' && (await cssVar(page, '--base-size')) === '21px', 'hostile import sanitised (bad values → preset defaults, numbers clamped)')

  // share link
  await page.click('.tab:has-text("save")')
  await page.click('text=copy share link')
  const link = await page.inputValue('.link-box')
  ok(link.includes('#theme=') && link.length < 1000, `share link generated (${link.length} chars)`)
  ok(page.errors.length === 0, `no console errors (main) ${page.errors.join(' | ')}`)

  // a fresh visitor opening the link — plus attempts to change mode via URL
  const p2 = await newPage()
  await p2.goto(link.replace('#', '?mode=friend&activeMode=friend#'))
  ok((await cssVar(p2, '--bg')) === '#FFF27A', 'share link applies theme for a new visitor')
  ok(await p2.isVisible('.shared-banner'), 'shared-theme banner shown (not auto-saved)')
  ok((await p2.textContent('#greeting')).includes('heyyy'), 'URL params cannot switch to friend mode')
  await p2.click('.shared-banner >> text=no thanks')
  ok((await cssVar(p2, '--bg')) === '#F5E8DA', '“no thanks” returns to the creator default')
  await p2.goto(BASE + '#theme=!!!garbage')
  await p2.waitForTimeout(200)
  ok((await cssVar(p2, '--bg')) === '#F5E8DA' && p2.errors.length === 0, 'garbage theme link falls back safely')

  // ---------- admin ----------
  const p3 = await newPage()
  await p3.goto(BASE + '#admin')
  ok(await p3.isVisible('#gate-h'), '#admin opens the passphrase prompt')
  await p3.fill('.modal input', 'wrong')
  await p3.click('text=unlock')
  ok(await p3.isVisible('.error'), 'wrong passphrase rejected')
  await p3.fill('.modal input', process.env.ADMIN_PASS || '')
  await p3.click('text=unlock')
  await p3.waitForSelector('.admin-bar')
  ok(true, 'correct passphrase unlocks admin')
  await p3.selectOption('.admin-mode select', 'friend')
  ok((await p3.textContent('#checkin-h')).includes('Status report'), 'admin switches to friend mode live')
  ok((await p3.textContent('#extras-h')).includes('Roasting'), 'friend mode shows roasting department')
  await p3.click('.tab:has-text("words")')
  await p3.fill('.ed-section[open] input >> nth=0', 'Austine checking in (test)')
  ok((await p3.textContent('.site-title')).includes('(test)'), 'content editor updates page live')
  await p3.click('.tab:has-text("publish")')
  const [cfg] = await Promise.all([p3.waitForEvent('download'), p3.click('button:has-text("download site-config.json")')])
  ok(cfg.suggestedFilename() === 'site-config.json', 'site config exports')
  await p3.click('.admin-bar >> text=lock')
  ok((await p3.textContent('#checkin-h')).includes('How are we'), 'locking returns to the published personal mode')
  ok(p3.errors.length === 0, `no console errors (admin) ${p3.errors.join(' | ')}`)

  // ---------- reduced motion ----------
  const p4 = await newPage({ reducedMotion: 'reduce' })
  await p4.goto(BASE)
  ok((await p4.evaluate(() => document.documentElement.dataset.motion)) === 'reduced', 'OS reduced-motion respected')

  // ---------- desktop layout ----------
  const p5 = await newPage({ viewport: { width: 1280, height: 900 } })
  await p5.goto(BASE)
  ok(await p5.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow on desktop')
} catch (e) {
  console.error(e)
  failures++
} finally {
  await browser.close()
  await new Promise((r) => server.httpServer.close(r))
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
