import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CONFIG, PAGE_IDS, PAGE_MODE, fill, fingerprint, sanitizeConfig } from './lib/content.js'
import { presetTheme, sanitizeTheme, themeFrom } from './config/themes.js'
import { applyTheme } from './lib/applyTheme.js'
import { KEYS, clearUrlHash, makePicker, readThemeFromUrl, sha256, store } from './lib/util.js'
import { parseHash, useHashRoute } from './lib/router.js'
import { sanitizeAnnouncements } from './lib/announcements.js'
import * as backend from './lib/backend.js'
import Header from './components/Header.jsx'
import FlowPage from './components/FlowPage.jsx'
import AnnouncementsPage from './components/AnnouncementsPage.jsx'
import Footer from './components/Footer.jsx'
import ThemeStudio from './components/studio/ThemeStudio.jsx'
import AdminGate from './components/AdminGate.jsx'
import { Toasts, Confetti } from './components/Feedback.jsx'
import { Portal, Saucer } from './components/RickMorty.jsx'

const PUBLISHED = sanitizeConfig(DEFAULT_CONFIG)
const NEON = presetTheme('neon')
const LIVE = backend.backendEnabled

// counted once per page load (module scope, so re-renders can't double count)
const VISIT = (() => {
  const n = (Number(store.get(KEYS.visits, 0)) || 0) + 1
  store.set(KEYS.visits, n)
  return n
})()

/** The creator's default look for a page. Announcements always use the neon look. */
const pageTheme = (cfg, page) =>
  page === 'announcements' ? NEON : themeFrom(cfg.pages[page].theme?.preset, cfg.pages[page].theme?.overrides)

/** A look this visitor picked for a page before (the check-in page also inherits the old single-page choice). */
function storedTheme(page) {
  if (page === 'announcements') return null
  const t = store.get(`${KEYS.theme}.${page}`) ?? (page === 'checkin' ? store.get(KEYS.theme) : null)
  return t ? sanitizeTheme(t, presetTheme(t?.preset)) : null
}

