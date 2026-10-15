import { useEffect, useId, useState } from 'react'

const HEX = /^#[0-9a-fA-F]{6}$/

export function ColorField({ id, label, value, onChange }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="ctl ctl-color" id={id}>
      <label className="color-swatch" style={{ '--sw': value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase(), true)} aria-label={`${label} colour picker`} />
      </label>
      <label className="ctl-label" htmlFor={`${id}-hex`}>{label}</label>
      <input
        id={`${id}-hex`}
        className="hex-input"
        value={text}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => {
          const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
          setText(v)
          if (HEX.test(v)) onChange(v.toUpperCase())
        }}
        onBlur={() => setText(value)}
        aria-invalid={!HEX.test(text)}
      />
    </div>
  )
}

export function Slider({ id, label, value, min, max, step, onChange, format = (v) => v, hint }) {
  const inputId = useId()
  return (
    <div className="ctl ctl-slider" id={id}>
      <div className="ctl-row">
        <label className="ctl-label" htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId} className="ctl-value">{format(value)}</output>
      </div>
      <input id={inputId} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value), true)} />
      {hint && <p className="ctl-hint">{hint}</p>}
    </div>
  )
}

export function Segmented({ id, label, value, options, onChange }) {
  return (
    <div className="ctl" id={id}>
      <span className="ctl-label" id={`${id}-l`}>{label}</span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${id}-l`}>
        {options.map(([v, text]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({ id, label, checked, onChange, hint }) {
  return (
    <div className="ctl" id={id}>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-ui" aria-hidden="true" />
        <span>{label}</span>
      </label>
      {hint && <p className="ctl-hint">{hint}</p>}
    </div>
  )
}

export function Select({ id, label, value, onChange, children }) {
  const inputId = useId()
  return (
    <div className="ctl" id={id}>
      <label className="ctl-label" htmlFor={inputId}>{label}</label>
      <select id={inputId} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}

export function TextField({ label, value, onChange, multiline = false, hint, rows = 3, maxLength = 600 }) {
  const inputId = useId()
  return (
    <div className="ctl field">
      <label className="ctl-label" htmlFor={inputId}>{label}</label>
      {multiline ? (
        <textarea id={inputId} value={value ?? ''} rows={rows} maxLength={maxLength * 40} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={inputId} value={value ?? ''} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="ctl-hint">{hint}</p>}
    </div>
  )
}

/** Edits a list of lines as a textarea (one item per line). */
export function LinesField({ label, value, onChange, hint = 'one per line', rows = 4 }) {
  return <TextField label={label} multiline rows={rows} hint={hint} value={(value || []).join('\n')} onChange={(v) => onChange(v.split('\n'))} />
}
