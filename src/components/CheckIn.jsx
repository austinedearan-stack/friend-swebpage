import { useRef, useState } from 'react'
import { fill } from '../lib/content.js'
import { MoodIcon } from './Doodles.jsx'
import { BlueHelper } from './RickMorty.jsx'
import ResponseCard from './ResponseCard.jsx'

export default function CheckIn({ copy, vars, eggs, pick }) {
  const c = copy.checkin
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState(null)
  const counts = useRef({})
  const groupRef = useRef(null)

  const choose = (mood) => {
    const n = (counts.current[mood.id] || 0) + 1
    counts.current[mood.id] = n
    setSelected(mood.id)
    setReply({
      key: `${mood.id}-${n}`,
      text: fill(pick(`mood-${mood.id}`, mood.responses), vars),
      extra: n >= 3 ? fill(eggs.repeatPick, { ...vars, count: n }) : null,
      helper: pick('helper', eggs.helperLines),
    })
  }

  const change = () => {
    setSelected(null)
    setReply(null)
    groupRef.current?.querySelector('.mood-card')?.focus()
  }

  // arrow-key navigation inside the radio group
  const onKeyDown = (e, i) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!dir) return
    e.preventDefault()
    const cards = groupRef.current.querySelectorAll('.mood-card')
    cards[(i + dir + cards.length) % cards.length].focus()
  }

  const current = c.moods.find((m) => m.id === selected)

  return (
    <section id="checkin" className="section checkin" aria-labelledby="checkin-h">
      <div className="section-head">
        <div>
          <h2 id="checkin-h" className="section-title step-focus" tabIndex={-1} data-edit="type:heading">{fill(c.heading, vars)}</h2>
          <p className="section-sub">{fill(c.subheading, vars)}</p>
        </div>
        <div className={`helper-wrap ${reply ? 'is-up' : ''}`} aria-hidden="true">
          {reply && <span className="speech speech-helper hand" key={reply.key}>{reply.helper}</span>}
          <BlueHelper size={58} className="doodle-helper" key={reply?.key || 'idle'} />
        </div>
      </div>

      <div className="mood-grid" role="radiogroup" aria-labelledby="checkin-h" ref={groupRef}>
        {c.moods.map((m, i) => {
          const on = selected === m.id
          return (
            <button
              key={m.id}
              role="radio"
              aria-checked={on}
              tabIndex={selected ? (on ? 0 : -1) : i === 0 ? 0 : -1}
              className={`mood-card card ${on ? 'is-selected' : ''} ${selected && !on ? 'is-dimmed' : ''}`}
              style={{ '--i': i }}
              onClick={() => choose(m)}
              onKeyDown={(e) => onKeyDown(e, i)}
              data-edit="colors:surface"
            >
              {on && <span className="selected-badge" aria-hidden="true">✓ picked</span>}
              <MoodIcon name={m.icon} />
              <span className="mood-label">{fill(m.label, vars)}</span>
              <span className="mood-desc">{fill(m.description, vars)}</span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {reply && current && (
          <ResponseCard key={reply.key} title={fill(current.label, vars)} icon={current.icon}>
            <p>{reply.text}</p>
            {reply.extra && <p className="aside hand">{reply.extra}</p>}
            <div className="response-actions">
              <button className="btn btn-ghost btn-small" onClick={() => choose(current)}>say something else</button>
              <button className="link-btn" onClick={change}>{fill(c.changeLabel, vars)}</button>
            </div>
          </ResponseCard>
        )}
      </div>
    </section>
  )
}
