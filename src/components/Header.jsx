import { useRef, useState } from 'react'
import { Heart } from './Doodles.jsx'

export default function Header({ title, eggs, celebrate, onOpenStudio, modeLabel, canSwitch, mode, modes, onSwitchMode }) {
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

        <div className="header-actions">
          {canSwitch ? (
            <div className="mode-switch" role="group" aria-label="choose a mode">
              {Object.entries(modes).map(([id, m]) => (
                <button key={id} className="chip" aria-pressed={mode === id} onClick={() => onSwitchMode(id)}>
                  {mode === id && <span aria-hidden="true">✓ </span>}
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="mode-badge" title="current mode">{modeLabel}</span>
          )}
          <button className="btn btn-studio" onClick={onOpenStudio} aria-haspopup="dialog">
            <span aria-hidden="true">🎨</span> make it yours
          </button>
        </div>
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
