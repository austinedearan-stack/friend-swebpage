import { useEffect, useRef, useState } from 'react'

// Two kinds of lock:
// - live backend connected: real login. We email a magic link; the database only
//   lets emails on the admin list change anything.
// - no backend yet: the old passphrase, which only hides the editor. Edits then stay
//   in this browser until a new site-config.json is published.
export default function AdminGate({ live, onUnlock, onSendLink, onClose }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const input = useRef(null)
  useEffect(() => input.current?.focus(), [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (live) {
        const email = value.trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("that doesn't look like an email.")
        await onSendLink(email)
        setSentTo(email)
      } else if (!(await onUnlock(value))) setError("hmm, that's not it.")
    } catch (er) {
      setError(er.message || 'something went wrong. try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form className="modal card" role="dialog" aria-modal="true" aria-labelledby="gate-h" onSubmit={submit}>
        <span className="tape tape-top" aria-hidden="true" />
        <h2 id="gate-h" className="hand">creator's corner</h2>
        {sentTo ? (
          <>
            <p>check <b>{sentTo}</b> for a login link. opening it brings you straight back here, logged in.</p>
            <p className="muted small">no email after a minute? check spam, or try again.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>ok</button>
              <button type="button" className="btn btn-ghost" onClick={() => setSentTo('')}>use another email</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              {live ? "enter your admin email and we'll send you a one-tap login link." : "enter the passphrase to edit this site's pages and words."}
            </p>
            <label className="field">
              <span>{live ? 'email' : 'passphrase'}</span>
              <input
                ref={input}
                type={live ? 'email' : 'password'}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError('') }}
                autoComplete={live ? 'email' : 'current-password'}
              />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="modal-actions">
              <button className="btn btn-primary" disabled={busy || !value}>{live ? (busy ? 'sending…' : 'send login link') : 'unlock'}</button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>never mind</button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
