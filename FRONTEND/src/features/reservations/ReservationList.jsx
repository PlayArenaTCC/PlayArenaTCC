import { useState } from 'react'
import { CalendarDays, Clock, CreditCard, DollarSign, Info, MapPin, X } from 'lucide-react'
import { formatCurrency, formatDate, formatOperatingHours, shortTime } from '../../utils/formatters'

const paymentLabels = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  nao_informado: 'Não informado',
}

function getCourtName(reserva) {
  return reserva.quadra?.nome || reserva.quadra_nome || 'Quadra'
}

function getCourtAddress(reserva) {
  const quadra = reserva.quadra || {}
  const address = [
    quadra.endereco || reserva.endereco,
    quadra.bairro || reserva.bairro,
    quadra.cidade || reserva.cidade,
    quadra.estado || reserva.estado,
  ].filter(Boolean)

  return address.length ? address.join(', ') : 'Localidade não informada'
}

function getCourtAmenities(reserva) {
  return reserva.quadra?.amenities || reserva.quadra?.comodidades || []
}

function getCourtOperatingHours(reserva) {
  return reserva.quadra?.horarios_funcionamento || reserva.quadra?.funcionamento || []
}

function ReservationDetails({ reserva, onClose }) {
  if (!reserva) {
    return null
  }

  const amenities = getCourtAmenities(reserva)
  const operatingHours = getCourtOperatingHours(reserva)

  return (
    <div className="modal-backdrop">
      <section className="reservation-modal reservation-details-modal">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <h2>Detalhes da reserva</h2>
        <p>{getCourtName(reserva)}</p>

        <div className="reservation-detail-lines">
          <span>
            <CalendarDays size={18} />
            <small>Data</small>
            <strong>{formatDate(reserva.data_reserva)}</strong>
          </span>
          <span>
            <Clock size={18} />
            <small>Horário</small>
            <strong>{shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</strong>
          </span>
          <span>
            <MapPin size={18} />
            <small>Localidade</small>
            <strong>{getCourtAddress(reserva)}</strong>
          </span>
          <span>
            <DollarSign size={18} />
            <small>Valor</small>
            <strong>{formatCurrency(reserva.valor_total)}</strong>
          </span>
          <span>
            <Info size={18} />
            <small>Status</small>
            <strong>{reserva.status}</strong>
          </span>
          <span>
            <CreditCard size={18} />
            <small>Pagamento</small>
            <strong>{paymentLabels[reserva.forma_pagamento] || reserva.forma_pagamento || 'Não informado'}</strong>
          </span>
        </div>

        {operatingHours.length > 0 && (
          <div className="reservation-extra-block">
            <small>Funcionamento da quadra</small>
            <p>{formatOperatingHours(operatingHours)}</p>
          </div>
        )}

        {amenities.length > 0 && (
          <div className="reservation-extra-block">
            <small>Comodidades</small>
            <div className="reservation-chip-list">
              {amenities.map((amenity) => (
                <span key={amenity}>{amenity}</span>
              ))}
            </div>
          </div>
        )}

        {reserva.observacoes && (
          <div className="reservation-notes">
            <small>Observações</small>
            <p>{reserva.observacoes}</p>
          </div>
        )}

        <div className="modal-actions">
          <button className="primary-action" type="button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </section>
    </div>
  )
}

export function ReservationList({ reservas, onCancel }) {
  const [detailsReservation, setDetailsReservation] = useState(null)

  if (!reservas.length) {
    return (
      <section className="empty-state">
        <CalendarDays size={34} />
        <h2>Nenhuma reserva por enquanto</h2>
        <p>Quando você reservar uma quadra, ela aparecerá aqui.</p>
      </section>
    )
  }

  return (
    <>
      <section className="list-stack">
        {reservas.map((reserva) => (
          <article className="list-row reservation-row" key={reserva.id}>
            <div className="reservation-row-main">
              <span className={`status-dot status-${reserva.status}`}>{reserva.status}</span>
              <h3>{getCourtName(reserva)}</h3>
            </div>
            <div className="reservation-row-actions">
              <button className="secondary-action" type="button" onClick={() => setDetailsReservation(reserva)}>
                <Info size={16} />
                Detalhes
              </button>
              {reserva.status !== 'cancelada' && (
                <button className="danger-action" type="button" onClick={() => onCancel(reserva)}>
                  Cancelar
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
      <ReservationDetails reserva={detailsReservation} onClose={() => setDetailsReservation(null)} />
    </>
  )
}
