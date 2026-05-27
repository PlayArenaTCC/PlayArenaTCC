import { useEffect, useState } from 'react'
import './App.css'
import { Toast } from './components/Toast'
import { AdminPortal } from './features/admin/AdminPortal'
import { AuthScreen } from './features/auth/AuthScreen'
import { OwnerPortal } from './features/owner/OwnerPortal'
import { ReservationModal } from './features/reservations/ReservationModal'
import { ReservationSuccess } from './features/reservations/ReservationSuccess'
import { UserPortal } from './features/user/UserPortal'
import { usePlayArenaApp } from './hooks/usePlayArenaApp'
import { AppHeader } from './layout/AppHeader'

function App() {
  const playArena = usePlayArenaApp()
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('playarena-theme') === 'dark')

  useEffect(() => {
    localStorage.setItem('playarena-theme', darkTheme ? 'dark' : 'light')
  }, [darkTheme])

  if (!playArena.session) {
    return (
      <>
        <AuthScreen loading={playArena.loading} onLogin={playArena.handleLogin} onRegister={playArena.handleRegister} />
        <Toast message={playArena.toast} onClose={() => playArena.setToast('')} />
      </>
    )
  }

  return (
    <main className={darkTheme ? 'app-shell dark-theme' : 'app-shell'}>
      <AppHeader
        activeView={playArena.activeView}
        darkTheme={darkTheme}
        navItems={playArena.navItems}
        session={playArena.session}
        onNavigate={playArena.setActiveView}
        onLogout={playArena.handleLogout}
        onToggleTheme={() => setDarkTheme((current) => !current)}
      />

      <div className="workspace">
        {playArena.session.usuario.perfil === 'usuario' && (
          <UserPortal
            activeView={playArena.activeView}
            setActiveView={playArena.setActiveView}
            quadras={playArena.quadras}
            reservas={playArena.reservas}
            searchQuery={playArena.searchQuery}
            setSearchQuery={playArena.setSearchQuery}
            selectedCourt={playArena.selectedCourt}
            onOpenCourt={playArena.openCourt}
            onReserve={playArena.setReservationCourt}
            onCancelReservation={playArena.handleCancelReservation}
            session={playArena.session}
          />
        )}

        {playArena.session.usuario.perfil === 'proprietario' && (
          <OwnerPortal
            activeView={playArena.activeView}
            session={playArena.session}
            ownerQuadras={playArena.ownerQuadras.length ? playArena.ownerQuadras : playArena.quadras.slice(0, 1)}
            ownerReservas={playArena.ownerReservas}
            onCreateCourt={playArena.handleCreateCourt}
            onCreateSchedule={playArena.handleCreateSchedule}
            onStatusReservation={playArena.handleStatusReservation}
            loading={playArena.loading}
          />
        )}

        {playArena.session.usuario.perfil === 'admin' && (
          <AdminPortal
            activeView={playArena.activeView}
            adminData={{
              ...playArena.adminData,
              quadras: playArena.adminData.quadras?.length ? playArena.adminData.quadras : playArena.quadras,
            }}
            onStatusReservation={playArena.handleStatusReservation}
            onUserStatus={playArena.handleUserStatus}
            onOwnerApproval={playArena.handleOwnerApproval}
          />
        )}
      </div>

      <ReservationModal
        quadra={playArena.reservationCourt}
        token={playArena.session.token}
        onClose={() => playArena.setReservationCourt(null)}
        onConfirm={playArena.handleReservation}
      />
      <ReservationSuccess
        reserva={playArena.lastReservation}
        onClose={() => {
          playArena.setLastReservation(null)
          playArena.setActiveView('minhas-reservas')
        }}
      />
      <Toast message={playArena.toast} onClose={() => playArena.setToast('')} />
    </main>
  )
}

export default App
