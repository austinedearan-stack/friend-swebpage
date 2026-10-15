import { useState } from 'react'
import { fill } from '../lib/content.js'

// "little extras" in personal mode; "Department of Friendly Roasting" in friend mode.
// Same component, different config buckets.
export default function Extras({ copy, vars, pick, mode }) {
  const x = copy.extras
  const [line, setLine] = useState(null)

  const press = (b) => setLine({ id: b.id, button: b.button, text: fill(pick(`x-${b.id}`, b.lines), vars), n: (line?.n || 0) + 1 })

  return (
    <section className={`section extras extras-${mode}`} aria-labelledby="extras-h">
      <h2 id="extras-h" className="section-title" data-edit="type:heading">{fill(x.heading, vars)}</h2>
      <p className="section-sub">{fill(x.intro, vars)}</p>
      <div className="extras-buttons">
        {x.buckets.map((b) => (
          <button key={b.id} className="btn btn-sticker" onClick={() => press(b)} aria-pressed={line?.id === b.id} data-edit="colors:accent2">
            {fill(b.button, vars)}
          </button>
        ))}
      </div>
      <div className="extras-out" aria-live="polite">
        {line ? (
          <p key={line.n} className={`extras-line card reveal ${mode === 'friend' ? 'is-memo' : ''}`}>
            <span className="extras-tag">{line.button}</span>
            {line.text}
          </p>
        ) : (
          <p className="extras-empty hand">(nothing here yet. press something.)</p>
        )}
      </div>
    </section>
  )
}
