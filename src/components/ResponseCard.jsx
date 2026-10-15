import { MoodIcon } from './Doodles.jsx'

export default function ResponseCard({ title, icon, children, tone = '' }) {
  return (
    <div className={`response-card card reveal ${tone}`} data-edit="colors:surfaceAlt">
      <span className="tape tape-top" aria-hidden="true" />
      <div className="response-head">
        {icon && <MoodIcon name={icon} size={34} />}
        <p className="response-title hand">{title}</p>
      </div>
      <div className="response-body">{children}</div>
    </div>
  )
}
