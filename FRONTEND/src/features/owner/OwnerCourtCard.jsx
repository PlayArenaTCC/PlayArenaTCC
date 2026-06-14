import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { weekDays } from '../../data/demoData'
import { formatCurrency } from '../../utils/formatters'

export function OwnerCourtCard({ quadra, onCreateSchedule }) {
  const [open, setOpen] = useState(false)
  const [schedule, setSchedule] = useState({
    dia_semana: 1,
    hora_inicio: '18:00',
    hora_fim: '19:00',
    valor: quadra.preco_hora || 90,
  })

  function update(field, value) {
    setSchedule((current) => ({ ...current, [field]: value }))
  }

  return (
    <article className="court-card owner-card">
      <img src={quadra.imagem_url} alt={quadra.nome} />
      <div className="court-card-body">
        <span className="tag">{quadra.ativa === false ? 'inativa' : 'ativa'}</span>
        <h3>{quadra.nome}</h3>
        <p>
          <MapPin size={15} />
          {quadra.endereco}
        </p>
        <div className="court-card-footer">
          <strong>{formatCurrency(quadra.preco_hora)}<small>/h</small></strong>
          <button className="secondary-action" type="button" onClick={() => setOpen((value) => !value)}>
            Horarios
          </button>
        </div>
        {open && (
          <form className="schedule-form" onSubmit={(event) => {
            event.preventDefault()
            onCreateSchedule(quadra, schedule)
          }}>
            <select value={schedule.dia_semana} onChange={(event) => update('dia_semana', event.target.value)}>
              {weekDays.map((day, index) => (
                <option value={index} key={day}>{day}</option>
              ))}
            </select>
            <input type="time" value={schedule.hora_inicio} onChange={(event) => update('hora_inicio', event.target.value)} />
            <input type="time" value={schedule.hora_fim} onChange={(event) => update('hora_fim', event.target.value)} />
            <input type="number" min="0" value={schedule.valor} onChange={(event) => update('valor', event.target.value)} />
            <button className="primary-action" type="submit">Adicionar</button>
          </form>
        )}
      </div>
    </article>
  )
}
