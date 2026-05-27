import { CalendarDays } from 'lucide-react'
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'

export function ReservationList({ reservas, onCancel }) {
  if (!reservas.length) {
    return (
      <section className="empty-state">
        <CalendarDays size={34} />
        <h2>Nenhuma reserva por enquanto</h2>
        <p>Quando voce reservar uma quadra, ela aparecera aqui.</p>
      </section>
    )
  }

  return (
    <section className="list-stack">
      {reservas.map((reserva) => (
        <article className="list-row" key={reserva.id}>
          <div>
            <span className={`status-dot status-${reserva.status}`}>{reserva.status}</span>
            <h3>{reserva.quadra?.nome || reserva.quadra_nome}</h3>
            <p>{formatDate(reserva.data_reserva)} - {shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</p>
          </div>
          <strong>{formatCurrency(reserva.valor_total)}</strong>
          {reserva.status !== 'cancelada' && (
            <button className="danger-action" type="button" onClick={() => onCancel(reserva)}>
              Cancelar
            </button>
          )}
        </article>
      ))}
    </section>
  )
}
