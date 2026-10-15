// Turns a (sanitized) theme object into CSS custom properties on <html>.
// All values here are already validated hex colours / clamped numbers / whitelisted ids.
import { FONTS, fontScale } from '../config/themes.js'

const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function patternCss(pattern, color) {
  const c = hexA(color, 0.16)
  const enc = encodeURIComponent(color)
  switch (pattern) {
    case 'dots':
      return { img: `radial-gradient(${c} 1.4px, transparent 1.6px)`, size: '22px 22px' }
    case 'grid':
      return { img: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, size: '28px 28px' }
    case 'lines':
      return { img: `linear-gradient(transparent 31px, ${c} 32px)`, size: '100% 32px' }
    case 'hearts':
      return {
        img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M14 20c-5-4-7-7-6-10 1-3 5-3 6 0 1-3 5-3 6 0 1 3-1 6-6 10z' fill='${enc}' fill-opacity='.13'/%3E%3Cpath d='M42 48c-4-3-6-6-5-8 1-2.5 4-2.5 5 0 1-2.5 4-2.5 5 0 1 2-1 5-5 8z' fill='${enc}' fill-opacity='.09'/%3E%3C/svg%3E")`,
        size: '56px 56px',
      }
    case 'stars':
      return {
        img: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cg fill='${enc}'%3E%3Ccircle cx='12' cy='14' r='1.2' fill-opacity='.55'/%3E%3Ccircle cx='62' cy='30' r='.9' fill-opacity='.4'/%3E%3Ccircle cx='38' cy='70' r='1.1' fill-opacity='.5'/%3E%3Cpath d='M76 70l1.5 3.5 3.5 1.5-3.5 1.5L76 80l-1.5-3.5L71 75l3.5-1.5z' fill-opacity='.5'/%3E%3C/g%3E%3C/svg%3E")`,
        size: '90px 90px',
      }
    default:
      return { img: 'none', size: 'auto' }
  }
}

export function themeToVars(t) {
  const { colors: c, type, layout: l, deco: d } = t
  const pat = patternCss(d.pattern, c.deco)
  const density = { compact: 0.72, cozy: 1, spacious: 1.3 }[l.density]
  const shadow =
    l.shadowStyle === 'hard'
      ? `${Math.round(2 + l.shadow * 5)}px ${Math.round(2 + l.shadow * 5)}px 0 ${hexA(c.text, 0.9 * Math.min(1, l.shadow + 0.2))}`
      : `0 ${1 + l.shadow * 3}px ${2 + l.shadow * 6}px ${hexA(c.text, 0.06 + l.shadow * 0.1)}, 0 ${4 + l.shadow * 14}px ${10 + l.shadow * 30}px ${hexA(c.text, 0.04 + l.shadow * 0.12)}`
  return {
    '--bg': c.bg,
    '--surface': c.surface,
    '--surface-alt': c.surfaceAlt,
    '--text': c.text,
    '--text-muted': c.textMuted,
    '--accent': c.accent,
    '--accent-soft': hexA(c.accent, 0.18),
    '--accent-2': c.accent2,
    '--accent-3': c.accent3,
    '--btn-bg': c.buttonBg,
    '--btn-text': c.buttonText,
    '--border-color': c.border,
    '--deco': c.deco,
    '--tape': hexA(c.accent, 0.42),
    '--tape-2': hexA(c.accent2 === c.surface ? c.deco : c.accent2, 0.75),
    '--font-heading': FONTS[type.heading].stack,
    '--font-body': FONTS[type.body].stack,
    '--heading-scale': (type.headingScale * fontScale(type.heading)).toFixed(3),
    '--body-scale': fontScale(type.body).toFixed(3),
    '--base-size': `${type.baseSize}px`,
    '--heading-weight': type.headingWeight,
    '--line-height': type.lineHeight,
    '--radius': `${l.radius}px`,
    '--shadow': l.shadow === 0 ? 'none' : shadow,
    '--border': l.borderStyle === 'none' || l.borderWidth === 0 ? '0 solid transparent' : `${l.borderWidth}px ${l.borderStyle} ${c.border}`,
    '--content-width': `${l.width}px`,
    '--gap': l.gap,
    '--pad': density,
    '--pattern': pat.img,
    '--pattern-size': pat.size,
    '--texture': d.texture,
    '--tilt': d.tilt,
  }
}

export function applyTheme(theme, reducedByOs) {
  const root = document.documentElement
  for (const [k, v] of Object.entries(themeToVars(theme))) root.style.setProperty(k, String(v))
  const motion = reducedByOs ? 'reduced' : theme.motion.level
  root.dataset.motion = motion
  root.dataset.decoAnim = theme.motion.decorative && motion !== 'reduced' ? 'on' : 'off'
  for (const k of ['stickers', 'doodles', 'tape', 'polaroids']) root.dataset[k] = theme.deco[k] ? 'on' : 'off'
  root.dataset.hardShadow = theme.layout.shadowStyle === 'hard' ? 'on' : 'off'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg)
}
