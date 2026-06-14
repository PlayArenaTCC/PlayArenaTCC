import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatCurrency, formatDate, shortTime } from '../utils/formatters'

const reservationNotificationType = 'RESERVATION_CANCELLED'
const accountBlockedNotificationType = 'ACCOUNT_BLOCKED'
const ownerWarningNotificationType = 'OWNER_WARNING'

function formatDateTime(value) {
  if (!value) {
    return 'Data não informada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data não informada'
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function reservationTime(metadata) {
  const start = shortTime(metadata.startTime)
  const end = shortTime(metadata.endTime)

  if (!start && !end) {
    return 'Horário não informado'
  }

  return [start, end].filter(Boolean).join(' - ')
}

function NotificationDetails({ notification }) {
  const metadata = notification.metadata || {}
  const courtName = metadata.courtName || 'Quadra'

  if (notification.type === accountBlockedNotificationType) {
    return null
  }

  if (notification.type === ownerWarningNotificationType) {
    return (
      <dl className="notification-details">
        <div>
          <dt>Advertencias ativas</dt>
          <dd>{metadata.activeWarningsCount || 1}</dd>
        </div>
        <div>
          <dt>Expira em</dt>
          <dd>{formatDateTime(metadata.expiresAt)}</dd>
        </div>
      </dl>
    )
  }

  if (notification.type === reservationNotificationType) {
    return (
      <>
        <dl className="notification-details">
          <div>
            <dt>Quadra</dt>
            <dd>{courtName}</dd>
          </div>
          <div>
            <dt>Reserva</dt>
            <dd>{formatDate(metadata.reservationDate)} às {reservationTime(metadata)}</dd>
          </div>
        </dl>
        <div className="notification-justification">
          <span>Justificativa</span>
          <p>{metadata.justification || 'Não informada.'}</p>
        </div>
      </>
    )
  }

  return (
    <dl className="notification-details">
      <div>
        <dt>Quadra</dt>
        <dd>{courtName}</dd>
      </div>
      <div>
        <dt>Preço anterior</dt>
        <dd>{formatCurrency(metadata.previousPrice)}</dd>
      </div>
      <div>
        <dt>Novo preço</dt>
        <dd>{formatCurrency(metadata.newPrice)}</dd>
      </div>
    </dl>
  )
}

export function NotificationBell({
  notifications,
  unreadCount,
  loading,
  onMarkAllRead,
  onMarkRead,
  onRefresh,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const visibleUnreadCount = unreadCount > 99 ? '99+' : unreadCount

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function toggleNotifications() {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen) {
      onRefresh({ silent: true })
    }
  }

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        className="icon-button notification-bell-button"
        type="button"
        onClick={toggleNotifications}
        aria-label={unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-count" aria-hidden="true">{visibleUnreadCount}</span>
        )}
      </button>

      {open && (
        <section className="notification-dropdown" role="dialog" aria-label="Notificações">
          <div className="notification-dropdown-header">
            <div>
              <h2>Notificações</h2>
              <p>{unreadCount ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}</p>
            </div>
            <button
              className="notification-mark-all"
              type="button"
              onClick={onMarkAllRead}
              disabled={!unreadCount}
            >
              <CheckCheck size={15} />
              Marcar todas como lidas
            </button>
          </div>

          <div className="notification-list">
            {loading && !notifications.length && (
              <p className="notification-empty">Carregando notificações...</p>
            )}

            {!loading && !notifications.length && (
              <p className="notification-empty">Você ainda não possui notificações.</p>
            )}

            {notifications.map((notification) => (
              <article
                className={notification.isRead ? 'notification-item' : 'notification-item is-unread'}
                key={notification.id}
              >
                <div className="notification-item-meta">
                  <span className={notification.isRead ? 'notification-status is-read' : 'notification-status'}>
                    {notification.isRead ? 'Lida' : 'Não lida'}
                  </span>
                  <time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time>
                </div>

                <div className="notification-heading-line">
                  {[accountBlockedNotificationType, ownerWarningNotificationType].includes(notification.type) && (
                    <span className="notification-alert-mark" aria-label="Alerta">!</span>
                  )}
                  <h3>{notification.title}</h3>
                </div>
                <p className="notification-message">{notification.message}</p>
                <NotificationDetails notification={notification} />

                {!notification.isRead && (
                  <button
                    className="notification-mark-read"
                    type="button"
                    onClick={() => onMarkRead(notification)}
                  >
                    <Check size={14} />
                    Marcar como lida
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
