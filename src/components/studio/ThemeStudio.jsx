import { useEffect, useRef, useState } from 'react'
import { COLOR_FIELDS, FONTS, FONT_PAIRS, PRESETS, PRESET_IDS, RANGES, contrast, presetTheme, themeDiff } from '../../config/themes.js'
import { ColorField, Segmented, Select, Slider, Toggle } from './Controls.jsx'
import SavePanel from './SavePanel.jsx'
import ContentEditor from './ContentEditor.jsx'
import PublishPanel from './PublishPanel.jsx'
import { Heart, Star } from '../Doodles.jsx'

const THEME_TABS = [
  ['presets', 'presets'],
  ['colors', 'colours'],
  ['type', 'type'],
  ['layout', 'layout'],
  ['deco', 'decor'],
  ['motion', 'motion'],
  ['save', 'save & share'],
]
const ADMIN_TABS = [
  ['words', '✎ words'],
  ['publish', '★ publish'],
]

function ago(ts, now) {
  if (!ts) return ''
  const s = Math.round((now - ts) / 1000)
  return s < 5 ? 'just now' : s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`
}

export default function ThemeStudio(props) {
  const { open, onClose, theme, setTheme, undo, canUndo, creatorDefault, savedAt, previewingShared, toast, picking, setPicking, focusTarget, isAdmin } = props
  const [tab, setTab] = useState('presets')
  const [showSample, setShowSample] = useState(() => window.innerWidth >= 900)
  const [now, setNow] = useState(Date.now())
  const panel = useRef(null)
  const opener = useRef(null)
  const openedWith = useRef(theme)

  // focus in on open, back to the opener on close
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement
      openedWith.current = theme
      setTimeout(() => panel.current?.querySelector('.studio-title')?.focus(), 30)
    } else opener.current?.focus?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // closed panel is invisible to keyboard + screen readers
  useEffect(() => {
    if (open) panel.current?.removeAttribute('inert')
    else panel.current?.setAttribute('inert', '')
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [open])
  useEffect(() => setNow(Date.now()), [savedAt])

  // "pick an element" → jump to the matching control and flash it
  useEffect(() => {
    if (!focusTarget) return
    const [group, key] = focusTarget.key.split(':')
    setTab(group === 'colors' ? 'colors' : group)
    setTimeout(() => {
      const el = document.getElementById(`ctl-${group}-${key}`)
      if (!el) return
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.classList.remove('flash')
      void el.offsetWidth
      el.classList.add('flash')
      el.querySelector('input, select, button')?.focus({ preventScroll: true })
    }, 60)
  }, [focusTarget])

  const set = (group, key) => (value, coalesce = false) =>
    setTheme((t) => ({ ...t, [group]: { ...t[group], [key]: value } }), { coalesce })

  const c = theme.colors
  const checks = [
    ['text on page', c.text, c.bg],
    ['text on cards', c.text, c.surface],
    ['secondary text', c.textMuted, c.surface],
    ['button text', c.buttonText, c.buttonBg],
  ].map(([label, fg, bg]) => ({ label, ratio: contrast(fg, bg) }))

  const tabs = isAdmin ? [...THEME_TABS, ...ADMIN_TABS] : THEME_TABS

  return (
    <aside
      ref={panel}
      className={`studio ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="studio-h"
      aria-hidden={!open}
      onKeyDown={(e) => e.key === 'Escape' && (picking ? setPicking(false) : onClose())}
    >
      <div className="studio-head">
        <span className="tape tape-top" aria-hidden="true" />
        <h2 id="studio-h" className="studio-title hand" tabIndex={-1}>make it yours</h2>
        <div className="studio-head-actions">
          <button className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="undo last change" title="undo">↶</button>
          <button
            className={`icon-btn ${picking ? 'on' : ''}`}
            onClick={() => setPicking(!picking)}
            aria-pressed={picking}
            title="click something on the page to edit it"
            aria-label="pick an element on the page to edit"
          >
            ⌖
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="close the studio">✕</button>
        </div>
      </div>
      {picking && <p className="pick-hint" role="status">tap any card, button or heading on the page to jump to its setting. (esc to cancel)</p>}

      <div className="sample-wrap">
        <button className="link-btn sample-toggle" onClick={() => setShowSample((s) => !s)} aria-expanded={showSample}>
          {showSample ? 'hide' : 'show'} live sample
        </button>
        {showSample && (
          <div className="sample" aria-label="live sample of the current theme">
            <div className="sample-card card">
              <span className="tape tape-top" aria-hidden="true" />
              <p className="sample-h">Heading looks like this</p>
              <p className="sample-p">Body text, with <span className="muted">secondary text</span> and an <span className="accent-text">accent</span>.</p>
              <div className="sample-row">
                <span className="btn btn-primary btn-small">button</span>
                <span className="chip">chip</span>
                <span className="sample-deco"><Heart size={20} /><Star size={18} /></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="studio-tabs" role="tablist" aria-label="studio sections">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls="studio-panel" className={`tab ${id === 'words' || id === 'publish' ? 'tab-admin' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="studio-body" id="studio-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'presets' && (
          <div className="preset-grid">
            {PRESET_IDS.map((id) => {
              const p = PRESETS[id]
              const active = theme.preset === id
              return (
                <button
                  key={id}
                  className={`preset ${active ? 'on' : ''}`}
                  aria-pressed={active}
                  onClick={() => { setTheme(presetTheme(id)); toast(`${p.label} applied`) }}
                  style={{ background: p.colors.bg, color: p.colors.text, fontFamily: FONTS[p.type.body].stack, borderRadius: Math.min(p.layout.radius, 18) }}
                >
                  <span className="preset-name" style={{ fontFamily: FONTS[p.type.heading].stack }}>{p.label}</span>
                  <span className="preset-blurb">{p.blurb}</span>
                  <span className="preset-swatches" aria-hidden="true">
                    {['surface', 'accent', 'accent2', 'accent3', 'text'].map((k) => (
                      <i key={k} style={{ background: p.colors[k] }} />
                    ))}
                  </span>
                  {active && <span className="preset-check">✓ in use{Object.keys(themeDiff(theme)).length ? ' (tweaked)' : ''}</span>}
                </button>
              )
            })}
            <p className="ctl-hint">presets are a starting point. tweak anything in the other tabs, then save your version under “save & share”.</p>
          </div>
        )}

        {tab === 'colors' && (
          <div className="ctl-stack">
            {COLOR_FIELDS.map(([k, label]) => (
              <ColorField key={k} id={`ctl-colors-${k}`} label={label} value={c[k]} onChange={(v, co) => set('colors', k)(v, co)} />
            ))}
            <div className="contrast-box">
              <p className="ctl-label">readability check</p>
              {checks.map((x) => (
                <p key={x.label} className={x.ratio >= 4.5 ? 'ok' : x.ratio >= 3 ? 'meh' : 'bad'}>
                  <span aria-hidden="true">{x.ratio >= 4.5 ? '✓' : '⚠'}</span> {x.label}: {x.ratio.toFixed(1)}:1
                  {x.ratio < 4.5 && <span className="muted"> {x.ratio >= 3 ? '(ok for big text only)' : '(hard to read)'}</span>}
                </p>
              ))}
            </div>
          </div>
        )}

        {tab === 'type' && (
          <div className="ctl-stack">
            <div className="ctl">
              <span className="ctl-label">font pairings</span>
              <div className="chip-row">
                {FONT_PAIRS.map((p) => (
                  <button
                    key={p.id}
                    className="chip"
                    aria-pressed={theme.type.heading === p.heading && theme.type.body === p.body}
                    style={{ fontFamily: FONTS[p.heading].stack }}
                    onClick={() => setTheme((t) => ({ ...t, type: { ...t.type, heading: p.heading, body: p.body } }))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <Segmented
              id="ctl-type-style"
              label="overall style"
              value={FONTS[theme.type.heading].kind}
              options={[['handwritten', 'handwritten headings'], ['conventional', 'conventional']]}
              onChange={(v) => setTheme((t) => ({ ...t, type: { ...t.type, heading: v === 'handwritten' ? 'caveat' : 'fraunces', body: v === 'handwritten' ? 'nunito' : 'atkinson' } }))}
            />
            <Select id="ctl-type-heading" label="heading font" value={theme.type.heading} onChange={set('type', 'heading')}>
              <FontOptions />
            </Select>
            <Select id="ctl-type-body" label="body font" value={theme.type.body} onChange={set('type', 'body')}>
              <FontOptions body />
            </Select>
            {FONTS[theme.type.body].kind === 'handwritten' && theme.type.body !== 'patrick' && (
              <p className="ctl-hint warn">heads up: long text in handwriting can be harder to read. Patrick Hand is the most legible handwritten body font.</p>
            )}
            <Slider id="ctl-type-baseSize" label="text size" value={theme.type.baseSize} {...rng('baseSize')} format={(v) => `${v}px`} onChange={set('type', 'baseSize')} />
            <Slider id="ctl-type-headingScale" label="heading size" value={theme.type.headingScale} {...rng('headingScale')} format={(v) => `${Math.round(v * 100)}%`} onChange={set('type', 'headingScale')} />
            <Slider id="ctl-type-headingWeight" label="heading weight" value={theme.type.headingWeight} {...rng('headingWeight')} onChange={set('type', 'headingWeight')} hint="some fonts only come in one weight." />
            <Slider id="ctl-type-lineHeight" label="line spacing" value={theme.type.lineHeight} {...rng('lineHeight')} format={(v) => v.toFixed(2)} onChange={set('type', 'lineHeight')} />
          </div>
        )}

        {tab === 'layout' && (
          <div className="ctl-stack">
            <Segmented id="ctl-layout-density" label="density" value={theme.layout.density} options={[['compact', 'compact'], ['cozy', 'cozy'], ['spacious', 'spacious']]} onChange={set('layout', 'density')} />
            <Slider id="ctl-layout-radius" label="corner roundness" value={theme.layout.radius} {...rng('radius')} format={(v) => `${v}px`} onChange={set('layout', 'radius')} />
            <Slider id="ctl-layout-shadow" label="shadow strength" value={theme.layout.shadow} {...rng('shadow')} format={(v) => `${Math.round(v * 100)}%`} onChange={set('layout', 'shadow')} />
            <Segmented id="ctl-layout-shadowStyle" label="shadow style" value={theme.layout.shadowStyle} options={[['soft', 'soft & blurry'], ['hard', 'hard sticker']]} onChange={set('layout', 'shadowStyle')} />
            <Segmented id="ctl-layout-borderStyle" label="border style" value={theme.layout.borderStyle} options={[['solid', 'solid'], ['dashed', 'dashed'], ['dotted', 'dotted'], ['none', 'none']]} onChange={set('layout', 'borderStyle')} />
            <Slider id="ctl-layout-borderWidth" label="border thickness" value={theme.layout.borderWidth} {...rng('borderWidth')} format={(v) => `${v}px`} onChange={set('layout', 'borderWidth')} />
            <Slider id="ctl-layout-width" label="content width" value={theme.layout.width} {...rng('width')} format={(v) => `${v}px`} onChange={set('layout', 'width')} hint="on phones the page always fits the screen." />
            <Slider id="ctl-layout-gap" label="space between cards" value={theme.layout.gap} {...rng('gap')} format={(v) => `${Math.round(v * 100)}%`} onChange={set('layout', 'gap')} />
          </div>
        )}

        {tab === 'deco' && (
          <div className="ctl-stack">
            <Segmented
              id="ctl-deco-pattern"
              label="background pattern"
              value={theme.deco.pattern}
              options={[['none', 'plain'], ['dots', 'dots'], ['grid', 'grid'], ['lines', 'ruled'], ['hearts', 'hearts'], ['stars', 'stars']]}
              onChange={set('deco', 'pattern')}
            />
            <Slider id="ctl-deco-texture" label="paper texture" value={theme.deco.texture} {...rng('texture')} format={(v) => `${Math.round(v * 100)}%`} onChange={set('deco', 'texture')} />
            <Slider id="ctl-deco-tilt" label="wonkiness (tilted bits)" value={theme.deco.tilt} {...rng('tilt')} format={(v) => `${Math.round(v * 100)}%`} onChange={set('deco', 'tilt')} />
            <Toggle id="ctl-deco-stickers" label="stickers" checked={theme.deco.stickers} onChange={set('deco', 'stickers')} />
            <Toggle id="ctl-deco-doodles" label="doodles (hearts, flowers, stars, clouds, arrows)" checked={theme.deco.doodles} onChange={set('deco', 'doodles')} />
            <Toggle id="ctl-deco-tape" label="washi tape" checked={theme.deco.tape} onChange={set('deco', 'tape')} />
            <Toggle id="ctl-deco-polaroids" label="polaroid & sticky-note collage" checked={theme.deco.polaroids} onChange={set('deco', 'polaroids')} />
          </div>
        )}

        {tab === 'motion' && (
          <div className="ctl-stack">
            <Segmented
              id="ctl-motion-level"
              label="animation"
              value={theme.motion.level}
              options={[['playful', 'playful'], ['subtle', 'subtle'], ['reduced', 'reduced']]}
              onChange={set('motion', 'level')}
            />
            <Toggle id="ctl-motion-decorative" label="decorative animations (floating doodles, wiggles)" checked={theme.motion.decorative} onChange={set('motion', 'decorative')} />
            {document.documentElement.dataset.motion === 'reduced' && theme.motion.level !== 'reduced' && (
              <p className="ctl-hint warn">your device asks for reduced motion, so animations stay calm no matter what's picked here.</p>
            )}
          </div>
        )}

        {tab === 'save' && <SavePanel theme={theme} setTheme={setTheme} toast={toast} />}
        {tab === 'words' && isAdmin && <ContentEditor {...props} />}
        {tab === 'publish' && isAdmin && <PublishPanel {...props} />}
      </div>

      <div className="studio-foot">
        <p className="save-status" role="status">
          {previewingShared ? '👀 previewing a shared theme (not saved yet)' : savedAt ? `✓ saved in this browser ${ago(savedAt, now)}` : 'changes save in this browser automatically'}
        </p>
        <div className="studio-foot-actions">
          <button className="btn btn-ghost btn-small" onClick={() => { setTheme(openedWith.current); toast('reverted to how it was when you opened this') }}>revert</button>
          <button className="btn btn-ghost btn-small" onClick={() => { setTheme(creatorDefault); toast('back to the default look') }}>reset to default</button>
          <button className="btn btn-primary btn-small" onClick={onClose}>done</button>
        </div>
      </div>
    </aside>
  )
}

function rng(k) {
  const [min, max, step] = RANGES[k]
  return { min, max, step }
}

function FontOptions() {
  return ['handwritten', 'conventional'].map((kind) => (
    <optgroup key={kind} label={kind}>
      {Object.entries(FONTS)
        .filter(([, f]) => f.kind === kind)
        .map(([id, f]) => (
          <option key={id} value={id}>{f.label}</option>
        ))}
    </optgroup>
  ))
}
