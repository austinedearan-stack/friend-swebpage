import { useRef, useState } from 'react'
import { fill } from '../lib/content.js'
import ResponseCard from './ResponseCard.jsx'
import { Heart, Sparkle } from './Doodles.jsx'
import { PortalGun } from './RickMorty.jsx'

export default function Tomorrow({ copy, vars, pick, celebrate }) {
  const t = copy.tomorrow
  const [answer, setAnswer] = useState(null)
  const [zap, setZap] = useState(false)
  const zapTimer = useRef()

  const choose = (opt, e) => {
    setAnswer({ id: opt.id, label: opt.label, text: fill(pick(`tmr-${opt.id}`, opt.responses), vars), n: (answer?.n || 0) + 1 })
    setZap(true)
    clearTimeout(zapTimer.current)
    zapTimer.current = setTimeout(() => setZap(false), 700)
    if (opt.celebrate) {
      const r = e.currentTarget.getBoundingClientRect()
      celebrate(r.left + r.width / 2, r.top)
    }
  }

  return (
    <section id="tomorrow" className="section tomorrow" aria-labelledby="tomorrow-h">
      <div className="tomorrow-card card" data-edit="colors:surface">
        <span className="tape tape-top" aria-hidden="true" />
        <PortalGun className="doodle tomorrow-gun" size={78} zapping={zap} />
        <h2 id="tomorrow-h" className="section-title step-focus" tabIndex={-1} data-edit="type:heading">{fill(t.heading, vars)}</h2>
        <p className="section-sub stamp-note">
          <Sparkle size={16} /> {fill(t.note, vars)}
        </p>

        <div className="choice-list" role="group" aria-labelledby="tomorrow-h">
          {t.options.map((o) => {
            const on = answer?.id === o.id
            return (
              <button
                key={o.id}
                className={`choice ${on ? 'is-selected' : ''}`}
                aria-pressed={on}
                onClick={(e) => choose(o, e)}
                data-edit="colors:accent"
              >
                <span className="choice-box" aria-hidden="true">{on ? '✓' : ''}</span>
                {fill(o.label, vars)}
              </button>
            )
          })}
        </div>

        <div aria-live="polite">
          {answer && (
            <ResponseCard key={`${answer.id}-${answer.n}`} title={fill(answer.label, vars)}>
              <p>{answer.text}</p>
            </ResponseCard>
          )}
        </div>
      </div>

      {answer && (
        <div className="closing card reveal" data-edit="colors:surfaceAlt">
          <Heart size={30} className="closing-heart" />
          <h3 className="closing-title hand">{fill(t.closingTitle, vars)}</h3>
          <p>{fill(t.closingMessage, vars)}</p>
          <p className="signoff hand">{fill(t.signoff, vars)}</p>
        </div>
      )}
    </section>
  )
}
