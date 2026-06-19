import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut, Menu, Moon, Sun, User, TriangleAlert } from 'lucide-react'
import { Logo } from '../components/Logo'
import { NotificationBell } from '../components/NotificationBell'
import { translateNavLabel } from '../utils/appSettings'
import dancingAlienUrl from '../../STEREGG/Alien Dance GIF - Alien Dance Groovy - Discover & Share GIFs.gif'

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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dropdownTimeout, setDropdownTimeout] = useState(null)
  const logoButtonRef = useRef(null)
  const logoTapCountRef = useRef(0)
  const [showDancingAlien, setShowDancingAlien] = useState(false)
  const accountName = session.usuario?.nome || session.usuario?.nome_responsavel || session.usuario?.nome_empresa || 'Conta'
  const avatarUrl = session.usuario?.foto_perfil_url
  const isAdmin = session.usuario?.perfil === 'admin'
  const isUser = session.usuario?.perfil === 'usuario'
  const requiredLogoTaps = 20

  useEffect(() => {
    function resetLogoTapCount(event) {
      if (logoButtonRef.current?.contains(event.target)) {
        return
      }

      logoTapCountRef.current = 0
    }

    document.addEventListener('pointerdown', resetLogoTapCount, true)
    document.addEventListener('keydown', resetLogoTapCount, true)
    document.addEventListener('wheel', resetLogoTapCount, true)

    return () => {
      document.removeEventListener('pointerdown', resetLogoTapCount, true)
      document.removeEventListener('keydown', resetLogoTapCount, true)
      document.removeEventListener('wheel', resetLogoTapCount, true)
    }
  }, [])

  function navigate(view, { scrollTop = false } = {}) {
    onNavigate(view)
    setOpen(false)
    setDropdownOpen(false)
    if (scrollTop) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  }

  function handleDropdownMouseLeave() {
    const timeout = setTimeout(() => {
      setDropdownOpen(false)
    }, 200)
    setDropdownTimeout(timeout)
  }

  function handleDropdownMouseEnter() {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout)
      setDropdownTimeout(null)
    }
    setDropdownOpen(true)
  }

  function goHome() {
    navigate('home', { scrollTop: true })
  }

  function handleLogoClick() {
    goHome()

    if (!isUser) {
      logoTapCountRef.current = 0
      return
    }

    logoTapCountRef.current += 1

    if (logoTapCountRef.current >= requiredLogoTaps) {
      setShowDancingAlien(true)
      logoTapCountRef.current = 0
    }
  }

  function renderAdminUsersMenu(item) {
    if (!isAdmin || item.id !== 'usuarios') {
      return null
    }

    const isActive = activeView === item.id || activeView === 'avisos'

    return (
      <div
        className="nav-dropdown-group admin-users-menu"
        onMouseLeave={handleDropdownMouseLeave}
        onMouseEnter={handleDropdownMouseEnter}
      >
        <button
          className={isActive ? 'nav-link is-active' : 'nav-link'}
          type="button"
          onClick={() => navigate('usuarios')}
        >
          <item.icon size={16} />
          {translateNavLabel(item.id, item.label, settings)}
        </button>
        {dropdownOpen && (
          <div className="nav-dropdown-menu">
            <button
              className="nav-dropdown-item"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                navigate('avisos')
              }}
            >
              <TriangleAlert size={16} />
              <span>Avisos</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  const dancingAlienOverlay = showDancingAlien && isUser && (
    <div className="steregg-backdrop" role="dialog" aria-modal="true" aria-label="Alien dançando" onClick={() => setShowDancingAlien(false)}>
      <button className="steregg-stage" type="button" onClick={() => setShowDancingAlien(false)} aria-label="Fechar alien dançando">
        <img src={dancingAlienUrl} alt="Alien dançando" />
      </button>
    </div>
  )

  return (
    <>
      <header className={isUser ? 'app-header user-app-header' : 'app-header'}>
      <button ref={logoButtonRef} className="logo-button" type="button" onClick={handleLogoClick} aria-label="Voltar ao início">
        <Logo />
      </button>
      <button className="icon-button menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        {navItems.map((item) => (
          item.id === 'usuarios' && isAdmin ? (
            <div key={item.id}>
              {renderAdminUsersMenu(item)}
            </div>
          ) : (
            <button
              key={item.id}
              className={activeView === item.id ? 'nav-link is-active' : 'nav-link'}
              type="button"
              onClick={() => navigate(item.id)}
            >
              <item.icon size={16} />
              {isAdmin && item.id === 'espacos'
                ? item.label
                : translateNavLabel(item.id, item.label, settings)}
            </button>
          )
        ))}
      </nav>
      <div className="header-right">
        {['usuario', 'proprietario'].includes(session.usuario?.perfil) && (
          <NotificationBell
            loading={notificationsLoading}
            notifications={notifications}
            unreadCount={notificationUnreadCount}
            onMarkAllRead={onMarkAllNotificationsRead}
            onMarkRead={onMarkNotificationRead}
            onRefresh={onRefreshNotifications}
          />
        )}
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
          <button
            className="icon-button theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={darkTheme ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={darkTheme ? 'Tema claro' : 'Tema escuro'}
          >
            {darkTheme ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="account-logout" type="button" onClick={onLogout} aria-label="Sair" title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      </header>
      {dancingAlienOverlay && createPortal(dancingAlienOverlay, document.body)}
    </>
  )
}
