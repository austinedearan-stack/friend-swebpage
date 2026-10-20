import { useState } from 'react'
import { fill } from '../lib/content.js'
import { Heart } from './Doodles.jsx'

export default function Footer({ eggs, vars, pick, toast }) {
  const [compliment, setCompliment] = useState('')
  const [asks, setAsks] = useState(0)
  const ask = () => {
    setCompliment(fill(pick('compliment', eggs.compliments), vars))
    setAsks((n) => n + 1)
    if ((asks + 1) % 6 === 0) toast('wubba lubba dub dub! (that means you asked a lot.)')
  }
  return (
    <footer className="site-footer">
      <button className="link-btn compliment-btn" onClick={ask}>
        need a random compliment?
      </button>
      <p className="compliment hand" aria-live="polite">{compliment}</p>
      <p className="footer-note">
        <Heart size={16} /> {fill(eggs.footer, vars)}
      </p>
      {/* lets you check a phone has the newest version (set at build time) */}
      <p className="build-stamp">
        updated {new Date(__BUILD_TIME__).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>
    </footer>
  )
}
