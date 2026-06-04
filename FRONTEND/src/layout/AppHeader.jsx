import { useState } from 'react'
import { LogOut, Menu, Moon, Sun, User } from 'lucide-react'
import { Logo } from '../components/Logo'
import { NotificationBell } from '../components/NotificationBell'
import { translateNavLabel } from '../utils/appSettings'

export function AppHeader({
  activeView,
  darkTheme,
  navItems,
  notificationUnreadCount,
  notifications,
  notificationsLoading,
  session,
  settings,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onNavigate,
  onLogout,
  onRefreshNotifications,
  onToggleTheme,
}) {
  const [open, setOpen] = useState(false)
  const accountName = session.usuario?.nome || session.usuario?.nome_responsavel || session.usuario?.nome_empresa || 'Conta'
  const avatarUrl = session.usuario?.foto_perfil_url

  function navigate(view, { scrollTop = false } = {}) {
    onNavigate(view)
    setOpen(false)
    if (scrollTop) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }

  function goHome() {
    navigate('home', { scrollTop: true })
  }

  return (
    <header className="app-header">
      <button className="logo-button" type="button" onClick={goHome} aria-label="Voltar ao início">
        <Logo />
      </button>
      <button className="icon-button menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? 'nav-link is-active' : 'nav-link'}
            type="button"
            onClick={() => navigate(item.id)}
          >
            <item.icon size={16} />
            {session.usuario?.perfil === 'admin' && item.id === 'espacos'
              ? item.label
              : translateNavLabel(item.id, item.label, settings)}
          </button>
        ))}
      </nav>
      {session.usuario?.perfil === 'usuario' && (
        <NotificationBell
          loading={notificationsLoading}
          notifications={notifications}
          unreadCount={notificationUnreadCount}
          onMarkAllRead={onMarkAllNotificationsRead}
          onMarkRead={onMarkNotificationRead}
          onRefresh={onRefreshNotifications}
        />
      )}
      <button
        className="icon-button theme-toggle"
        type="button"
        onClick={onToggleTheme}
        aria-label={darkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
        title={darkTheme ? 'Tema claro' : 'Tema escuro'}
      >
        {darkTheme ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <div className="account-pill">
        <button
          className={activeView === 'perfil' ? 'account-profile-button is-active' : 'account-profile-button'}
          type="button"
          onClick={() => navigate('perfil', { scrollTop: true })}
          aria-current={activeView === 'perfil' ? 'page' : undefined}
          aria-label="Abrir meu perfil"
          title="Meu perfil"
        >
          <span className="avatar-dot" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <User size={16} />}
          </span>
          <span className="account-name">{accountName}</span>
        </button>
        <button className="account-logout" type="button" onClick={onLogout} aria-label="Sair" title="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