function useReducedMotion() {
  const q = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.(q)
    if (!m) return
    const on = () => setReduced(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduced
}

export default function App() {
  const route = useHashRoute()

  // ---------- feedback ----------
  const [toasts, setToasts] = useState([])
  const toast = useCallback((text, tone = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  const [bursts, setBursts] = useState([])
  const celebrate = useCallback((x, y) => {
    const id = Math.random().toString(36).slice(2)
    setBursts((b) => [...b, { id, x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight / 3 }])
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 1400)
  }, [])

  // ---------- published words: bundled file → last live copy → fresh live copy ----------
  const [live, setLive] = useState(() => {
    const c = LIVE && store.get(KEYS.liveCache)
    return c?.data ? sanitizeConfig(c.data) : null
  })
  const [liveStatus, setLiveStatus] = useState(LIVE ? 'loading' : 'off')
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(() => (LIVE && store.get(KEYS.liveCache)?.updatedAt) || null)
  const [waitedEnough, setWaitedEnough] = useState(false)
  useEffect(() => {
    if (!LIVE) return
    const t = setTimeout(() => setWaitedEnough(true), 2500)
    backend
      .fetchSiteContent()
      .then((r) => {
        if (r) {
          setLive(sanitizeConfig(r.data))
          setLiveUpdatedAt(r.updatedAt)
          store.set(KEYS.liveCache, { data: r.data, updatedAt: r.updatedAt })
        } else {
          // nothing published to the database yet: the bundled file is the truth
          setLive(null)
          store.remove(KEYS.liveCache)
        }
        setLiveStatus('ok')
      })
      .catch(() => setLiveStatus('error'))
    return () => clearTimeout(t)
  }, [])
  const base = live || PUBLISHED
  const baseId = useMemo(() => fingerprint(base), [base])
  const baseRef = useRef(base)
  baseRef.current = base
  // first ever visit: wait briefly for the live words rather than flashing old ones
  const ready = liveStatus !== 'loading' || !!live || waitedEnough

  // ---------- admin ----------
  const [localAdmin, setLocalAdmin] = useState(() => !LIVE && store.get(KEYS.admin) === PUBLISHED.admin.passphraseHash)
  const [remoteAdmin, setRemoteAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const isAdmin = LIVE ? remoteAdmin : localAdmin
  const [gateOpen, setGateOpen] = useState(() => /(?:^#|&)admin\b/.test(window.location.hash))
  const [studioOpen, setStudioOpen] = useState(false)
  const [studioRequest, setStudioRequest] = useState(null)
  const openStudio = useCallback((tab, annId) => {
    setStudioOpen(true)
    if (tab) setStudioRequest({ tab, annId, at: Date.now() })
  }, [])

  useEffect(() => {
    const onHash = () => /(?:^#|&)admin\b/.test(window.location.hash) && setGateOpen(true)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // live login: only loads the auth library for returning admins / login links
  useEffect(() => {
    if (!backend.mightHaveSession()) return
    let cancelled = false
    let off = () => {}
    const hash = window.location.hash
    const returning = /(?:^#|&)(access_token|error_description)=/.test(hash)
    const linkError = /error_description=([^&]+)/.exec(hash)
    const apply = async (session, announce) => {
      if (!session) {
        setRemoteAdmin(false)
        setAdminEmail('')
        return
      }
      const ok = await backend.checkIsAdmin().catch(() => false)
      if (cancelled) return
      setRemoteAdmin(ok)
      setAdminEmail(session.user?.email || '')
      if (announce) {
        toast(ok ? 'logged in. admin mode on ✓' : "logged in, but that email isn't on the admin list.", ok ? 'good' : 'bad')
        if (ok) openStudio('words')
      }
    }
    ;(async () => {
      try {
        const session = await backend.currentSession()
        if (cancelled) return
        if (linkError) toast(`login link problem: ${decodeURIComponent(linkError[1].replace(/\+/g, ' '))}`, 'bad')
        if (returning) clearUrlHash()
        await apply(session, returning && !!session)
        off = await backend.onAuthChange((event, s) => {
          if (event !== 'INITIAL_SESSION' && !cancelled) apply(s, false)
        })
      } catch {
        // backend unreachable: carry on as a visitor
      }
    })()
    return () => {
      cancelled = true
      off()
    }
  }, [toast, openStudio])

  // ---------- admin draft (what the admin is editing, before publishing) ----------
  const [draftRaw, setDraftRaw] = useState(() => {
    const d = store.get(KEYS.draft)
    return d?.data ? sanitizeConfig(d.data) : null
  })
  const saveDraft = useCallback((data) => store.set(KEYS.draft, { base: fingerprint(baseRef.current), data }), [])
  // once we know the real published version, drop drafts based on an older one,
  // so a stale draft can never hide newly published words from the admin
  useEffect(() => {
    if (liveStatus === 'loading') return
    const d = store.get(KEYS.draft)
    if (!d || d.base === baseId) return
    store.remove(KEYS.draft)
    setDraftRaw(null)
    if (isAdmin) toast('a newer version was published, so your old unpublished draft was cleared.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, liveStatus])

  const config = useMemo(() => (isAdmin && draftRaw ? sanitizeConfig(draftRaw) : base), [isAdmin, draftRaw, base])
  const updateDraft = useCallback((mutate) => {
    setDraftRaw((prev) => {
      const next = structuredClone(prev || baseRef.current)
      mutate(next)
      saveDraft(next)
      return next
    })
  }, [saveDraft])
  const discardDraft = useCallback(() => {
    store.remove(KEYS.draft)
    setDraftRaw(null)
  }, [])
  const publishLive = async () => {
    const cfg = sanitizeConfig(draftRaw || config)
    const updatedAt = await backend.publishSiteContent(cfg)
    setLive(cfg)
    setLiveUpdatedAt(updatedAt)
    store.set(KEYS.liveCache, { data: cfg, updatedAt })
    discardDraft()
  }

  // ---------- which page ----------
  const pageOn = (p) => config.pages[p].enabled || isAdmin
  const home = pageOn(config.site.homePage) ? config.site.homePage : PAGE_IDS.find(pageOn) || 'announcements'
  const targetPage = route.page && pageOn(route.page) ? route.page : home
  const [page, setPage] = useState(targetPage)
  const [warping, setWarping] = useState(false)
  useEffect(() => {
    if (targetPage === page) {
      setWarping(false)
      return
    }
    // a portal opens, the page swaps behind it, the portal closes
    if (document.documentElement.dataset.motion === 'reduced') {
      setPage(targetPage)
      window.scrollTo(0, 0)
      return
    }
    setWarping(true)
    const swap = setTimeout(() => {
      setPage(targetPage)
      window.scrollTo(0, 0)
    }, 420)
    const done = setTimeout(() => setWarping(false), 980)
    return () => {
      clearTimeout(swap)
      clearTimeout(done)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPage])
  useEffect(() => { document.documentElement.dataset.page = page }, [page])
  // move focus to the new page's main heading (not on first load)
  const firstPage = useRef(true)
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false
      return
    }
    setTimeout(() => document.querySelector('#main .step-focus:not([hidden] *)')?.focus({ preventScroll: true }), 50)
  }, [page])

  const step = route.page === page ? route.step : null
  const mode = PAGE_MODE[page]
  const copy = config.modes[mode || 'friend']
  const vars = { name: copy.recipientName }
  const themeEditable = page !== 'announcements'

  // ---------- theme (one per page) ----------
  const reducedByOs = useReducedMotion()
  const [sharedLink, setSharedLink] = useState(() => {
    const t = readThemeFromUrl()
    return t ? { theme: t, page: parseHash().page || PUBLISHED.site.homePage } : null
  })
  const [custom, setCustom] = useState({}) // page → look picked this visit
  const [histories, setHistories] = useState({}) // page → undo stack
  const [savedAt, setSavedAt] = useState(null)
  const previewingShared = !!sharedLink && sharedLink.theme !== 'invalid' && sharedLink.page === page && themeEditable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stored = useMemo(() => storedTheme(page), [page, savedAt])
  const theme = useMemo(() => {
    if (!themeEditable) return NEON
    return custom[page] ?? (previewingShared ? sharedLink.theme : stored ?? pageTheme(config, page))
  }, [themeEditable, custom, page, previewingShared, sharedLink, stored, config])

  const themeRef = useRef(theme)
  const pageRef = useRef(page)
  themeRef.current = theme
  pageRef.current = page
  const lastPush = useRef(0)
  // coalesce: rapid changes (dragging a slider) become a single undo step
  const setTheme = useCallback((next, { coalesce = false } = {}) => {
    const p = pageRef.current
    if (p === 'announcements') return
    const prev = themeRef.current
    const value = typeof next === 'function' ? next(prev) : next
    const now = Date.now()
    if (!coalesce || now - lastPush.current > 700) setHistories((h) => ({ ...h, [p]: [...(h[p] || []).slice(-39), prev] }))
    lastPush.current = now
    themeRef.current = value
    setCustom((c) => ({ ...c, [p]: value }))
  }, [])
  const history = histories[page] || []
  const undo = () => {
    if (!history.length) return
    const prev = history[history.length - 1]
    themeRef.current = prev
    setCustom((c) => ({ ...c, [page]: prev }))
    setHistories((h) => ({ ...h, [page]: history.slice(0, -1) }))
  }

  useEffect(() => applyTheme(theme, reducedByOs), [theme, reducedByOs])

  // autosave a look the visitor changed (not while just previewing a shared link)
  useEffect(() => {
    if (!custom[page] || previewingShared) return
    const id = setTimeout(() => {
      if (store.set(`${KEYS.theme}.${page}`, custom[page])) setSavedAt(Date.now())
    }, 350)
    return () => clearTimeout(id)
  }, [custom, page, previewingShared])

  const keepShared = () => {
    store.set(`${KEYS.theme}.${page}`, theme)
    setCustom((c) => ({ ...c, [page]: theme }))
    setSharedLink(null)
    clearUrlHash()
    toast('theme saved to this browser.', 'good')
  }
  const dropShared = () => {
    setCustom((c) => {
      const next = { ...c }
      delete next[page]
      return next
    })
    setSharedLink(null)
    clearUrlHash()
  }
  useEffect(() => {
    if (sharedLink?.theme === 'invalid') {
      toast("that theme link looked broken, so here's the normal look instead.")
      setSharedLink(null)
      clearUrlHash()
    }
  }, [sharedLink, toast])

  // ---------- announcements ----------
  const [annRemote, setAnnRemote] = useState(() => {
    const c = LIVE && store.get(KEYS.annCache)
    return c ? sanitizeAnnouncements(c) : null
  })
  const [annStatus, setAnnStatus] = useState(LIVE ? 'loading' : 'local')
  const loadAnnouncements = useCallback(async () => {
    if (!LIVE) return
    try {
      const list = isAdmin ? await backend.fetchAnnouncementsAdmin() : await backend.fetchAnnouncementsPublic()
      setAnnRemote(list)
      setAnnStatus('live')
      if (!isAdmin) store.set(KEYS.annCache, list)
    } catch {
      setAnnStatus((s) => (s === 'live' ? 'live' : 'offline'))
    }
  }, [isAdmin])
  const onAnnPage = page === 'announcements'
  useEffect(() => {
    if (!LIVE || !(onAnnPage || isAdmin)) return
    loadAnnouncements()
    if (!onAnnPage) return
    const id = setInterval(loadAnnouncements, 60_000) // keep the board fresh while it's open
    return () => clearInterval(id)
  }, [onAnnPage, isAdmin, loadAnnouncements])
  const announcements = LIVE ? annRemote || [] : config.announcements

  const annApi = useMemo(() => {
    if (LIVE) {
      return {
        live: true,
        list: announcements,
        save: async (a) => { await backend.saveAnnouncement(a); await loadAnnouncements() },
        remove: async (id) => { await backend.deleteAnnouncement(id); await loadAnnouncements() },
        reorder: async (items) => { await backend.setAnnouncementOrder(items); await loadAnnouncements() },
      }
    }
    return {
      live: false,
      list: announcements,
      save: async (a) => updateDraft((d) => {
        const item = { ...a, id: a.id.startsWith('new-') ? `local-${Date.now()}` : a.id }
        const i = d.announcements.findIndex((x) => x.id === a.id)
        if (i >= 0) d.announcements[i] = item
        else d.announcements.push(item)
      }),
      remove: async (id) => updateDraft((d) => { d.announcements = d.announcements.filter((x) => x.id !== id) }),
      reorder: async (items) => updateDraft((d) => {
        for (const { id, order } of items) {
          const x = d.announcements.find((y) => y.id === id)
          if (x) x.order = order
        }
      }),
    }
  }, [announcements, loadAnnouncements, updateDraft])

  // ---------- greeting changes per visit ----------
  const pickerRef = useRef(null)
  if (!pickerRef.current) pickerRef.current = makePicker()
  const pick = pickerRef.current
  const greeting = useMemo(() => {
    const w = copy.welcome
    const list = VISIT === 1 ? w.greetingsFirstVisit : w.greetingsReturning
    return fill(list[(VISIT - 1) % list.length], vars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, copy.welcome])

  // ---------- studio element picking ----------
  const [picking, setPicking] = useState(false)
  const [focusTarget, setFocusTarget] = useState(null)
  useEffect(() => { document.documentElement.dataset.studio = studioOpen ? 'open' : 'closed' }, [studioOpen])
  useEffect(() => {
    if (!picking) return
    const onClick = (e) => {
      if (e.target.closest('.studio')) return
      e.preventDefault()
      e.stopPropagation()
      const el = e.target.closest('[data-edit]')
      setPicking(false)
      if (el) setFocusTarget({ key: el.dataset.edit, at: Date.now() })
      else toast('nothing editable there. try a card, button or heading!')
    }
    const onKey = (e) => e.key === 'Escape' && setPicking(false)
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKey)
    document.documentElement.dataset.picking = 'on'
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onKey)
      document.documentElement.dataset.picking = 'off'
    }
  }, [picking, toast])

  // ---------- admin unlock / lock ----------
  const unlock = async (pass) => {
    const h = await sha256(pass)
    if (h !== PUBLISHED.admin.passphraseHash) return false
    store.set(KEYS.admin, h)
    setLocalAdmin(true)
    setGateOpen(false)
    clearUrlHash()
    toast('admin mode unlocked. edits stay in this browser until you publish.', 'good')
    openStudio('words')
    return true
  }
  const lock = async () => {
    if (LIVE) {
      await backend.signOut().catch(() => {})
      setRemoteAdmin(false)
      setAdminEmail('')
      toast('logged out.')
    } else {
      store.remove(KEYS.admin)
      setLocalAdmin(false)
      toast('admin mode locked.')
    }
  }
  const closeGate = () => {
    setGateOpen(false)
    clearUrlHash()
  }

  const navItems = PAGE_IDS.filter((p) => isAdmin || (config.pages[p].enabled && (config.pages[p].inNav || p === page))).map((p) => ({
    id: p,
    label: config.pages[p].navLabel,
    flag: !isAdmin ? '' : !config.pages[p].enabled ? 'off' : !config.pages[p].inNav ? 'link only' : '',
  }))

  const shared = { copy, vars, pick, toast, celebrate, eggs: config.eggs }

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>skip to the content</a>
      <div className="paper-texture" aria-hidden="true" />

      {previewingShared && (
        <div className="shared-banner" role="status">
          <span>you're looking at a theme someone shared with you.</span>
          <span className="shared-actions">
            <button className="btn btn-small" onClick={keepShared}>keep it</button>
            <button className="btn btn-small btn-ghost" onClick={dropShared}>no thanks</button>
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="admin-bar" role="region" aria-label="admin controls">
          <span className="admin-pill">admin</span>
          <span className="admin-who">{LIVE ? <><span className="live-dot" aria-hidden="true" /> {adminEmail || 'live'}</> : 'local preview'}</span>
          {!config.pages[page].enabled && <span className="admin-warn">this page is off for visitors</span>}
          {draftRaw && <span className="admin-draft">unpublished changes</span>}
          <button className="btn btn-small btn-ghost" onClick={() => openStudio('words')}>pages & words</button>
          <button className="btn btn-small btn-ghost" onClick={() => openStudio('announce')}>announcements</button>
          <button className="btn btn-small btn-ghost" onClick={() => openStudio('publish')}>publish</button>
          <button className="btn btn-small btn-ghost" onClick={lock}>{LIVE ? 'log out' : 'lock'}</button>
        </div>
      )}

      <Header
        title={config.site.title}
        eggs={config.eggs}
        celebrate={celebrate}
        onOpenStudio={() => setStudioOpen(true)}
        studioLabel={themeEditable ? 'make it yours' : isAdmin ? 'admin' : ''}
        navItems={navItems}
        page={page}
      />

      <main id="main" tabIndex={-1} className={`page page-${page}`}>
        {!ready ? (
          <div className="loader" role="status">
            <Portal size={120} />
            <p className="hand">opening a portal…</p>
          </div>
        ) : page === 'announcements' ? (
          <AnnouncementsPage
            cfg={config.pages.announcements}
            list={announcements}
            loading={LIVE && annStatus === 'loading' && !annRemote}
            status={annStatus}
            isAdmin={isAdmin}
            onNew={() => openStudio('announce', 'new')}
            onEdit={(id) => openStudio('announce', id)}
          />
        ) : (
          <FlowPage key={page} page={page} step={step} mode={mode} shared={shared} greeting={greeting} />
        )}
      </main>

      <Footer {...shared} />

      <div className="rm-ambient" aria-hidden="true">
        <Saucer size={64} beam />
      </div>
      <div className={`portal-warp ${warping ? 'is-on' : ''}`} aria-hidden="true">
        <Portal size={400} className="portal-warp-disc" />
      </div>

      <ThemeStudio
        open={studioOpen}
        onClose={() => { setStudioOpen(false); setPicking(false) }}
        theme={theme}
        setTheme={setTheme}
        undo={undo}
        canUndo={history.length > 0}
        creatorDefault={pageTheme(config, page)}
        savedAt={savedAt}
        previewingShared={previewingShared}
        toast={toast}
        picking={picking}
        setPicking={setPicking}
        focusTarget={focusTarget}
        isAdmin={isAdmin}
        config={config}
        draftRaw={draftRaw}
        updateDraft={updateDraft}
        discardDraft={discardDraft}
        published={base}
        setDraftRaw={(d) => { saveDraft(d); setDraftRaw(d) }}
        page={page}
        themeEditable={themeEditable}
        request={studioRequest}
        annApi={annApi}
        live={LIVE}
        onPublishLive={publishLive}
        liveUpdatedAt={liveUpdatedAt}
      />

      {gateOpen && !isAdmin && (
        <AdminGate live={LIVE} onUnlock={unlock} onSendLink={(email) => backend.sendMagicLink(email)} onClose={closeGate} />
      )}

      <Toasts toasts={toasts} />
      <Confetti bursts={bursts} />
    </>
  )
}
