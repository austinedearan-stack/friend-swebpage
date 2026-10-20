import { useEffect, useState } from 'react'
import { CATEGORIES, CATEGORY_IDS, PHOTO_IDS, fromLocalInput, isExpired, safeUrl, sanitizeAnnouncement, toLocalInput, visibleAnnouncements } from '../../lib/announcements.js'
import { PHOTOS } from '../../lib/photos.js'
import AnnouncementCard from '../AnnouncementCard.jsx'
import { Segmented, TextField, Toggle } from './Controls.jsx'

const blank = (order) => ({
  id: `new-${Date.now()}`, title: '', body: '', category: 'info', pinned: false, published: true,
  eventAt: null, expiresAt: null, order, image: 'none', linkUrl: '', linkLabel: '', createdAt: null,
})

// Admin: write, edit, pin, reorder and delete announcements.
// With the live backend every save goes straight to the database; without it,
// posts are kept in the draft and go live with the next published site-config.json.
export default function AnnouncementsEditor({ annApi, request, toast }) {
  const list = visibleAnnouncements(annApi.list, { isAdmin: true })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const nextOrder = list.reduce((m, a) => Math.max(m, a.order), -1) + 1

  useEffect(() => {
    if (!request?.annId) return
    if (request.annId === 'new') setEditing(blank(nextOrder))
    else {
      const found = annApi.list.find((a) => a.id === request.annId)
      if (found) setEditing({ ...found })
    }
    setConfirmDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  const set = (k) => (v) => setEditing((e) => ({ ...e, [k]: v }))

  const run = async (fn, okMsg) => {
    setBusy(true)
    try {
      await fn()
      if (okMsg) toast(okMsg, 'good')
      return true
    } catch (er) {
      toast(`couldn't save: ${er.message}`, 'bad')
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    const clean = sanitizeAnnouncement({ ...editing, createdAt: editing.createdAt || new Date().toISOString() })
    if (!clean) return toast('give it a title first.', 'bad')
    if (editing.linkUrl && !clean.linkUrl) return toast('that link needs to start with https://', 'bad')
    if (await run(() => annApi.save(clean), annApi.live ? "saved. it's live ✓" : 'saved to your draft ✓')) setEditing(null)
  }

  const remove = async () => {
    if (await run(() => annApi.remove(editing.id), 'announcement deleted')) setEditing(null)
  }

  // swap with the neighbour inside the same group (pinned posts stay above the rest)
  const move = (a, dir) => {
    const group = list.filter((x) => x.pinned === a.pinned)
    const i = group.findIndex((x) => x.id === a.id)
    const j = i + dir
    if (j < 0 || j >= group.length) return
    const reordered = [...group]
    ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]
    run(() => annApi.reorder(reordered.map((x, k) => ({ id: x.id, order: k }))))
  }

  if (editing) {
    const isNew = editing.id.startsWith('new-')
    const preview = sanitizeAnnouncement({ ...editing, title: editing.title || 'your title here', createdAt: editing.createdAt || new Date().toISOString() })
    return (
      <div className="ctl-stack ann-editor">
        <button className="link-btn" onClick={() => setEditing(null)}>← all announcements</button>
        <h3 className="ann-editor-h">{isNew ? 'new announcement' : 'edit announcement'}</h3>

        <TextField label="title" value={editing.title} maxLength={140} onChange={set('title')} />
        <TextField label="message" multiline rows={6} maxLength={100} value={editing.body} onChange={set('body')} hint="plain text. line breaks are kept." />
        <Segmented id="ann-cat" label="type" value={editing.category} options={CATEGORY_IDS.map((c) => [c, CATEGORIES[c].label])} onChange={set('category')} />
        <p className="ctl-hint">{CATEGORIES[editing.category].blurb}</p>

        <div className="ctl">
          <span className="ctl-label" id="ann-photo-l">cover photo</span>
          <div className="photo-pick" role="radiogroup" aria-labelledby="ann-photo-l">
            {PHOTO_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={editing.image === id}
                className={`photo-opt ${editing.image === id ? 'on' : ''}`}
                onClick={() => set('image')(id)}
                title={id === 'none' ? 'no photo' : PHOTOS[id].label}
              >
                {id === 'none' ? <span>none</span> : <img src={PHOTOS[id].src} alt={PHOTOS[id].label} />}
              </button>
            ))}
          </div>
        </div>

        <Toggle id="ann-pin" label="pin to the top" checked={editing.pinned} onChange={set('pinned')} />
        <Toggle id="ann-pub" label="visible to everyone" checked={editing.published} onChange={set('published')} hint={editing.published ? null : 'off = a draft only you can see.'} />

        <DateField id="ann-event" label="event date & time (shows a live countdown)" value={editing.eventAt} onChange={set('eventAt')} />
        <DateField id="ann-exp" label="hide it automatically after" value={editing.expiresAt} onChange={set('expiresAt')} />

        <TextField label="link (optional)" value={editing.linkUrl} maxLength={500} onChange={set('linkUrl')} hint={editing.linkUrl && !safeUrl(editing.linkUrl) ? '⚠ needs to start with https://' : 'e.g. a location, a form, a playlist.'} />
        {editing.linkUrl && <TextField label="link button text" value={editing.linkLabel} maxLength={60} onChange={set('linkLabel')} />}

        {preview && (
          <div className="ctl">
            <span className="ctl-label">preview</span>
            <div className="ann-preview"><AnnouncementCard a={preview} /></div>
          </div>
        )}

        <div className="inline-row wrap">
          <button className="btn btn-primary btn-small" onClick={save} disabled={busy}>{busy ? 'saving…' : annApi.live ? 'save & publish' : 'save'}</button>
          <button className="btn btn-ghost btn-small" onClick={() => setEditing(null)} disabled={busy}>cancel</button>
          {!isNew && (confirmDelete ? (
            <button className="btn btn-small danger" onClick={remove} disabled={busy}>yes, delete it</button>
          ) : (
            <button className="link-btn danger" onClick={() => setConfirmDelete(true)}>delete…</button>
          ))}
        </div>
      </div>
    )
  }

  const now = Date.now()
  return (
    <div className="ctl-stack">
      <div className="where-box">
        {annApi.live ? (
          <p className="ctl-hint"><span className="live-dot" aria-hidden="true" /> <b>live:</b> saving here updates the site for everyone straight away.</p>
        ) : (
          <p className="ctl-hint">posts are saved into your draft. press <b>★ publish</b> to make them live (or connect the live backend, see the README, to skip that step).</p>
        )}
      </div>
      <button className="btn btn-primary btn-small" onClick={() => setEditing(blank(nextOrder))}>+ new announcement</button>
      {list.length === 0 ? (
        <p className="ctl-hint">no announcements yet.</p>
      ) : (
        <ol className="ann-admin-list">
          {list.map((a) => {
            const group = list.filter((x) => x.pinned === a.pinned)
            const gi = group.indexOf(a)
            return (
              <li key={a.id} className={`cat-${a.category}`}>
                <i className="ann-dot" aria-hidden="true" />
                <span className="ann-admin-title">
                  {a.title}
                  <span className="ann-admin-badges">
                    {a.pinned && <span>pinned</span>}
                    {!a.published && <span className="warn">draft</span>}
                    {isExpired(a, now) && <span className="warn">expired</span>}
                    {a.eventAt && <span>event</span>}
                  </span>
                </span>
                <span className="ann-admin-actions">
                  <button className="icon-btn icon-sm" onClick={() => move(a, -1)} disabled={busy || gi === 0} aria-label={`move “${a.title}” up`}>↑</button>
                  <button className="icon-btn icon-sm" onClick={() => move(a, 1)} disabled={busy || gi === group.length - 1} aria-label={`move “${a.title}” down`}>↓</button>
                  <button className="btn btn-small btn-ghost" onClick={() => { setEditing({ ...a }); setConfirmDelete(false) }}>edit</button>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function DateField({ id, label, value, onChange }) {
  return (
    <div className="ctl">
      <label className="ctl-label" htmlFor={id}>{label}</label>
      <div className="inline-row">
        <input id={id} type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />
        {value && <button type="button" className="btn btn-small btn-ghost" onClick={() => onChange(null)}>clear</button>}
      </div>
    </div>
  )
}
