import { useRef, useState } from 'react'
import { Heart } from './Doodles.jsx'
import { FriendsIcon, HeartIcon, MegaphoneIcon } from './RickMorty.jsx'
import { routeHash } from '../lib/router.js'

const ICONS = { checkin: HeartIcon, friends: FriendsIcon, announcements: MegaphoneIcon }

export default function Header({ title, eggs, celebrate, onOpenStudio, studioLabel, navItems, page }) {
  const [clicks, setClicks] = useState(0)
  const [secret, setSecret] = useState(false)
  const [wiggle, setWiggle] = useState(0)
  const resetTimer = useRef()

  const onTitle = (e) => {
    const n = clicks + 1
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setClicks(0), 2500)
    setWiggle((w) => w + 1)
    if (n >= eggs.titleClicks) {
      setClicks(0)
      setSecret(true)
      const r = e.currentTarget.getBoundingClientRect()
      celebrate(r.left + r.width / 2, r.bottom)
    } else setClicks(n)
  }

  return (
    <header className="site-header" data-edit="colors:bg">
      <div className="header-inner">
        <button
          className={`site-title ${wiggle ? 'wiggle' : ''}`}
          key={wiggle}
          onClick={onTitle}
          aria-label={`${title}. (psst, try clicking me a few times)`}
          data-edit="type:heading"
        >
          <Heart size={22} className="title-heart" />
          <span>{title}</span>
        </button>

        {navItems.length > 1 && (
          <nav className="site-nav" aria-label="pages">
            <ul>
              {navItems.map((it) => {
                const Icon = ICONS[it.id]
                const on = it.id === page
                return (
                  <li key={it.id}>
                    <a href={routeHash(it.id)} className={`nav-tab ${on ? 'is-active' : ''}`} aria-current={on ? 'page' : undefined}>
                      <Icon />
                      <span className="nav-label">{it.label}</span>
                      {it.flag && <span className="nav-flag" title={`admin only: ${it.flag}`}>{it.flag}</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        {studioLabel && (
          <button className="btn btn-studio" onClick={onOpenStudio} aria-haspopup="dialog">
            <span aria-hidden="true">{studioLabel === 'admin' ? '⚙' : '🎨'}</span> <span className="studio-label">{studioLabel}</span>
          </button>
        )}
      </div>

      {secret && (
        <div className="secret-note card pop-in" role="status">
          <span className="tape tape-top" aria-hidden="true" />
          <p className="hand">{eggs.titleSecret}</p>
          <button className="link-btn" onClick={() => setSecret(false)}>ok, hide it</button>
        </div>
      )}
    </header>
  )
}
