import { useState } from 'react'
import { ICONS } from '../../lib/content.js'
import { LinesField, Segmented, TextField, Toggle } from './Controls.jsx'

// Admin-only editor for every piece of copy. Writes into the local draft;
// the live site only changes after publishing (see PublishPanel).
export default function ContentEditor({ config, draftRaw, published, updateDraft }) {
  const raw = draftRaw || published
  const [editMode, setEditMode] = useState(config.site.activeMode)
  const m = raw.modes[editMode]
  const up = (fn) => updateDraft((d) => fn(d.modes[editMode], d))

  return (
    <div className="ctl-stack content-editor">
      <p className="ctl-hint">changes show up on the page right away, but only in <b>your</b> browser. use the publish tab to make them live. tip: <code>{'{name}'}</code> becomes the recipient's name.</p>

      <Section title="site & mode" open>
        <TextField label="website title" value={raw.site.title} onChange={(v) => updateDraft((d) => { d.site.title = v })} />
        <Segmented
          id="ed-mode"
          label="which mode is live"
          value={raw.site.activeMode}
          options={[['personal', raw.modes.personal.label || 'personal'], ['friend', raw.modes.friend.label || 'friend']]}
          onChange={(v) => updateDraft((d) => { d.site.activeMode = v })}
        />
        <Toggle
          id="ed-visitor-switch"
          label="let visitors switch modes themselves"
          checked={raw.site.visitorCanSwitchMode}
          onChange={(v) => updateDraft((d) => { d.site.visitorCanSwitchMode = v })}
          hint="off = they only ever see the live mode above. links can never change this."
        />
      </Section>

      <div className="edit-mode-pick">
        <Segmented id="ed-editing" label="editing the words for" value={editMode} options={[['personal', 'personal mode'], ['friend', 'friend mode']]} onChange={setEditMode} />
      </div>

      <Section title="welcome">
        <TextField label="mode name (shown in the header)" value={m.label} onChange={(v) => up((x) => { x.label = v })} />
        <TextField label="recipient's name" value={m.recipientName} onChange={(v) => up((x) => { x.recipientName = v })} />
        <TextField label="small line above the greeting" value={m.welcome.kicker} onChange={(v) => up((x) => { x.welcome.kicker = v })} />
        <LinesField label="greeting on first visit" value={m.welcome.greetingsFirstVisit} onChange={(v) => up((x) => { x.welcome.greetingsFirstVisit = v })} rows={2} />
        <LinesField label="greetings on return visits (rotates each visit)" value={m.welcome.greetingsReturning} onChange={(v) => up((x) => { x.welcome.greetingsReturning = v })} />
        <TextField label="intro" multiline value={m.welcome.intro} onChange={(v) => up((x) => { x.welcome.intro = v })} />
        <TextField label="start button" value={m.welcome.startLabel} onChange={(v) => up((x) => { x.welcome.startLabel = v })} />
        <TextField label="tomorrow link" value={m.welcome.tomorrowLinkLabel} onChange={(v) => up((x) => { x.welcome.tomorrowLinkLabel = v })} />
        <TextField label="sticky note" value={m.welcome.noteText} onChange={(v) => up((x) => { x.welcome.noteText = v })} />
        <TextField label="polaroid caption" value={m.welcome.polaroidCaption} onChange={(v) => up((x) => { x.welcome.polaroidCaption = v })} />
      </Section>

      <Section title="check-in">
        <TextField label="question" value={m.checkin.heading} onChange={(v) => up((x) => { x.checkin.heading = v })} />
        <TextField label="subheading" value={m.checkin.subheading} onChange={(v) => up((x) => { x.checkin.subheading = v })} />
        <TextField label="'change answer' link" value={m.checkin.changeLabel} onChange={(v) => up((x) => { x.checkin.changeLabel = v })} />
        {m.checkin.moods.map((mood, i) => (
          <fieldset key={i} className="item-box">
            <legend>mood {i + 1}</legend>
            <TextField label="label" value={mood.label} onChange={(v) => up((x) => { x.checkin.moods[i].label = v })} />
            <TextField label="description" value={mood.description} onChange={(v) => up((x) => { x.checkin.moods[i].description = v })} />
            <div className="ctl">
              <label className="ctl-label" htmlFor={`icon-${i}`}>icon</label>
              <select id={`icon-${i}`} value={mood.icon} onChange={(e) => up((x) => { x.checkin.moods[i].icon = e.target.value })}>
                {ICONS.map((ic) => <option key={ic}>{ic}</option>)}
              </select>
            </div>
            <LinesField label="responses (one picked at random, never the same twice in a row)" value={mood.responses} onChange={(v) => up((x) => { x.checkin.moods[i].responses = v })} />
            {m.checkin.moods.length > 2 && (
              <button className="link-btn danger" onClick={() => up((x) => { x.checkin.moods.splice(i, 1) })}>remove this mood</button>
            )}
          </fieldset>
        ))}
        {m.checkin.moods.length < 6 && (
          <button className="btn btn-small btn-ghost" onClick={() => up((x) => { x.checkin.moods.push({ id: `mood-${Date.now() % 100000}`, icon: 'heart', label: 'New mood.', description: 'describe it', responses: ['a response'] }) })}>
            + add a mood
          </button>
        )}
      </Section>

      <Section title="tomorrow question">
        <TextField label="question" value={m.tomorrow.heading} onChange={(v) => up((x) => { x.tomorrow.heading = v })} />
        <TextField label="'not a commitment' note" value={m.tomorrow.note} onChange={(v) => up((x) => { x.tomorrow.note = v })} />
        {m.tomorrow.options.map((o, i) => (
          <fieldset key={i} className="item-box">
            <legend>answer {i + 1}</legend>
            <TextField label="button text" value={o.label} onChange={(v) => up((x) => { x.tomorrow.options[i].label = v })} />
            <LinesField label="reactions" value={o.responses} onChange={(v) => up((x) => { x.tomorrow.options[i].responses = v })} rows={3} />
            <Toggle id={`cel-${i}`} label="confetti when picked" checked={!!o.celebrate} onChange={(v) => up((x) => { x.tomorrow.options[i].celebrate = v })} />
            {m.tomorrow.options.length > 2 && (
              <button className="link-btn danger" onClick={() => up((x) => { x.tomorrow.options.splice(i, 1) })}>remove this answer</button>
            )}
          </fieldset>
        ))}
        {m.tomorrow.options.length < 6 && (
          <button className="btn btn-small btn-ghost" onClick={() => up((x) => { x.tomorrow.options.push({ id: `opt-${Date.now() % 100000}`, label: 'New answer', celebrate: false, responses: ['a reaction'] }) })}>
            + add an answer
          </button>
        )}
        <TextField label="closing title" value={m.tomorrow.closingTitle} onChange={(v) => up((x) => { x.tomorrow.closingTitle = v })} />
        <TextField label="closing message" multiline value={m.tomorrow.closingMessage} onChange={(v) => up((x) => { x.tomorrow.closingMessage = v })} />
        <TextField label="sign-off" value={m.tomorrow.signoff} onChange={(v) => up((x) => { x.tomorrow.signoff = v })} />
      </Section>

      <Section title={editMode === 'friend' ? 'roasts, notices & inside jokes' : 'little extras'}>
        <TextField label="heading" value={m.extras.heading} onChange={(v) => up((x) => { x.extras.heading = v })} />
        <TextField label="intro" value={m.extras.intro} onChange={(v) => up((x) => { x.extras.intro = v })} />
        {m.extras.buckets.map((b, i) => (
          <fieldset key={i} className="item-box">
            <legend>button {i + 1}</legend>
            <TextField label="button text" value={b.button} onChange={(v) => up((x) => { x.extras.buckets[i].button = v })} />
            <LinesField label="lines" value={b.lines} onChange={(v) => up((x) => { x.extras.buckets[i].lines = v })} />
            {m.extras.buckets.length > 1 && (
              <button className="link-btn danger" onClick={() => up((x) => { x.extras.buckets.splice(i, 1) })}>remove this button</button>
            )}
          </fieldset>
        ))}
        {m.extras.buckets.length < 6 && (
          <button className="btn btn-small btn-ghost" onClick={() => up((x) => { x.extras.buckets.push({ id: `b-${Date.now() % 100000}`, button: 'new button', lines: ['a line'] }) })}>
            + add a button
          </button>
        )}
        <p className="ctl-hint">keep teasing friendly. nothing cruel or too personal. 💛</p>
      </Section>

      <Section title="rock, paper, scissors">
        <TextField label="heading" value={m.rps.heading} onChange={(v) => up((x) => { x.rps.heading = v })} />
        <TextField label="intro" value={m.rps.intro} onChange={(v) => up((x) => { x.rps.intro = v })} />
        <LinesField label="when they win a round" value={m.rps.win} onChange={(v) => up((x) => { x.rps.win = v })} rows={3} />
        <LinesField label="when they lose a round" value={m.rps.lose} onChange={(v) => up((x) => { x.rps.lose = v })} rows={3} />
        <LinesField label="draws" value={m.rps.draw} onChange={(v) => up((x) => { x.rps.draw = v })} rows={3} />
        <TextField label="best-of-three: they win" value={m.rps.matchWin} onChange={(v) => up((x) => { x.rps.matchWin = v })} />
        <TextField label="best-of-three: they lose" value={m.rps.matchLose} onChange={(v) => up((x) => { x.rps.matchLose = v })} />
      </Section>

      <Section title="easter eggs (shared by both modes)">
        <TextField label="secret message (click the title…)" multiline value={raw.eggs.titleSecret} onChange={(v) => updateDraft((d) => { d.eggs.titleSecret = v })} />
        <div className="ctl">
          <label className="ctl-label" htmlFor="ed-clicks">…this many times</label>
          <input id="ed-clicks" type="number" min={2} max={20} value={raw.eggs.titleClicks} onChange={(e) => updateDraft((d) => { d.eggs.titleClicks = Math.min(20, Math.max(2, Number(e.target.value) || 5)) })} />
        </div>
        <TextField label="hidden note on the back of the polaroid" multiline value={raw.eggs.polaroidBack} onChange={(v) => updateDraft((d) => { d.eggs.polaroidBack = v })} />
        <LinesField label="heart sticker says…" value={raw.eggs.stickerLines} onChange={(v) => updateDraft((d) => { d.eggs.stickerLines = v })} />
        <LinesField label="random compliments (footer)" value={raw.eggs.compliments} onChange={(v) => updateDraft((d) => { d.eggs.compliments = v })} />
        <LinesField label="start button sometimes says…" value={raw.eggs.startSurprises} onChange={(v) => updateDraft((d) => { d.eggs.startSurprises = v })} rows={3} />
        <TextField label="when the same mood is picked 3+ times ({count} = how many)" value={raw.eggs.repeatPick} onChange={(v) => updateDraft((d) => { d.eggs.repeatPick = v })} />
        <TextField label="footer" value={raw.eggs.footer} onChange={(v) => updateDraft((d) => { d.eggs.footer = v })} />
      </Section>
    </div>
  )
}

function Section({ title, children, open = false }) {
  return (
    <details className="ed-section" open={open}>
      <summary>{title}</summary>
      <div className="ed-section-body">{children}</div>
    </details>
  )
}
