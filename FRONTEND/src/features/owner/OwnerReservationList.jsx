import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
<<<<<<< Updated upstream
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'
=======
import { formatCurrency, formatDate, formatPhone, shortTime } from '../../utils/formatters'

const activeReservationStatuses = ['pendente', 'confirmada']
>>>>>>> Stashed changes

export function OwnerReservationList({ reservas, onStatusReservation, compact = false }) {
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const trimmedReason = cancelReason.trim()

  function openCancelDialog(reserva) {
    setCancelTarget(reserva)
    setCancelReason('')
  }

  function closeCancelDialog() {
    if (!cancelling) {
      setCancelTarget(null)
      setCancelReason('')
    }
  }

  async function confirmOwnerCancel() {
    if (!cancelTarget || !trimmedReason) {
      return
    }

    setCancelling(true)
    try {
      const cancelled = await onStatusReservation(cancelTarget, 'cancelada', {
        motivo_cancelamento: trimmedReason,
      })

      if (cancelled !== false) {
        setCancelTarget(null)
        setCancelReason('')
      }
    } finally {
      setCancelling(false)
    }
  }

  if (!reservas.length) {
    return (
      <section className={compact ? 'empty-state compact-empty' : 'empty-state'}>
        <CalendarDays size={30} />
        <h2>Nenhuma reserva proxima</h2>
        <p>As reservas dos seus espacos aparecerao aqui.</p>
      </section>
    )
  }

  return (
    <>
    <section className="list-stack">
<<<<<<< Updated upstream
      {reservas.map((reserva) => (
        <article className="list-row" key={reserva.id}>
          <div>
            <span className={`status-dot status-${reserva.status}`}>{reserva.status}</span>
            <h3>{reserva.quadra?.nome}</h3>
            <p>{reserva.usuario?.nome || 'Usuario'} - {formatDate(reserva.data_reserva)} - {shortTime(reserva.hora_inicio)}</p>
=======
      {reservas.map((reserva) => {
        const canAct = activeReservationStatuses.includes(reserva.status)
        const userName = reserva.usuario?.nome || 'Usuario'
        const userPhone = reserva.usuario?.telefone ? formatPhone(reserva.usuario.telefone) : ''
        const userLabel = userPhone ? `${userName} · ${userPhone}` : userName
        const observation = String(reserva.observacoes || '').trim()

        return (
          <article className="list-row owner-reservation-row" key={reserva.id}>
            <div className="owner-reservation-main">
              <div className="owner-reservation-title">
                <span className={`status-dot status-${reserva.status}`}>{reserva.status}</span>
                <h3>{reserva.quadra?.nome}</h3>
              </div>
              <div className="owner-reservation-summary">
                <span>{userLabel}</span>
                <span>{formatDate(reserva.data_reserva)}</span>
                <span>{shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</span>
              </div>
              {!compact && (
                <div className="owner-reservation-details">
                  <small>Observa&ccedil;&atilde;o do usu&aacute;rio</small>
                  <span>{observation || 'Nenhuma observacao informada.'}</span>
                </div>
              )}
            </div>
            <div className="owner-reservation-side">
              <strong>{formatCurrency(reserva.valor_total)}</strong>
              {!compact && canAct && (
                <div className="row-actions owner-reservation-actions">
                  {reserva.status !== 'confirmada' && (
                    <button className="secondary-action" type="button" onClick={() => onStatusReservation(reserva, 'confirmada')}>Confirmar</button>
                  )}
                  <button className="danger-action" type="button" onClick={() => openCancelDialog(reserva)}>Cancelar</button>
                </div>
              )}
              {!compact && !canAct && (
                <span className="owner-reservation-locked">Sem acoes disponiveis</span>
              )}
            </div>
          </article>
        )
      })}
    </section>
    {cancelTarget && (
      <div className="modal-backdrop" onClick={closeCancelDialog}>
        <section
          className="reservation-modal confirm-dialog-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`owner-cancel-reservation-${cancelTarget.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id={`owner-cancel-reservation-${cancelTarget.id}`}>Cancelar reserva</h2>
          <p>Tem certeza que deseja cancelar esta reserva do usu&aacute;rio?</p>
          <div className="cancellation-rules-box">
            <strong>Cancelamento pelo propriet&aacute;rio:</strong>
            <p>
              O propriet&aacute;rio poder&aacute; cancelar a reserva at&eacute; 30 minutos antes do hor&aacute;rio reservado.
              Caso o cancelamento seja feito ap&oacute;s esse limite, o propriet&aacute;rio poder&aacute; receber puni&ccedil;&otilde;es administrativas.
            </p>
>>>>>>> Stashed changes
          </div>

          <label className="field">
            <span>Justificativa do cancelamento</span>
            <textarea
              required
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Informe o motivo do cancelamento"
            />
          </label>

          {trimmedReason && (
            <div className="confirm-warning-box">
              Voc&ecirc; deve entrar em contato com o usu&aacute;rio pelo telefone cadastrado para informar o cancelamento. O n&atilde;o cumprimento poder&aacute; resultar em puni&ccedil;&otilde;es na plataforma.
            </div>
          )}

          <div className="modal-actions">
            <button className="secondary-action" type="button" onClick={closeCancelDialog} disabled={cancelling}>
              Voltar
            </button>
            <button className="danger-action" type="button" onClick={confirmOwnerCancel} disabled={cancelling || !trimmedReason}>
              {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  )
}
