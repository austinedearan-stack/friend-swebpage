import { useEffect, useRef, useState } from 'react'

// A light lock so the person you send the link to doesn't stumble into the
// content editor. It is NOT real security (everything runs in the browser) —
// but it doesn't need to be: edits made here only ever affect this browser.
// The live site only changes when the creator publishes a new site-config.json.
export default function AdminGate({ onUnlock, onClose }) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef(null)
  useEffect(() => input.current?.focus(), [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const ok = await onUnlock(pass)
    setBusy(false)
    if (!ok) setError("hmm, that's not it.")
  }

  return (
    <div className="modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form className="modal card" role="dialog" aria-modal="true" aria-labelledby="gate-h" onSubmit={submit}>
        <span className="tape tape-top" aria-hidden="true" />
        <h2 id="gate-h" className="hand">creator's corner</h2>
        <p className="muted">enter the passphrase to edit this site's words and mode.</p>
        <label className="field">
          <span>passphrase</span>
          <input ref={input} type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError('') }} autoComplete="current-password" />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={busy || !pass}>unlock</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>never mind</button>
        </div>
      </form>
    </div>
  )
}
