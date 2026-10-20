import { useState } from 'react'
import { CATEGORIES, countdownParts, formatWhen, isExpired, timeAgo } from '../lib/announcements.js'
import { PHOTOS, useNow } from '../lib/photos.js'

const LONG = 280

function Countdown({ at }) {
  const now = useNow(1000)
  const c = countdownParts(at, now)
  if (c.done) {
    const past = now - Date.parse(at)
    return <p className="ann-countdown is-done"><span className="ann-live-dot" aria-hidden="true" /> {past < 3 * 3600_000 ? 'happening now' : `happened ${timeAgo(at, now)}`}</p>
  }
  const cells = c.days > 0 ? [[c.days, 'days'], [c.hours, 'hrs'], [c.mins, 'min']] : [[c.hours, 'hrs'], [c.mins, 'min'], [c.secs, 'sec']]
  return (
    <div className="ann-countdown" role="timer" aria-label={`starts ${formatWhen(at)}`}>
      {cells.map(([n, u]) => (
        <span key={u} className="ann-cd-cell">
          <b>{String(n).padStart(2, '0')}</b>
          <small>{u}</small>
        </span>
      ))}
      <span className="ann-cd-when">{formatWhen(at)}</span>
    </div>
  )
}

export default function AnnouncementCard({ a, featured = false, isAdmin = false, onEdit, now = Date.now() }) {
  const [open, setOpen] = useState(false)
  const photo = PHOTOS[a.image]
  const long = a.body.length > LONG
  const expired = isExpired(a, now)
  const hid = `ann-${a.id}`

  return (
    <article className={`ann-card cat-${a.category} ${featured ? 'is-featured' : ''} ${photo ? 'has-photo' : ''}`} aria-labelledby={hid}>
      {photo && (
        <div className="ann-photo">
          <img src={photo.src} alt="" loading="lazy" decoding="async" />
        </div>
      )}
      <div className="ann-body">
        <div className="ann-meta">
          <span className="ann-cat"><i className="ann-dot" aria-hidden="true" />{CATEGORIES[a.category].label}</span>
          {a.pinned && <span className="ann-badge">pinned</span>}
          {isAdmin && !a.published && <span className="ann-badge is-warn">draft</span>}
          {isAdmin && expired && <span className="ann-badge is-warn">expired</span>}
          {a.createdAt && <time dateTime={a.createdAt}>{timeAgo(a.createdAt, now)}</time>}
        </div>
        <h3 id={hid} className="ann-title">{a.title}</h3>
        {a.body && <p className={`ann-text ${long && !open ? 'is-clamped' : ''}`}>{a.body}</p>}
        {long && (
          <button className="ann-more" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'show less' : 'read more'}
          </button>
        )}
        {a.eventAt && <Countdown at={a.eventAt} />}
        {(a.linkUrl || (isAdmin && onEdit)) && (
          <div className="ann-actions">
            {a.linkUrl && (
              <a className="btn btn-small ann-link" href={a.linkUrl} target="_blank" rel="noopener noreferrer">
                {a.linkLabel || 'open link'} <span aria-hidden="true">↗</span>
              </a>
            )}
            {isAdmin && onEdit && (
              <button className="btn btn-small btn-ghost ann-edit" onClick={() => onEdit(a.id)}>edit</button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
