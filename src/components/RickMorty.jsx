// Rick & Morty-flavoured doodles, drawn from scratch in the same sketchy style as
// Doodles.jsx (outlines use currentColor so every theme recolours them).
// Animation classes only run when decorative animation is on (see rm.css).
import { useId } from 'react'

const S = { stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }

function spiral(turns, reach, offset) {
  let d = ''
  for (let i = 0; i <= 140; i++) {
    const t = i / 140
    const a = offset + t * turns * Math.PI * 2
    const r = 2 + t * reach
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a) * 0.94).toFixed(1)}`
  }
  return d
}
const SPIRAL_A = spiral(2.3, 37, 0)
const SPIRAL_B = spiral(2.3, 37, Math.PI)
const RIM = 'M50 5C73 4 95 24 95 50 96 75 74 96 50 95 26 96 4 76 5 50 4 26 27 6 50 5z'

/** The green swirl. */
export function Portal({ size = 80, spin = true, className = '', ...rest }) {
  const gid = `rmp${useId().replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`rm rm-portal ${className}`} aria-hidden="true" {...rest}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="52%">
          <stop offset="0" stopColor="#F6FFC4" />
          <stop offset=".3" stopColor="#C2F25E" />
          <stop offset=".72" stopColor="#5DC43B" />
          <stop offset="1" stopColor="#2E8A29" />
        </radialGradient>
      </defs>
      <path d={RIM} fill={`url(#${gid})`} {...S} />
      <g className={spin ? 'rm-spin' : ''}>
        <path d={SPIRAL_A} fill="none" stroke="#2A7A22" strokeWidth="3.2" strokeLinecap="round" opacity=".7" />
        <path d={SPIRAL_B} fill="none" stroke="#EBFFA6" strokeWidth="2.2" strokeLinecap="round" opacity=".85" />
        <circle cx="20" cy="30" r="2.4" fill="#EBFFA6" />
        <circle cx="80" cy="66" r="2" fill="#EBFFA6" />
        <circle cx="64" cy="16" r="1.6" fill="#EBFFA6" />
        <circle cx="30" cy="82" r="1.8" fill="#EBFFA6" />
      </g>
    </svg>
  )
}

/** A wobbly little flying saucer. */
export function Saucer({ size = 90, beam = false, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 120 92" width={size} height={(size * 92) / 120} className={`rm rm-saucer ${className}`} aria-hidden="true" {...rest}>
      {beam && <path className="rm-beam" d="M44 46 26 92h68L76 46z" fill="#D8FF8A" opacity=".32" />}
      <path d="M38 33c0-12 10-21 22-21s22 9 22 21" fill="#BDE7F6" {...S} />
      <path d="M48 20c3-3 7-4 10-4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
      <ellipse cx="60" cy="38" rx="53" ry="12" fill="#C9CDD8" {...S} />
      <ellipse cx="60" cy="42" rx="34" ry="6" fill="#9AA1B0" {...S} strokeWidth={1.6} />
      <g className="rm-lights">
        {[18, 36, 60, 84, 102].map((x, i) => (
          <circle key={x} cx={x} cy={i === 0 || i === 4 ? 37 : 34} r="3" fill="#FFE07A" stroke="currentColor" strokeWidth="1.2" style={{ '--d': `${i * 0.18}s` }} />
        ))}
      </g>
    </svg>
  )
}

