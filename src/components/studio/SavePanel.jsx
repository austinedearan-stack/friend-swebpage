import { useRef, useState } from 'react'
import { PRESETS, presetTheme, sanitizeTheme } from '../../config/themes.js'
import { KEYS, downloadJson, encodeThemeForUrl, readJsonFile, store } from '../../lib/util.js'

const loadSaved = () => {
  const list = store.get(KEYS.saved, [])
  return Array.isArray(list) ? list.filter((x) => x && typeof x.name === 'string').slice(0, 30) : []
}

export default function SavePanel({ theme, setTheme, toast }) {
  const [saved, setSaved] = useState(loadSaved)
  const [name, setName] = useState('')
  const [link, setLink] = useState(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef(null)

  const persist = (list) => {
    setSaved(list)
    if (!store.set(KEYS.saved, list)) toast("couldn't save. this browser might be blocking storage.", 'bad')
  }

  const save = (e) => {
    e.preventDefault()
    const n = name.trim().slice(0, 40) || `my theme ${saved.length + 1}`
    persist([{ name: n, theme: { ...theme, name: n }, at: Date.now() }, ...saved.filter((s) => s.name !== n)].slice(0, 30))
    setName('')
    toast(`saved “${n}” in this browser ✓`, 'good')
  }

  const load = (s) => {
    setTheme(sanitizeTheme(s.theme, presetTheme(s.theme?.preset)))
    toast(`loaded “${s.name}”`)
  }

  const exportTheme = () => {
    downloadJson(`theme-${(theme.name || theme.preset).replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.json`, { kind: 'austine-checking-in/theme', version: 1, theme })
    toast('theme file downloaded', 'good')
  }

  const importTheme = async (e) => {
    setImportError('')
    try {
      const data = await readJsonFile(e.target.files?.[0])
      const raw = data?.kind === 'austine-checking-in/theme' ? data.theme : data
      if (!raw || typeof raw !== 'object' || !['colors', 'type', 'layout', 'deco', 'motion'].some((k) => k in raw)) {
        throw new Error("that doesn't look like a theme file from this site.")
      }
      const clean = sanitizeTheme(raw, presetTheme(raw.preset))
      setTheme(clean)
      toast('theme imported ✓ (anything unrecognised was replaced with safe defaults)', 'good')
    } catch (err) {
      setImportError(err.message)
      toast('import failed, nothing was changed', 'bad')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const makeLink = async () => {
    const res = encodeThemeForUrl(theme)
    if (!res.ok) {
      setLink({ error: `this theme is too detailed for a link (${res.length} characters). use “download theme file” and send the file instead.` })
      return
    }
    setLink({ url: res.url })
    try {
      await navigator.clipboard.writeText(res.url)
      toast('share link copied ✓', 'good')
    } catch {
      toast('link ready. copy it from the box below.')
    }
  }

  return (
    <div className="ctl-stack">
      <div className="where-box">
        <p className="ctl-label">where things are kept</p>
        <ul>
          <li><b>this browser</b> — your current look saves automatically, only on this device.</li>
          <li><b>share link</b> — carries only the <i>look</i> (colours, fonts, layout). it can't change the words, mode or anything else on the site.</li>
          <li><b>site default</b> — what everyone sees first. only the site's creator can change that.</li>
        </ul>
      </div>

      <form className="ctl save-row" onSubmit={save}>
        <label className="ctl-label" htmlFor="save-name">save this look as…</label>
        <div className="inline-row">
          <input id="save-name" value={name} maxLength={40} placeholder={`${PRESETS[theme.preset].label} (my version)`} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary btn-small">save</button>
        </div>
      </form>

      {saved.length > 0 && (
        <ul className="saved-list" aria-label="saved themes">
          {saved.map((s) => (
            <li key={s.name}>
              <span className="saved-swatch" style={{ background: s.theme?.colors?.bg, borderColor: s.theme?.colors?.accent }} aria-hidden="true" />
              <span className="saved-name">{s.name}</span>
              <button className="btn btn-ghost btn-small" onClick={() => load(s)}>load</button>
              <button className="icon-btn" aria-label={`delete ${s.name}`} onClick={() => persist(saved.filter((x) => x !== s))}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="ctl">
        <span className="ctl-label">share the look</span>
        <button className="btn btn-small" onClick={makeLink}>🔗 copy share link</button>
        {link?.url && <input className="link-box" readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="share link" />}
        {link?.error && <p className="ctl-hint warn">{link.error}</p>}
      </div>

      <div className="ctl">
        <span className="ctl-label">theme file</span>
        <div className="inline-row">
          <button className="btn btn-small btn-ghost" onClick={exportTheme}>⬇ download theme file</button>
          <label className="btn btn-small btn-ghost file-btn">
            ⬆ import theme file
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={importTheme} />
          </label>
        </div>
        {importError && <p className="ctl-hint warn" role="alert">{importError}</p>}
      </div>
    </div>
  )
}
