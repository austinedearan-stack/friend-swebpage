import { useState } from 'react'
import { fill } from '../lib/content.js'
import { navigate, routeHash } from '../lib/router.js'
import { Arrow, Flower, Heart, PolaroidScene, Sparkle, Squiggle, Star } from './Doodles.jsx'
import { Pickle, Portal, Saucer } from './RickMorty.jsx'

export default function Welcome({ copy, vars, eggs, pick, toast, celebrate, greeting, page }) {
  const w = copy.welcome
  const [flipped, setFlipped] = useState(false)
  const [boops, setBoops] = useState(0)
  const [bubble, setBubble] = useState('')
  const [pokes, setPokes] = useState(0)
  const [pickleLine, setPickleLine] = useState('')

  const start = () => {
    // occasionally the button has something to say first
    if (Math.random() < 0.3) toast(pick('start', eggs.startSurprises))
    navigate(page, 'mood')
  }

  const boop = (e) => {
    setBoops((b) => b + 1)
    setBubble(pick('sticker', eggs.stickerLines))
    if ((boops + 1) % 5 === 0) {
      const r = e.currentTarget.getBoundingClientRect()
      celebrate(r.left + r.width / 2, r.top)
    }
  }

  const poke = (e) => {
    setPokes((p) => p + 1)
    setPickleLine(pick('pickle', eggs.pickleLines))
    if (pokes === 0) {
      const r = e.currentTarget.getBoundingClientRect()
      celebrate(r.left + r.width / 2, r.top)
    }
  }

  return (
    <section className="welcome section" aria-labelledby="greeting">
      <div className="welcome-copy">
        <p className="kicker">{fill(w.kicker, vars)}</p>
        <h1 id="greeting" className="greeting step-focus" tabIndex={-1} data-edit="type:heading">
          {greeting}
        </h1>
        <Squiggle className="doodle greeting-squiggle" />
        <p className="intro" data-edit="colors:text">{fill(w.intro, vars)}</p>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-big" onClick={start} data-edit="colors:buttonBg">
            {fill(w.startLabel, vars)} <span aria-hidden="true">→</span>
          </button>
          <a className="text-link" href={routeHash(page, 'tomorrow')}>
            {fill(w.tomorrowLinkLabel, vars)} <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className="collage" aria-label="a little scrapbook collage">
        <Portal className="doodle d-portal" size={104} />

        <button
          className={`polaroid ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-pressed={flipped}
          aria-label={flipped ? 'flip the photo back' : 'a polaroid photo. there might be something written on the back'}
          data-edit="deco:polaroids"
        >
          <span className="polaroid-inner">
            <span className="polaroid-front">
              <span className="tape tape-corner" aria-hidden="true" />
              <PolaroidScene />
              <span className="polaroid-caption hand">{fill(w.polaroidCaption, vars)}</span>
            </span>
            <span className="polaroid-back hand">{fill(eggs.polaroidBack, vars)}</span>
          </span>
        </button>

        <button className="sticker sticker-pickle" onClick={poke} aria-label="a pickle is peeking out. poke it?" data-edit="deco:stickers">
          <Pickle size={38} />
          {pickleLine && (
            <span className="speech speech-left hand" key={pokes} role="status">
              {pickleLine}
            </span>
          )}
        </button>

        <div className="sticky-note hand" data-edit="colors:surfaceAlt">
          <span className="tape tape-top" aria-hidden="true" />
          {fill(w.noteText, vars)}
        </div>

        <button className="sticker sticker-heart" onClick={boop} aria-label="a heart sticker. boop it?" data-edit="deco:stickers">
          <Heart size={58} />
          {bubble && (
            <span className="speech hand" key={boops} role="status">
              {bubble}
            </span>
          )}
        </button>

        <Star className="doodle d-star" size={30} />
        <Flower className="doodle d-flower" size={34} />
        <Saucer className="doodle d-saucer" size={74} />
        <Sparkle className="doodle d-sparkle" size={20} />
        <span className="doodle d-arrow-wrap" aria-hidden="true">
          <span className="hand arrow-label">{page === 'friends' ? 'yes, you' : 'this is for you'}</span>
          <Arrow className="d-arrow" />
        </span>
      </div>
    </section>
  )
}
