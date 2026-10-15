import { useState } from 'react'
import { fill } from '../lib/content.js'
import { Heart } from './Doodles.jsx'

export default function Footer({ eggs, vars, pick }) {
  const [compliment, setCompliment] = useState('')
  return (
    <footer className="site-footer">
      <button className="link-btn compliment-btn" onClick={() => setCompliment(fill(pick('compliment', eggs.compliments), vars))}>
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
