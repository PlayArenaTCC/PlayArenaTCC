import { useState } from 'react'
import { LogOut, Menu, User } from 'lucide-react'
import { Logo } from '../components/Logo'

export function AppHeader({ activeView, navItems, session, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false)

  function navigate(view) {
    onNavigate(view)
    setOpen(false)
  }

  return (
    <header className="app-header">
      <Logo />
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
            {item.label}
          </button>
        ))}
      </nav>
      <div className="account-pill">
        <span className="avatar-dot">
          <User size={16} />
        </span>
        <span>{session.usuario?.nome || session.usuario?.nome_responsavel || session.usuario?.nome_empresa || 'Conta'}</span>
        <button type="button" onClick={onLogout} aria-label="Sair">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
