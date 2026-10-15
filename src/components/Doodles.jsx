// Hand-drawn style inline SVGs. All use currentColor / CSS vars so themes recolour them.

const S = { stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
const L = { ...S, fill: 'none' } // open lines (no fill)

export function Heart({ size = 28, filled = true, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      <path d="M16 27.5C6.5 21 3.6 15.4 5.2 10.6c1.7-4.9 7.8-5.6 10.6-1.2 2.9-4.6 9.1-3.6 10.8 1.3 1.6 4.7-1.5 10.4-10.6 16.8z"
        fill={filled ? 'var(--accent)' : 'none'} {...S} strokeWidth={1.8} />
      <path d="M9.5 11.5c.6-1.4 1.8-2 3-1.8" {...L} strokeWidth={1.4} opacity=".6" />
    </svg>
  )
}

export function Star({ size = 28, className = '', fill = 'var(--accent-2)', ...rest }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      <path d="M16 3.8l3.3 7.6 8.1.7-6.2 5.4 1.9 8.1L16 21.3l-7.1 4.3 1.9-8.1-6.2-5.4 8.1-.7z" fill={fill} {...S} strokeWidth={1.8} />
    </svg>
  )
}

export function Flower({ size = 32, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="20" cy="11" rx="5.5" ry="7.5" transform={`rotate(${r} 20 20)`} fill="var(--surface-alt)" {...S} strokeWidth={1.6} />
      ))}
      <circle cx="20" cy="20" r="4.2" fill="var(--accent)" {...S} strokeWidth={1.6} />
    </svg>
  )
}

export function Cloud({ size = 48, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 64 40" width={size} height={(size * 40) / 64} className={className} aria-hidden="true" {...rest}>
      <path d="M14 33c-6 0-9.5-4-9-8.6.5-4.3 4.6-6.8 8.7-5.8 1.2-6.6 7.6-10.2 13.8-8 3-5.5 11.8-6 15.7.1 6.4-1.4 11.5 3.6 10.4 9.8 4.8 1.1 6.5 5.6 4.5 9-1.4 2.4-3.6 3.5-6.6 3.5z"
        fill="var(--surface)" {...S} strokeWidth={1.8} />
    </svg>
  )
}

export function Arrow({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 90 50" width="90" height="50" className={className} aria-hidden="true" {...rest}>
      <path d="M4 10c12 26 38 36 70 26" {...L} />
      <path d="M64 28l11 8-12 5" {...L} />
    </svg>
  )
}

export function Squiggle({ className = '', ...rest }) {
  return (
    <svg viewBox="0 0 120 14" width="120" height="14" className={className} aria-hidden="true" preserveAspectRatio="none" {...rest}>
      <path d="M2 8c8-7 14 5 22 0s14-6 22 0 14 5 22 0 14-6 22 0 14 5 22 0" {...L} />
    </svg>
  )
}

export function Sparkle({ size = 22, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" {...rest}>
      <path d="M12 2.5c.7 5 2.5 8 9.5 9.5-7 1.5-8.8 4.5-9.5 9.5-.7-5-2.5-8-9.5-9.5 7-1.5 8.8-4.5 9.5-9.5z" fill="var(--deco)" stroke="none" />
    </svg>
  )
}

