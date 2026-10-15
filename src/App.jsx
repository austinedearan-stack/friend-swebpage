import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CONFIG, sanitizeConfig, fill } from './lib/content.js'
import { sanitizeTheme, themeFrom, presetTheme } from './config/themes.js'
import { applyTheme } from './lib/applyTheme.js'
import { KEYS, store, makePicker, readThemeFromUrl, clearUrlHash, sha256 } from './lib/util.js'
import Header from './components/Header.jsx'
import Welcome from './components/Welcome.jsx'
import CheckIn from './components/CheckIn.jsx'
import Tomorrow from './components/Tomorrow.jsx'
import Extras from './components/Extras.jsx'
import Rps from './components/Rps.jsx'
import Footer from './components/Footer.jsx'
import ThemeStudio from './components/studio/ThemeStudio.jsx'
import AdminGate from './components/AdminGate.jsx'
import { Toasts, Confetti } from './components/Feedback.jsx'

const PUBLISHED = sanitizeConfig(DEFAULT_CONFIG)
// Fingerprint of the published words. An admin draft remembers which version it
// was based on; once a new site-config.json is published, old drafts are dropped
// so they can't hide the new text in the admin's browser.
const PUBLISHED_ID = (() => {
  let h = 5381
  for (const ch of JSON.stringify(PUBLISHED)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0
  return h.toString(36)
})()
const saveDraft = (data) => store.set(KEYS.draft, { base: PUBLISHED_ID, data })
const STALE_DRAFT_CLEARED = (() => {
  const d = store.get(KEYS.draft)
  if (!d || d.base === PUBLISHED_ID) return false
  store.remove(KEYS.draft)
  return true
})()
// counted once per page load (module scope, so re-renders can't double count)
const VISIT = (() => {
  const n = (Number(store.get(KEYS.visits, 0)) || 0) + 1
  store.set(KEYS.visits, n)
  return n
})()
const creatorTheme = (cfg) => themeFrom(cfg.site.defaultTheme?.preset, cfg.site.defaultTheme?.overrides)

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
  // ---------- admin + content ----------
  const [isAdmin, setIsAdmin] = useState(() => store.get(KEYS.admin) === PUBLISHED.admin.passphraseHash)
  const [gateOpen, setGateOpen] = useState(() => /^#admin\b/.test(window.location.hash))
  // raw draft = what the admin typed (may contain empty fields while editing); sanitized before use
  const [draftRaw, setDraftRaw] = useState(() => {
    const d = store.get(KEYS.draft)
    return d?.data ? sanitizeConfig(d.data) : null
  })
  useEffect(() => {
    const onHash = () => /^#admin\b/.test(window.location.hash) && setGateOpen(true)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const config = useMemo(
    () => (isAdmin && draftRaw ? sanitizeConfig(draftRaw) : PUBLISHED),
    [isAdmin, draftRaw],
  )
  const updateDraft = useCallback((mutate) => {
    setDraftRaw((prev) => {
      const next = structuredClone(prev || PUBLISHED)
      mutate(next)
      saveDraft(next)
      return next
    })
  }, [])
  const discardDraft = useCallback(() => {
    store.remove(KEYS.draft)
    setDraftRaw(null)
  }, [])

  // visitor may switch mode only if the creator allowed it; nothing in the URL can change it
  const [visitorMode, setVisitorMode] = useState(null)
  const mode = config.site.visitorCanSwitchMode && !isAdmin && visitorMode ? visitorMode : config.site.activeMode
  const copy = config.modes[mode]
  const vars = { name: copy.recipientName }

  // ---------- theme ----------
  const reducedByOs = useReducedMotion()
  const [sharedTheme, setSharedTheme] = useState(() => readThemeFromUrl())
  const [theme, setThemeState] = useState(() => {
    const t = sharedTheme && sharedTheme !== 'invalid' ? sharedTheme : null
    if (t) return t
    const local = store.get(KEYS.theme)
    return local ? sanitizeTheme(local, presetTheme(local?.preset)) : creatorTheme(PUBLISHED)
  })
  const [history, setHistory] = useState([])
  const lastPush = useRef(0)
  const [savedAt, setSavedAt] = useState(null)
  const previewingShared = sharedTheme && sharedTheme !== 'invalid'

  const themeRef = useRef(theme)
  const historyRef = useRef(history)
  themeRef.current = theme
  historyRef.current = history
  // coalesce: rapid changes (dragging a slider) become a single undo step
  const setTheme = useCallback((next, { coalesce = false } = {}) => {
    const prev = themeRef.current
    const value = typeof next === 'function' ? next(prev) : next
    const now = Date.now()
    if (!coalesce || now - lastPush.current > 700) {
      historyRef.current = [...historyRef.current.slice(-39), prev]
      setHistory(historyRef.current)
    }
    lastPush.current = now
    themeRef.current = value
    setThemeState(value)
  }, [])
  const undo = useCallback(() => {
    const h = historyRef.current
    if (!h.length) return
    themeRef.current = h[h.length - 1]
    historyRef.current = h.slice(0, -1)
    setThemeState(themeRef.current)
    setHistory(historyRef.current)
  }, [])

  useEffect(() => applyTheme(theme, reducedByOs), [theme, reducedByOs])

  // autosave to this browser (not while just previewing a shared link)
  useEffect(() => {
    if (previewingShared) return
    const id = setTimeout(() => {
      if (store.set(KEYS.theme, theme)) setSavedAt(Date.now())
    }, 350)
    return () => clearTimeout(id)
  }, [theme, previewingShared])

  // ---------- feedback ----------
  const [toasts, setToasts] = useState([])
  const toast = useCallback((text, tone = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-2), { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  useEffect(() => {
    if (STALE_DRAFT_CLEARED && isAdmin) toast('a new version was published, so your old unpublished draft was cleared.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [bursts, setBursts] = useState([])
  const celebrate = useCallback((x, y) => {
    const id = Math.random().toString(36).slice(2)
    setBursts((b) => [...b, { id, x: x ?? window.innerWidth / 2, y: y ?? window.innerHeight / 3 }])
    setTimeout(() => setBursts((b) => b.filter((p) => p.id !== id)), 1400)
  }, [])

  const pickerRef = useRef(null)
  if (!pickerRef.current) pickerRef.current = makePicker()
  const pick = pickerRef.current

  // ---------- greeting changes per visit ----------
  const visit = VISIT
  const greeting = useMemo(() => {
    const w = copy.welcome
    const list = visit === 1 ? w.greetingsFirstVisit : w.greetingsReturning
    return fill(list[(visit - 1) % list.length], vars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit, mode, copy.welcome])

  // ---------- studio + element picking ----------
  const [studioOpen, setStudioOpen] = useState(false)
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

  // ---------- admin unlock ----------
  const unlock = async (pass) => {
    const h = await sha256(pass)
    if (h !== PUBLISHED.admin.passphraseHash) return false
    store.set(KEYS.admin, h)
    setIsAdmin(true)
    setGateOpen(false)
    clearUrlHash()
    toast('admin mode unlocked. edits stay in this browser until you publish.', 'good')
    setStudioOpen(true)
    return true
  }
  const lock = () => {
    store.remove(KEYS.admin)
    setIsAdmin(false)
    toast('admin mode locked.')
  }

  const keepShared = () => {
    store.set(KEYS.theme, theme)
    setSharedTheme(null)
    clearUrlHash()
    toast('theme saved to this browser.', 'good')
  }
  const dropShared = () => {
    const local = store.get(KEYS.theme)
    setThemeState(local ? sanitizeTheme(local, presetTheme(local.preset)) : creatorTheme(PUBLISHED))
    setSharedTheme(null)
    clearUrlHash()
  }
  useEffect(() => {
    if (sharedTheme === 'invalid') {
      toast("that theme link looked broken, so here's the normal look instead.")
      setSharedTheme(null)
      clearUrlHash()
    }
  }, [sharedTheme, toast])

  const shared = { copy, vars, pick, toast, celebrate, eggs: config.eggs }

  return (
    <>
      <a className="skip-link" href="#checkin">skip to the check-in</a>
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
          <label className="admin-mode">
            <span>live mode:</span>
            <select value={config.site.activeMode} onChange={(e) => updateDraft((d) => { d.site.activeMode = e.target.value })}>
              <option value="personal">{config.modes.personal.label}</option>
              <option value="friend">{config.modes.friend.label}</option>
            </select>
          </label>
          {draftRaw && <span className="admin-draft">unpublished draft</span>}
          <button className="btn btn-small btn-ghost" onClick={() => setStudioOpen(true)}>edit words</button>
          <button className="btn btn-small btn-ghost" onClick={lock}>lock</button>
        </div>
      )}

      <Header
        title={config.site.title}
        eggs={config.eggs}
        toast={toast}
        celebrate={celebrate}
        onOpenStudio={() => setStudioOpen(true)}
        modeLabel={copy.label}
        canSwitch={config.site.visitorCanSwitchMode && !isAdmin}
        mode={mode}
        modes={config.modes}
        onSwitchMode={(m) => setVisitorMode(m)}
      />

      <main id="main" className="page">
        <Welcome {...shared} greeting={greeting} />
        <CheckIn key={`c-${mode}`} {...shared} />
        <Tomorrow key={`t-${mode}`} {...shared} />
        <Extras key={`e-${mode}`} {...shared} mode={mode} />
        <Rps key={`r-${mode}`} {...shared} />
      </main>

      <Footer {...shared} />

      <ThemeStudio
        open={studioOpen}
        onClose={() => { setStudioOpen(false); setPicking(false) }}
        theme={theme}
        setTheme={setTheme}
        undo={undo}
        canUndo={history.length > 0}
        creatorDefault={creatorTheme(config)}
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
        published={PUBLISHED}
        setDraftRaw={(d) => { saveDraft(d); setDraftRaw(d) }}
      />

      {gateOpen && !isAdmin && <AdminGate onUnlock={unlock} onClose={() => { setGateOpen(false); clearUrlHash() }} />}

      <Toasts toasts={toasts} />
      <Confetti bursts={bursts} />
    </>
  )
}
