import { useState } from 'react'
import { CalendarDays, CheckCircle2, KeyRound } from 'lucide-react'
import { formatCurrency, formatDate, formatPhone, shortTime } from '../../utils/formatters'
import { ReservationStatusFilter } from '../reservations/ReservationStatusFilter'
import { useReservationStatusFilter } from '../reservations/reservationStatusFilterState'

const activeReservationStatuses = ['pendente', 'confirmada']

function formatValidationDate(value) {
  if (!value) {
    return 'Horário não informado'
  }

  return new Date(value).toLocaleString('pt-BR')
}

export function OwnerReservationList({
  reservas,
  onStatusReservation,
  onValidateReservationCode,
  compact = false,
  filterStorageKey = 'playarena:owner-reservations-status-filter',
}) {
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [validationTarget, setValidationTarget] = useState(null)
  const [validationCode, setValidationCode] = useState('')
  const [validating, setValidating] = useState(false)
  const trimmedReason = cancelReason.trim()
  const trimmedValidationCode = validationCode.trim()
  const {
    counts,
    filteredReservas,
    selectedFilter,
    setSelectedFilter,
  } = useReservationStatusFilter(reservas, filterStorageKey, { enabled: !compact })

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

  function openValidationDialog(reserva) {
    setValidationTarget(reserva)
    setValidationCode('')
  }

  function closeValidationDialog() {
    if (!validating) {
      setValidationTarget(null)
      setValidationCode('')
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

  async function confirmValidationCode() {
    if (!validationTarget || !trimmedValidationCode) {
      return
    }

    setValidating(true)
    try {
      const validated = await onValidateReservationCode?.(validationTarget, trimmedValidationCode)

      if (validated !== false) {
        setValidationTarget(null)
        setValidationCode('')
      }
    } finally {
      setValidating(false)
    }
  }

  if (!filteredReservas.length) {
    return (
      <>
        {!compact && (
          <ReservationStatusFilter selectedFilter={selectedFilter} onChange={setSelectedFilter} counts={counts} />
        )}
        <section className={compact ? 'empty-state compact-empty' : 'empty-state reservation-filter-empty'}>
          <CalendarDays size={30} />
          <h2>{compact ? 'Nenhuma reserva próxima' : 'Nenhuma reserva encontrada para este filtro.'}</h2>
          {compact && <p>As reservas dos seus espaços aparecerão aqui.</p>}
        </section>
      </>
    )
  }

  return (
    <>
      {!compact && (
        <ReservationStatusFilter selectedFilter={selectedFilter} onChange={setSelectedFilter} counts={counts} />
      )}
      <section className="list-stack">
        {filteredReservas.map((reserva) => {
          const canAct = activeReservationStatuses.includes(reserva.status)
          const isValidated = reserva.status_validacao === 'validada'
          const canValidate = reserva.status === 'confirmada' && !isValidated && typeof onValidateReservationCode === 'function'
          const userName = reserva.usuario?.nome || 'Usuário'
          const userPhone = reserva.usuario?.telefone ? formatPhone(reserva.usuario.telefone) : ''
          const userLabel = userPhone ? `${userName} · ${userPhone}` : userName
          const observation = String(reserva.observacoes || '').trim()
          const validationLabel = isValidated
            ? `Presença validada em ${formatValidationDate(reserva.validado_em)}`
            : reserva.status === 'cancelada'
              ? 'Reserva cancelada'
              : 'Aguardando código do usuário'

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
                  <>
                    <div className="owner-reservation-details">
                      <small>Observa&ccedil;&atilde;o do usu&aacute;rio</small>
                      <span>{observation || 'Nenhuma observação informada.'}</span>
                    </div>
                    <div className="owner-reservation-details">
                      <small>Validação de presença</small>
                      <span>{validationLabel}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="owner-reservation-side">
                <strong>{formatCurrency(reserva.valor_total)}</strong>
                {!compact && canAct && (
                  <div className="row-actions owner-reservation-actions">
                    {reserva.status !== 'confirmada' && (
                      <button className="secondary-action" type="button" onClick={() => onStatusReservation(reserva, 'confirmada')}>Confirmar</button>
                    )}
                    {canValidate && (
                      <button className="secondary-action" type="button" onClick={() => openValidationDialog(reserva)}>
                        <KeyRound size={15} />
                        Validar código
                      </button>
                    )}
                    <button className="danger-action" type="button" onClick={() => openCancelDialog(reserva)}>Cancelar</button>
                  </div>
                )}
                {!compact && !canAct && (
                  <span className="owner-reservation-locked">
                    {isValidated ? 'Presença validada' : 'Sem ações disponíveis'}
                  </span>
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
    {validationTarget && (
      <div className="modal-backdrop" onClick={closeValidationDialog}>
        <section
          className="reservation-modal confirm-dialog-modal owner-code-validation-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`owner-validate-reservation-${validationTarget.id}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="owner-code-validation-heading">
            <CheckCircle2 size={24} />
            <div>
              <h2 id={`owner-validate-reservation-${validationTarget.id}`}>Validar presença</h2>
              <p>{validationTarget.quadra?.nome}</p>
            </div>
          </div>
          <p className="owner-code-validation-hint">
            Digite o código informado pelo usuário para concluir esta reserva.
          </p>

          <label className="field">
            <span>Código da reserva</span>
            <input
              autoFocus
              value={validationCode}
              onChange={(event) => setValidationCode(event.target.value.toUpperCase())}
              placeholder="Ex: A7K9Q2"
            />
          </label>

          <div className="modal-actions">
            <button className="secondary-action" type="button" onClick={closeValidationDialog} disabled={validating}>
              Voltar
            </button>
            <button className="primary-action" type="button" onClick={confirmValidationCode} disabled={validating || !trimmedValidationCode}>
              {validating ? 'Validando...' : 'Validar código'}
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  )
}
