// Toast messages + a tiny DOM confetti burst (skipped entirely in reduced motion via CSS).
const COLORS = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)', 'var(--deco)', 'var(--surface-alt)']

export function Toasts({ toasts }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>{t.text}</div>
      ))}
    </div>
  )
}

export function Confetti({ bursts }) {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {bursts.map((b) => (
        <span key={b.id} className="burst" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 18 }, (_, i) => {
            const angle = (i / 18) * Math.PI * 2
            const dist = 60 + ((i * 37) % 50)
            return (
              <i
                key={i}
                style={{
                  '--dx': `${Math.cos(angle) * dist}px`,
                  '--dy': `${Math.sin(angle) * dist - 30}px`,
                  '--rot': `${(i * 47) % 360}deg`,
                  background: COLORS[i % COLORS.length],
                  borderRadius: i % 3 === 0 ? '50%' : '2px',
                }}
              />
            )
          })}
        </span>
      ))}
    </div>
  )
}
