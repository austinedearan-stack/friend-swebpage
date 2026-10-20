import { useState } from 'react'
import { CATEGORIES, CATEGORY_IDS, countdownParts, visibleAnnouncements } from '../lib/announcements.js'
import { PHOTOS, useNow } from '../lib/photos.js'
import AnnouncementCard from './AnnouncementCard.jsx'
import { Portal, Saucer } from './RickMorty.jsx'

function untilLabel(iso, now) {
  const c = countdownParts(iso, now)
  if (c.done) return 'now'
  if (c.days > 0) return `in ${c.days}d ${c.hours}h`
  if (c.hours > 0) return `in ${c.hours}h ${c.mins}m`
  return `in ${c.mins} min`
}

export default function AnnouncementsPage({ cfg, list, loading, status, isAdmin, onNew, onEdit }) {
  const now = useNow(30_000)
  const [filter, setFilter] = useState('all')
  const visible = visibleAnnouncements(list, { now, isAdmin })
  const counts = Object.fromEntries(CATEGORY_IDS.map((c) => [c, visible.filter((a) => a.category === c).length]))
  const shown = filter === 'all' ? visible : visible.filter((a) => a.category === filter)
  const pinned = shown.filter((a) => a.pinned)
  const rest = shown.filter((a) => !a.pinned)
  const nextEvent = visible
    .filter((a) => a.eventAt && Date.parse(a.eventAt) > now)
    .sort((a, b) => Date.parse(a.eventAt) - Date.parse(b.eventAt))[0]

  return (
    <div className="ann">
      <section className="ann-hero" aria-labelledby="ann-h">
        <img className="ann-hero-photo" src={PHOTOS['neon-red'].src} alt="" fetchpriority="high" />
        <div className="ann-hero-shade" aria-hidden="true" />
        <Portal className="ann-hero-portal" size={240} />
        <Saucer className="ann-hero-saucer" size={104} beam />
        <div className="ann-hero-copy">
          <p className="ann-kicker">{cfg.kicker}</p>
          <h1 id="ann-h" className="neon-title step-focus" tabIndex={-1}>{cfg.heading}</h1>
          <p className="ann-intro">{cfg.intro}</p>
          <ul className="ann-stats" aria-label="at a glance">
            <li><b>{visible.length}</b> {visible.length === 1 ? 'post' : 'posts'}</li>
            <li><b>{visible.filter((a) => a.pinned).length}</b> pinned</li>
            {nextEvent && <li>next event <b>{untilLabel(nextEvent.eventAt, now)}</b></li>}
          </ul>
        </div>
      </section>

      {status === 'offline' && (
        <p className="ann-status" role="status">couldn't reach the notice board just now, so this is the last copy we saw.</p>
      )}

      <div className="ann-toolbar">
        <div className="ann-filters" role="group" aria-label="filter announcements">
          <button className="ann-filter" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            all <span className="ann-count">{visible.length}</span>
          </button>
          {CATEGORY_IDS.filter((c) => counts[c] || filter === c).map((c) => (
            <button key={c} className={`ann-filter cat-${c}`} aria-pressed={filter === c} onClick={() => setFilter(c)}>
              <i className="ann-dot" aria-hidden="true" />
              {CATEGORIES[c].label} <span className="ann-count">{counts[c]}</span>
            </button>
          ))}
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-small" onClick={onNew}>+ new announcement</button>
        )}
      </div>

      {loading ? (
        <div className="ann-grid" aria-busy="true" aria-label="loading announcements">
          {[0, 1, 2].map((i) => <div key={i} className="ann-card ann-skeleton" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="ann-empty">
          <img src={PHOTOS.balcony.src} alt="" loading="lazy" />
          <p>{filter === 'all' ? cfg.emptyText : `nothing in “${CATEGORIES[filter].label}” right now.`}</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="ann-pinned">
              {pinned.map((a) => <AnnouncementCard key={a.id} a={a} featured isAdmin={isAdmin} onEdit={onEdit} now={now} />)}
            </div>
          )}
          {rest.length > 0 && (
            <div className="ann-grid">
              {rest.map((a) => <AnnouncementCard key={a.id} a={a} isAdmin={isAdmin} onEdit={onEdit} now={now} />)}
            </div>
          )}
          <div className="ann-end">
            <figure className="ann-end-photo">
              <img src={PHOTOS['too-late'].src} alt="a handwritten sign: if you're reading this it's too late" loading="lazy" />
            </figure>
            <p className="ann-end-text">{cfg.caughtUp}</p>
          </div>
        </>
      )}
    </div>
  )
}
