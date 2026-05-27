import { CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'

export function ReservationSuccess({ reserva, onClose }) {
  if (!reserva) {
    return null
  }

  return (
    <div className="modal-backdrop">
      <section className="reservation-modal success-modal">
        <CheckCircle2 size={46} />
        <h2>Reserva Confirmada!</h2>
        <p>Sua reserva foi realizada com sucesso.</p>
        <div className="receipt-lines">
          <span>Quadra <strong>{reserva.quadra?.nome || reserva.quadra_nome}</strong></span>
          <span>Data <strong>{formatDate(reserva.data_reserva)}</strong></span>
          <span>Horario <strong>{shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</strong></span>
          <span>Total <strong>{formatCurrency(reserva.valor_total)}</strong></span>
        </div>
        <button className="primary-action" type="button" onClick={onClose}>
          Ver minhas reservas
        </button>
      </section>
    </div>
  )
}
