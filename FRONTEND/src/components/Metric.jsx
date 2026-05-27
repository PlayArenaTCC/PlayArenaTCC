export function Metric({ icon: Icon, label, value, tone = 'green' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>
        <Icon size={18} />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  )
}