// ---- mood icons (chosen by id from config; ids are whitelisted) ----
const MOOD_PATHS = {
  sun: (
    <>
      <circle cx="24" cy="24" r="8.5" fill="#FFD98A" {...S} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
        <path key={r} d="M24 6.5v5" transform={`rotate(${r} 24 24)`} {...L} />
      ))}
      <path d="M20.5 25.5c1.5 2 5.5 2 7 0" {...L} strokeWidth={1.8} />
    </>
  ),
  cloud: (
    <>
      <path d="M12 34c-4.5 0-7-3-6.6-6.3.4-3.1 3.4-4.9 6.4-4.2 1-5 5.8-7.6 10.4-6 2.3-4 8.8-4.4 11.6.2 4.8-1 8.6 2.7 7.8 7.3 3.6.9 4.8 4.2 3.3 6.8-1 1.7-2.6 2.2-4.9 2.2z" fill="#E6E9F2" {...S} />
      <path d="M19 28.5h0M29 28.5h0" {...L} strokeWidth={3} />
      <path d="M21.5 32h6" {...L} strokeWidth={1.8} />
    </>
  ),
  battery: (
    <>
      <rect x="6" y="15" width="32" height="18" rx="4" fill="var(--surface)" {...S} />
      <path d="M38 21v6" {...L} strokeWidth={3.4} />
      <rect x="9.5" y="18.5" width="5" height="11" rx="1.5" fill="#E8836B" stroke="none" />
      <path d="M26 11l-3 7h5l-3 7" {...L} strokeWidth={1.8} />
    </>
  ),
  storm: (
    <>
      <path d="M8 12c10-4 26-4 32 0M11 19c8-3 20-3 26 0M14 26c6-2.4 14-2.4 19 0M18 32.5c4-1.6 8-1.6 11 0M22 38c2-.8 3-.8 4 0" {...L} />
      <circle cx="37" cy="9" r="2" fill="var(--accent)" stroke="none" />
      <path d="M8 34l2 2M41 30l-2 3" {...L} strokeWidth={1.6} />
    </>
  ),
  heart: <path d="M24 40C11 31 7 23.5 9.2 17c2.3-6.6 10.5-7.5 14.4-1.6 3.9-6.2 12.3-4.9 14.6 1.8 2.2 6.3-2 14-14.2 22.8z" fill="var(--accent)" {...S} />,
  star: <path d="M24 5.5l4.6 10.6 11.3 1-8.6 7.5 2.6 11.2L24 30l-9.9 5.8 2.6-11.2-8.6-7.5 11.3-1z" fill="#FFD98A" {...S} />,
  flower: (
    <>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="24" cy="13" rx="6" ry="8.5" transform={`rotate(${r} 24 24)`} fill="var(--surface-alt)" {...S} strokeWidth={1.8} />
      ))}
      <circle cx="24" cy="24" r="5" fill="#FFD98A" {...S} strokeWidth={1.8} />
    </>
  ),
  coffee: (
    <>
      <path d="M9 18h24v10c0 6-5 10-12 10S9 34 9 28z" fill="var(--surface-alt)" {...S} />
      <path d="M33 21c5 0 6 7 0 8" {...L} />
      <path d="M16 6c-2 3 2 4 0 8M22 5c-2 3 2 4 0 8M28 6c-2 3 2 4 0 8" {...L} strokeWidth={1.7} />
    </>
  ),
  moon: <path d="M31 6c-9 1.5-15 9-14 18 1 8.5 9 15 18 13.5-3.4 3-8 4.6-12.8 4.1C12 40.6 4.5 31.6 5.4 21.4 6.3 11.2 15.3 3.7 25.5 4.6c2 .2 3.8.6 5.5 1.4z" fill="#FFE7A3" {...S} />,
  sparkle: <path d="M24 4c1.2 9 4.6 14.2 16 16-11.4 1.8-14.8 7-16 16-1.2-9-4.6-14.2-16-16 11.4-1.8 14.8-7 16-16z" fill="var(--accent-2)" {...S} />,
}

export function MoodIcon({ name, size = 52 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className="mood-icon">
      {MOOD_PATHS[name] || MOOD_PATHS.heart}
    </svg>
  )
}

/** The "photo" inside the hero polaroid: a little drawn sunset scene, no image files. */
export function PolaroidScene() {
  return (
    <svg viewBox="0 0 160 130" className="polaroid-scene" aria-hidden="true">
      <rect width="160" height="130" fill="var(--accent-2)" />
      <circle cx="112" cy="58" r="22" fill="#FFD98A" opacity=".9" />
      <path d="M0 92c26-14 50-14 76-4s52 8 84-8v50H0z" fill="var(--accent-3)" />
      <path d="M0 106c30-10 56-6 86 2s48 2 74-6v28H0z" fill="var(--surface-alt)" />
      <path d="M28 40c3-3 7-3 9 0 3-3 7-2 8 1" fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M48 28c2-2 5-2 6 0 2-2 5-1 5 1" fill="none" stroke="var(--text)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M70 92c0-14 6-22 10-22s10 8 10 22" fill="var(--accent)" stroke="var(--text)" strokeWidth="1.6" />
      <circle cx="80" cy="64" r="7" fill="var(--surface)" stroke="var(--text)" strokeWidth="1.6" />
    </svg>
  )
}
