import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, ShieldAlert, X } from 'lucide-react'
import { formatDate, formatPhone, shortTime } from '../../utils/formatters'

const statusLabels = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em analise',
  RESOLVIDO: 'Resolvido',
}

function formatDateTime(value) {
  if (!value) {
    return 'Nao informado'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Nao informado'
  }

  return date.toLocaleString('pt-BR')
}

function ownerName(proprietario = {}) {
  return proprietario.nome_responsavel || proprietario.nome_empresa || 'Proprietario'
}

function getWarningCourtName(warning) {
  return warning.quadra?.nome || warning.reserva?.quadra?.nome || 'Espaco nao informado'
}

function getWarningReservationDate(warning) {
  return warning.reserva?.data_reserva
    ? `${formatDate(warning.reserva.data_reserva)} ${shortTime(warning.reserva.hora_inicio)} - ${shortTime(warning.reserva.hora_fim)}`
    : 'Reserva sem data'
}

function AlertDetailsModal({ aviso, onClose, onUpdateStatus, updatingStatus }) {
  if (!aviso) {
    return null
  }

  const proprietario = aviso.proprietario || {}
  const advertencias = aviso.advertencias || []

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="reservation-modal admin-alert-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`admin-alert-${aviso.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <div className="admin-alert-heading">
          <ShieldAlert size={24} />
          <div>
            <h2 id={`admin-alert-${aviso.id}`}>{ownerName(proprietario)}</h2>
            <p>{proprietario.email || 'E-mail nao informado'}</p>
          </div>
        </div>

        <div className="reservation-detail-lines">
          <span>
            <small>ID do proprietario</small>
            <strong>{proprietario.id || aviso.proprietario_id}</strong>
          </span>
          <span>
            <small>Telefone</small>
            <strong>{proprietario.telefone ? formatPhone(proprietario.telefone) : 'Nao informado'}</strong>
          </span>
          <span>
            <small>Advertencias ativas</small>
            <strong>{aviso.quantidade_advertencias || advertencias.length}</strong>
          </span>
          <span>
            <small>Status</small>
            <strong>{statusLabels[aviso.status] || aviso.status}</strong>
          </span>
          <span>
            <small>Gerado em</small>
            <strong>{formatDateTime(aviso.gerado_em || aviso.createdAt)}</strong>
          </span>
        </div>

        <div className="admin-alert-cancellations">
          <small>Cancelamentos relacionados</small>
          {advertencias.map((warning, index) => (
            <div className="admin-alert-cancellation-row" key={warning.id}>
              <strong>{index + 1}. Reserva #{String(warning.reserva_id || '').slice(0, 8)}</strong>
              <span>{formatDateTime(warning.cancelamento_em)} - {getWarningCourtName(warning)}</span>
              <span>{getWarningReservationDate(warning)}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          {aviso.status === 'PENDENTE' && (
            <button
              className="secondary-action"
              type="button"
              onClick={() => onUpdateStatus(aviso, 'EM_ANALISE')}
              disabled={updatingStatus}
            >
              <Eye size={15} />
              {updatingStatus ? 'Salvando...' : 'Marcar em analise'}
            </button>
          )}
          {aviso.status !== 'RESOLVIDO' && (
            <button
              className="primary-action"
              type="button"
              onClick={() => onUpdateStatus(aviso, 'RESOLVIDO')}
              disabled={updatingStatus}
            >
              <CheckCircle2 size={15} />
              {updatingStatus ? 'Salvando...' : 'Marcar resolvido'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

export function AdminAlertsView({ avisos = [], onUpdateStatus }) {
  const [detailsAlert, setDetailsAlert] = useState(null)
  const [updatingId, setUpdatingId] = useState('')

  async function updateStatus(aviso, status) {
    setUpdatingId(aviso.id)
    try {
      const updated = await onUpdateStatus?.(aviso, status)

      if (updated) {
        setDetailsAlert(updated)
      }
    } finally {
      setUpdatingId('')
    }
  }

  if (!avisos.length) {
    return (
      <section className="screen-stack">
        <div className="admin-title">
          <ShieldAlert size={20} />
          <div>
            <span>Monitoramento</span>
            <h1>Avisos</h1>
          </div>
        </div>
        <section className="empty-state">
          <AlertTriangle size={30} />
          <h2>Nenhum aviso pendente</h2>
          <p>Proprietarios com 3 advertencias ativas aparecerao aqui.</p>
        </section>
      </section>
    )
  }

  return (
    <section className="screen-stack">
      <div className="admin-title">
        <ShieldAlert size={20} />
        <div>
          <span>Monitoramento</span>
          <h1>Avisos</h1>
        </div>
      </div>

      <div className="list-stack">
        {avisos.map((aviso) => {
          const proprietario = aviso.proprietario || {}
          const advertencias = aviso.advertencias || []
          const updatingStatus = updatingId === aviso.id

          return (
            <article className="list-row admin-alert-row" key={aviso.id}>
              <div className="admin-alert-main">
                <div className="owner-reservation-title">
                  <span className={`status-dot status-${aviso.status?.toLowerCase()}`}>{statusLabels[aviso.status] || aviso.status}</span>
                  <h3>{ownerName(proprietario)}</h3>
                </div>
                <div className="owner-reservation-summary">
                  <span>ID {proprietario.id || aviso.proprietario_id}</span>
                  <span>{proprietario.email || 'E-mail nao informado'}</span>
                  <span>{proprietario.telefone ? formatPhone(proprietario.telefone) : 'Telefone nao informado'}</span>
                  <span>{aviso.quantidade_advertencias || advertencias.length} advertencias ativas</span>
                  <span>Gerado em {formatDateTime(aviso.gerado_em || aviso.createdAt)}</span>
                </div>
              </div>

              <div className="row-actions admin-alert-actions">
                <button className="secondary-action" type="button" onClick={() => setDetailsAlert(aviso)}>
                  <Eye size={15} />
                  Ver detalhes
                </button>
                {aviso.status === 'PENDENTE' && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => updateStatus(aviso, 'EM_ANALISE')}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? 'Salvando...' : 'Marcar em analise'}
                  </button>
                )}
                {aviso.status !== 'RESOLVIDO' && (
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() => updateStatus(aviso, 'RESOLVIDO')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle2 size={15} />
                    {updatingStatus ? 'Salvando...' : 'Resolver'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <AlertDetailsModal
        aviso={detailsAlert}
        updatingStatus={Boolean(updatingId)}
        onClose={() => setDetailsAlert(null)}
        onUpdateStatus={updateStatus}
      />
    </section>
  )
}
