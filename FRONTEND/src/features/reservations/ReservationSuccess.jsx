import { CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate, formatPhone, shortTime } from '../../utils/formatters'

function buildWhatsAppLink(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`
}

export function ReservationSuccess({ reserva, onClose }) {
  if (!reserva) {
    return null
  }

  const owner = reserva.quadra?.proprietario
  const ownerPhone = owner?.telefone
  const whatsappLink = buildWhatsAppLink(ownerPhone)

  return (
    <div className="modal-backdrop">
      <section className="reservation-modal success-modal">
        <CheckCircle2 size={46} />
        <h2>Reserva Confirmada!</h2>
        <p>Sua reserva foi realizada com sucesso.</p>
        <div className="receipt-lines">
          <span>Quadra <strong>{reserva.quadra?.nome || reserva.quadra_nome}</strong></span>
          <span>Data <strong>{formatDate(reserva.data_reserva)}</strong></span>
          <span>Horário <strong>{shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</strong></span>
          <span>Total <strong>{formatCurrency(reserva.valor_total)}</strong></span>
          {reserva.codigo_reserva && (
            <span>Código <strong className="reservation-code-text">{reserva.codigo_reserva}</strong></span>
          )}
        </div>
        {ownerPhone && (
          <div className="reservation-whatsapp-card">
            <small>WhatsApp do proprietário</small>
            <strong>{formatPhone(ownerPhone)}</strong>
            {whatsappLink && (
              <a className="secondary-action" href={whatsappLink} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>
            )}
          </div>
        )}
        <button className="primary-action" type="button" onClick={onClose}>
          Ver minhas reservas
        </button>
      </section>
    </div>
  )
}
