<<<<<<< Updated upstream
import { CalendarDays } from 'lucide-react'
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'

export function ReservationList({ reservas, onCancel }) {
=======
import { useState } from 'react'
import { CalendarDays, Clock, CreditCard, Info, MapPin, Wallet, X } from 'lucide-react'
import { formatCurrency, formatDate, formatOperatingHours, formatPhone, shortTime } from '../../utils/formatters'

const paymentLabels = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  nao_informado: 'Não informado',
}

const activeReservationStatuses = ['pendente', 'confirmada']

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

function buildWhatsAppLink(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`
}

function ReservationDetails({ reserva, onClose }) {
  if (!reserva) {
    return null
  }

  const amenities = getCourtAmenities(reserva)
  const operatingHours = getCourtOperatingHours(reserva)
  const ownerPhone = reserva.quadra?.proprietario?.telefone
  const whatsappLink = buildWhatsAppLink(ownerPhone)

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
            <Wallet size={18} />
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
  const [cancelReservation, setCancelReservation] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  async function confirmCancelReservation() {
    if (!cancelReservation) {
      return
    }

    setCancelling(true)
    try {
      const cancelled = await onCancel(cancelReservation)

      if (cancelled !== false) {
        setCancelReservation(null)
      }
    } finally {
      setCancelling(false)
    }
  }

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
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
              {activeReservationStatuses.includes(reserva.status) && (
                <button className="danger-action" type="button" onClick={() => setCancelReservation(reserva)}>
                  Cancelar
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
      <ReservationDetails reserva={detailsReservation} onClose={() => setDetailsReservation(null)} />
      {cancelReservation && (
        <div className="modal-backdrop" onClick={() => setCancelReservation(null)}>
          <section
            className="reservation-modal confirm-dialog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cancel-reservation-${cancelReservation.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={`cancel-reservation-${cancelReservation.id}`}>Cancelar reserva</h2>
            <p>Tem certeza que deseja cancelar esta reserva?</p>
            <div className="cancellation-rules-box">
              <strong>Cancelamento pelo usu&aacute;rio:</strong>
              <p>
                Para ter direito ao reembolso, o cancelamento deve ser feito at&eacute; 1 hora antes do hor&aacute;rio reservado.
                Caso o cancelamento seja realizado com menos de 1 hora de anteced&ecirc;ncia, a reserva ser&aacute; cancelada,
                por&eacute;m n&atilde;o haver&aacute; reembolso do valor pago.
              </p>
            </div>
            <div className="modal-actions">
              <button className="secondary-action" type="button" onClick={() => setCancelReservation(null)} disabled={cancelling}>
                Voltar
              </button>
              <button className="danger-action" type="button" onClick={confirmCancelReservation} disabled={cancelling}>
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
>>>>>>> Stashed changes
  )
}
