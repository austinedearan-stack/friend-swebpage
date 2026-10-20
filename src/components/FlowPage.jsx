import { useEffect, useRef } from 'react'
import { STEPS, routeHash } from '../lib/router.js'
import Welcome from './Welcome.jsx'
import CheckIn from './CheckIn.jsx'
import Tomorrow from './Tomorrow.jsx'
import Extras from './Extras.jsx'
import Rps from './Rps.jsx'

// The check-in and friends pages: the same five steps, one at a time, with a
// progress bar and next/back buttons. Every step stays mounted (just hidden) so
// answers survive going back and forth. The step lives in the URL, so the
// browser's back button works too.
export default function FlowPage({ page, step, mode, shared, greeting }) {
  const idx = Math.max(0, STEPS.indexOf(step))
  // slide direction only changes when the step does (so other re-renders can't replay the animation)
  const lastIdx = useRef(idx)
  const dir = useRef('fwd')
  if (idx !== lastIdx.current) {
    dir.current = idx > lastIdx.current ? 'fwd' : 'back'
    lastIdx.current = idx
  }
  const root = useRef(null)
  const mounted = useRef(false)

  const labels = { hello: 'hello', mood: 'check-in', tomorrow: 'tomorrow', extras: mode === 'friend' ? 'roasts' : 'extras', game: 'game' }

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    // keep the new step in view and move keyboard/screen-reader focus to its heading
    const top = root.current.getBoundingClientRect().top + window.scrollY - 10
    if (window.scrollY > top) window.scrollTo({ top, behavior: document.documentElement.dataset.motion === 'reduced' ? 'auto' : 'smooth' })
    root.current.querySelector(`[data-step="${STEPS[idx]}"] .step-focus`)?.focus({ preventScroll: true })
  }, [idx])

  const prev = STEPS[idx - 1]
  const next = STEPS[idx + 1]

  return (
    <div className="flow" ref={root} data-dir={dir.current}>
      <nav className="stepper" aria-label="steps">
        <ol>
          {STEPS.map((s, i) => (
            <li key={s} className={i < idx ? 'is-done' : i === idx ? 'is-current' : ''}>
              <a href={routeHash(page, s)} aria-current={i === idx ? 'step' : undefined}>
                <span className="step-dot" aria-hidden="true">{i < idx ? '✓' : i + 1}</span>
                <span className="step-label">{labels[s]}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className="stepper-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${idx / (STEPS.length - 1)})` }} />
        </div>
      </nav>

      <div className="flow-steps">
        <div className="flow-step" data-step="hello" hidden={idx !== 0}>
          <Welcome {...shared} page={page} greeting={greeting} />
        </div>
        <div className="flow-step" data-step="mood" hidden={idx !== 1}>
          <CheckIn {...shared} />
        </div>
        <div className="flow-step" data-step="tomorrow" hidden={idx !== 2}>
          <Tomorrow {...shared} />
        </div>
        <div className="flow-step" data-step="extras" hidden={idx !== 3}>
          <Extras {...shared} mode={mode} />
        </div>
        <div className="flow-step" data-step="game" hidden={idx !== 4}>
          <Rps {...shared} />
        </div>
      </div>

      {idx > 0 && (
        <div className="flow-nav">
          <a className="btn btn-ghost flow-prev" href={routeHash(page, prev)}>
            <span aria-hidden="true">←</span> {labels[prev]}
          </a>
          {next ? (
            <a className="btn btn-primary flow-next" href={routeHash(page, next)}>
              next: {labels[next]} <span aria-hidden="true">→</span>
            </a>
          ) : (
            <a className="btn btn-primary flow-next" href={routeHash(page, 'hello')}>
              <span aria-hidden="true">↺</span> back to the start
            </a>
          )}
        </div>
      )}
    </div>
  )
}
