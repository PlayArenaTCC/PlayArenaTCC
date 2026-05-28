import { CalendarDays } from 'lucide-react'
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'

export function OwnerReservationList({ reservas, onStatusReservation, compact = false }) {
  if (!reservas.length) {
    return (
      <section className={compact ? 'empty-state compact-empty' : 'empty-state'}>
        <CalendarDays size={30} />
        <h2>Nenhuma reserva próxima</h2>
        <p>As reservas dos seus espaços aparecerão aqui.</p>
      </section>
    )
  }

  return (
    <section className="list-stack">
      {reservas.map((reserva) => (
        <article className="list-row" key={reserva.id}>
          <div>
            <span className={`status-dot status-${reserva.status}`}>{reserva.status}</span>
            <h3>{reserva.quadra?.nome}</h3>
            <p>{reserva.usuario?.nome || 'Usuário'} - {formatDate(reserva.data_reserva)} - {shortTime(reserva.hora_inicio)}</p>
          </div>
          <strong>{formatCurrency(reserva.valor_total)}</strong>
          {!compact && (
            <div className="row-actions">
              <button className="secondary-action" type="button" onClick={() => onStatusReservation(reserva, 'confirmada')}>Confirmar</button>
              <button className="danger-action" type="button" onClick={() => onStatusReservation(reserva, 'cancelada')}>Cancelar</button>
            </div>
          )}
        </article>
      ))}
    </section>
  )
}
