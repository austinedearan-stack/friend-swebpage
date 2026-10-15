import { useState } from 'react'
import { fill } from '../lib/content.js'
import { randInt } from '../lib/util.js'

const MOVES = [
  { id: 'rock', label: 'Rock', emoji: '✊' },
  { id: 'paper', label: 'Paper', emoji: '✋' },
  { id: 'scissors', label: 'Scissors', emoji: '✌️' },
]
const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' }

export function outcome(you, me) {
  if (you === me) return 'draw'
  return BEATS[you] === me ? 'win' : 'lose'
}

const emptyScore = { you: 0, me: 0, draws: 0 }

export default function Rps({ copy, vars, pick, celebrate }) {
  const r = copy.rps
  const [score, setScore] = useState(emptyScore)
  const [round, setRound] = useState(null)
  const [bestOf3, setBestOf3] = useState(false)
  const [match, setMatch] = useState(null) // 'win' | 'lose' when a best-of-three ends

  const play = (move, e) => {
    if (match) return
    const me = MOVES[randInt(3)].id
    const res = outcome(move, me)
    const next = {
      you: score.you + (res === 'win'),
      me: score.me + (res === 'lose'),
      draws: score.draws + (res === 'draw'),
    }
    setScore(next)
    setRound({ you: move, me, res, text: fill(pick(`rps-${res}`, r[res]), vars), n: (round?.n || 0) + 1 })
    if (bestOf3 && (next.you === 2 || next.me === 2)) {
      const m = next.you === 2 ? 'win' : 'lose'
      setMatch(m)
      if (m === 'win') {
        const b = e.currentTarget.getBoundingClientRect()
        celebrate(b.left + b.width / 2, b.top)
      }
    }
  }

  const reset = () => {
    setScore(emptyScore)
    setRound(null)
    setMatch(null)
  }

  const toggleFormat = () => {
    setBestOf3((b) => !b)
    reset()
  }

  const moveOf = (id) => MOVES.find((m) => m.id === id)
  const verdict = { win: 'you win', lose: 'i win', draw: 'draw' }

  return (
    <section id="game" className="section rps" aria-labelledby="rps-h">
      <div className="rps-card card" data-edit="colors:surface">
        <span className="tape tape-top" aria-hidden="true" />
        <h2 id="rps-h" className="section-title" data-edit="type:heading">{fill(r.heading, vars)}</h2>
        <p className="section-sub">{fill(r.intro, vars)}</p>

        <div className="rps-top">
          <label className="toggle">
            <input type="checkbox" checked={bestOf3} onChange={toggleFormat} />
            <span className="toggle-ui" aria-hidden="true" />
            best of three
          </label>
          <div className="scoreboard" aria-label={`score: you ${score.you}, me ${score.me}, draws ${score.draws}`}>
            <span><b>{score.you}</b> you</span>
            <span><b>{score.me}</b> me</span>
            <span><b>{score.draws}</b> draws</span>
          </div>
        </div>

        <div className="rps-moves" role="group" aria-label="choose your move">
          {MOVES.map((m) => (
            <button key={m.id} className="rps-move" onClick={(e) => play(m.id, e)} disabled={!!match} data-edit="colors:buttonBg">
              <span className="rps-emoji" aria-hidden="true">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        <div className="rps-result" aria-live="polite">
          {round ? (
            <div key={round.n} className={`rps-round is-${round.res}`}>
              <div className="rps-faceoff" aria-hidden="true">
                <span className="hand-you">{moveOf(round.you).emoji}</span>
                <span className="vs hand">vs</span>
                <span className="hand-me">{moveOf(round.me).emoji}</span>
              </div>
              <p className="rps-verdict">
                <span className="sr-only">
                  You picked {round.you}, I picked {round.me}.{' '}
                </span>
                <b className={`verdict-pill is-${round.res}`}>{verdict[round.res]}</b> {round.text}
              </p>
            </div>
          ) : (
            <p className="rps-waiting hand">waiting for your move…</p>
          )}
          {match && (
            <p className={`rps-match reveal is-${match}`}>
              <b>{match === 'win' ? '🏆 ' : '🫠 '}</b>
              {fill(match === 'win' ? r.matchWin : r.matchLose, vars)}
            </p>
          )}
        </div>

        <button className="btn btn-ghost btn-small" onClick={reset}>
          {match ? 'play again' : 'reset score'}
        </button>
      </div>
    </section>
  )
}