/** Portal gun. `zapping` shows a beam out of the nozzle. */
export function PortalGun({ size = 84, zapping = false, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 110 70" width={size} height={(size * 70) / 110} className={`rm rm-gun ${zapping ? 'is-zapping' : ''} ${className}`} aria-hidden="true" {...rest}>
      <path className="rm-zap" d="M92 36h6l-4 5h7l-6 6h8" fill="none" stroke="#9BEA4E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 44v18c0 3 2 5 5 5h7c3 0 4-2 4-5V44z" fill="#D9D9D0" {...S} />
      <rect x="8" y="24" width="64" height="22" rx="9" fill="#F3F3EC" {...S} />
      <path d="M72 28l14 4v8l-14 4z" fill="#E6E6DD" {...S} />
      <circle cx="89" cy="36" r="5" fill="#9BEA4E" {...S} strokeWidth={1.8} />
      <rect x="28" y="7" width="28" height="17" rx="7" fill="#A6EE58" {...S} />
      <path d="M33 13h7M45 18h5" stroke="#E9FFB8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="35" r="4" fill="#FF6464" {...S} strokeWidth={1.6} />
      <path d="M44 35h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

/** A tall, very eager blue helper. Exists to help. */
export function BlueHelper({ size = 70, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 80 124" width={size} height={(size * 124) / 80} className={`rm rm-helper ${className}`} aria-hidden="true" {...rest}>
      {/* arms: a dark stroke under a slightly thinner blue one reads as an outlined limb */}
      <g className="rm-arm-l">
        <path d="M28 58 13 35l-5-13" fill="none" {...S} strokeWidth={7.4} />
        <path d="M28 58 13 35l-5-13" fill="none" {...S} stroke="#8AD3F5" strokeWidth={4} />
      </g>
      <g className="rm-arm-r">
        <path d="M52 58l15-23 5-13" fill="none" {...S} strokeWidth={7.4} />
        <path d="M52 58l15-23 5-13" fill="none" {...S} stroke="#8AD3F5" strokeWidth={4} />
      </g>
      <path d="M26 56c-1 14-1 30 2 44l-4 18h10l5-16 5 16h10l-4-18c3-14 3-30 2-44z" fill="#8AD3F5" {...S} />
      <ellipse cx="40" cy="33" rx="21" ry="23" fill="#8AD3F5" {...S} />
      <path d="M26 20c4-4 9-5 13-3" fill="none" stroke="#C9EEFF" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="30" rx="6" ry="7" fill="#fff" {...S} strokeWidth={1.6} />
      <ellipse cx="48" cy="30" rx="6" ry="7" fill="#fff" {...S} strokeWidth={1.6} />
      <circle className="rm-pupil" cx="33" cy="31" r="2.2" fill="currentColor" />
      <circle className="rm-pupil" cx="47" cy="31" r="2.2" fill="currentColor" />
      <ellipse cx="40" cy="46" rx="7" ry="5" fill="#3B2A35" {...S} strokeWidth={1.6} />
      <path d="M36 48c2 1 6 1 8 0" stroke="#FF8FA3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** A pickle with opinions. */
export function Pickle({ size = 46, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 60 104" width={size} height={(size * 104) / 60} className={`rm rm-pickle ${className}`} aria-hidden="true" {...rest}>
      <path d="M30 4c14 0 24 14 24 44 0 32-9 52-24 52S6 80 6 48C6 18 16 4 30 4z" fill="#82C341" {...S} />
      <path d="M17 24c2-4 5-7 9-8" fill="none" stroke="#C6EC8E" strokeWidth="3" strokeLinecap="round" />
      {[[14, 62], [44, 70], [20, 84], [40, 44], [12, 44], [36, 88]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#5E9E2A" />
      ))}
      <path d="M15 26c5-3 25-3 30 0" fill="none" {...S} strokeWidth={2.6} />
      <ellipse cx="22" cy="34" rx="6" ry="6.5" fill="#fff" {...S} strokeWidth={1.6} />
      <ellipse cx="39" cy="34" rx="6" ry="6.5" fill="#fff" {...S} strokeWidth={1.6} />
      <circle className="rm-pupil" cx="23" cy="35" r="2.2" fill="currentColor" />
      <circle className="rm-pupil" cx="38" cy="35" r="2.2" fill="currentColor" />
      <path d="M18 48c6 8 19 8 25 0" fill="#3B2A35" {...S} strokeWidth={1.8} />
      <path d="M22 50h17" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

// ---------- small nav icons ----------

export function MegaphoneIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="nav-icon">
      <path d="M4 10v4c0 .6.4 1 1 1h2l8 4V5L7 9H5c-.6 0-1 .4-1 1z" fill="none" {...S} strokeWidth={1.9} />
      <path d="M7 15l1.5 4.5M18.5 9.5c1 1.4 1 3.6 0 5M20.8 7.5c2 2.6 2 6.4 0 9" fill="none" {...S} strokeWidth={1.9} />
    </svg>
  )
}

export function FriendsIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="nav-icon">
      <circle cx="8.5" cy="8.5" r="3.2" fill="none" {...S} strokeWidth={1.9} />
      <circle cx="16.5" cy="9.5" r="2.6" fill="none" {...S} strokeWidth={1.9} />
      <path d="M2.8 19c.7-3.4 3-5.2 5.7-5.2s5 1.8 5.7 5.2M14.5 14.2c.6-.2 1.3-.3 2-.3 2.3 0 4.2 1.5 4.8 4.4" fill="none" {...S} strokeWidth={1.9} />
    </svg>
  )
}

export function HeartIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="nav-icon">
      <path d="M12 20.5C4.8 15.6 2.6 11.4 3.8 7.8c1.3-3.7 5.9-4.2 8-.9 2.2-3.5 6.8-2.7 8.1 1 1.2 3.5-1.1 7.8-7.9 12.6z" fill="none" {...S} strokeWidth={1.9} />
    </svg>
  )
}
