import { useRef, useState } from 'react'
import { themeDiff } from '../../config/themes.js'
import { sanitizeConfig } from '../../lib/content.js'
import { downloadJson, readJsonFile, sha256 } from '../../lib/util.js'

export default function PublishPanel({ config, draftRaw, theme, updateDraft, discardDraft, setDraftRaw, toast }) {
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  const finalConfig = () => sanitizeConfig(draftRaw || config)

  const download = () => {
    downloadJson('site-config.json', finalConfig())
    toast('site-config.json downloaded. now replace the file in the project and redeploy.', 'good')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(finalConfig(), null, 2))
      toast('config copied ✓', 'good')
    } catch {
      toast("couldn't reach the clipboard. use download instead.", 'bad')
    }
  }
  const setDefaultTheme = () => {
    updateDraft((d) => { d.site.defaultTheme = { preset: theme.preset, overrides: themeDiff(theme) } })
    toast('current look will be the site default once you publish ✓', 'good')
  }
  const changePass = async (e) => {
    e.preventDefault()
    if (pass.length < 8) return setErr('use at least 8 characters.')
    const h = await sha256(pass)
    updateDraft((d) => { d.admin.passphraseHash = h })
    setPass('')
    setErr('')
    toast('new passphrase stored in the draft. it starts working after you publish.', 'good')
  }
  const importConfig = async (e) => {
    try {
      const data = await readJsonFile(e.target.files?.[0])
      if (!data?.modes || !data?.site) throw new Error("that doesn't look like a site-config.json.")
      setDraftRaw(sanitizeConfig(data))
      toast('config loaded into your draft ✓ (invalid bits replaced with defaults)', 'good')
    } catch (er) {
      toast(er.message, 'bad')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="ctl-stack">
      <div className="where-box">
        <p className="ctl-label">how publishing works</p>
        <ol>
          <li>edit words, mode and look. it all previews here, only for you.</li>
          <li>download <code>site-config.json</code>.</li>
          <li>replace <code>src/config/site-config.json</code> in the project (on GitHub: open the file → ✎ edit → paste, or “upload files”).</li>
          <li>the site redeploys by itself in about a minute. her link stays the same.</li>
        </ol>
        <p className="ctl-hint">status: {draftRaw ? <b>you have unpublished changes</b> : 'nothing changed yet'}</p>
      </div>

      <div className="inline-row wrap">
        <button className="btn btn-primary btn-small" onClick={download}>⬇ download site-config.json</button>
        <button className="btn btn-ghost btn-small" onClick={copy}>copy as text</button>
      </div>

      <div className="ctl">
        <span className="ctl-label">default look for everyone</span>
        <button className="btn btn-small btn-ghost" onClick={setDefaultTheme}>use my current look as the site default</button>
        <p className="ctl-hint">visitors who already customised their own look keep theirs.</p>
      </div>

      <form className="ctl" onSubmit={changePass}>
        <label className="ctl-label" htmlFor="new-pass">change the admin passphrase</label>
        <div className="inline-row">
          <input id="new-pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
          <button className="btn btn-small">set</button>
        </div>
        {err && <p className="ctl-hint warn">{err}</p>}
        <p className="ctl-hint">this lock only keeps the editor out of sight. it isn't real security, and doesn't need to be: nothing anyone does in their browser can change the live site.</p>
      </form>

      <div className="inline-row wrap">
        <label className="btn btn-small btn-ghost file-btn">
          ⬆ load a site-config.json
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={importConfig} />
        </label>
        <button className="btn btn-small btn-ghost danger" disabled={!draftRaw} onClick={() => { discardDraft(); toast('draft discarded. back to the published words.') }}>
          discard draft
        </button>
      </div>
    </div>
  )
}
