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
import {
  applyAccessibilitySettings,
  applyDocumentTranslations,
  getAppSettings,
  startDocumentTranslator,
  subscribeAppSettings,
} from './utils/appSettings'

const defaultAuthEntry = { accountType: 'usuario', mode: 'login' }

function App() {
  const playArena = usePlayArenaApp()
  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem('playarena-theme') === 'dark')
  const [authEntry, setAuthEntry] = useState(defaultAuthEntry)
  const [appSettings, setAppSettings] = useState(getAppSettings)

  useEffect(() => {
    localStorage.setItem('playarena-theme', darkTheme ? 'dark' : 'light')
  }, [darkTheme])

  useEffect(() => {
    applyAccessibilitySettings(appSettings)
    applyDocumentTranslations(appSettings)
  }, [appSettings, playArena.activeView, playArena.session, playArena.toast])

  useEffect(() => subscribeAppSettings(setAppSettings), [])

  useEffect(() => startDocumentTranslator(getAppSettings), [])

  function handleLogout() {
    setAuthEntry(defaultAuthEntry)
    playArena.handleLogout()
  }

  function handleOwnerSignup() {
    setAuthEntry({ accountType: 'proprietario', mode: 'register' })
    playArena.handleLogout()
  }

  if (!playArena.session) {
    return (
      <>
        <AuthScreen
          initialAccountType={authEntry.accountType}
          initialMode={authEntry.mode}
          loading={playArena.loading}
          onLogin={playArena.handleLogin}
          onConfirmRegistration={playArena.handleConfirmRegistration}
          onRegister={playArena.handleRegister}
          onResendRegistrationCode={playArena.handleResendRegistrationCode}
          onRequestPasswordReset={playArena.handleRequestPasswordReset}
          onResetPassword={playArena.handleResetPassword}
          onVerifyPasswordResetCode={playArena.handleVerifyPasswordResetCode}
        />
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
        notificationUnreadCount={playArena.notificationUnreadCount}
        notifications={playArena.notifications}
        notificationsLoading={playArena.notificationsLoading}
        session={playArena.session}
        settings={appSettings}
        onMarkAllNotificationsRead={playArena.handleMarkAllNotificationsRead}
        onMarkNotificationRead={playArena.handleMarkNotificationRead}
        onNavigate={playArena.setActiveView}
        onLogout={handleLogout}
        onRefreshNotifications={playArena.loadNotifications}
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
            onOwnerSignup={handleOwnerSignup}
            onReserve={playArena.setReservationCourt}
            onCancelReservation={playArena.handleCancelReservation}
            onDeleteAccount={playArena.handleDeleteAccount}
            onUpdateProfile={playArena.handleUpdateProfile}
            loading={playArena.loading}
            session={playArena.session}
          />
        )}

        {playArena.session.usuario.perfil === 'proprietario' && (
          <OwnerPortal
            activeView={playArena.activeView}
            session={playArena.session}
            ownerQuadras={playArena.ownerQuadras}
            ownerDocumentacoes={playArena.ownerDocumentacoes}
            ownerReservas={playArena.ownerReservas}
            onCreateCourt={playArena.handleCreateCourt}
            onCreateSchedule={playArena.handleCreateSchedule}
            onStatusReservation={playArena.handleStatusReservation}
<<<<<<< Updated upstream
=======
            onUpdateCourt={playArena.handleUpdateCourt}
            onDeleteAccount={playArena.handleDeleteAccount}
            onUpdateProfile={playArena.handleUpdateProfile}
            onUpdateScheduleAvailability={playArena.handleUpdateScheduleAvailability}
            onNavigate={playArena.setActiveView}
>>>>>>> Stashed changes
            loading={playArena.loading}
          />
        )}

        {playArena.session.usuario.perfil === 'admin' && (
          <AdminPortal
            activeView={playArena.activeView}
            session={playArena.session}
              adminData={{
                ...playArena.adminData,
                quadras: Array.isArray(playArena.adminData.quadras) ? playArena.adminData.quadras : playArena.quadras,
              }}
              loading={playArena.loading}
              onBanUser={playArena.handleBanUser}
              onBlockUserTemporarily={playArena.handleBlockUserTemporarily}
              onChangePassword={playArena.handleChangeAdminPassword}
              onClearSpaceDeactivation={playArena.handleClearAdminSpaceDeactivation}
              onClearUserTemporaryBlock={playArena.handleClearUserTemporaryBlock}
            onCreateAdmin={playArena.handleCreateAdmin}
            onCreateSchedule={playArena.handleCreateSchedule}
            onCreateSpace={playArena.handleCreateAdminSpace}
            onDeactivateSpace={playArena.handleDeactivateAdminSpace}
            onDeleteSchedule={playArena.handleDeleteSchedule}
            onDeleteSpace={playArena.handleDeleteAdminSpace}
            onReviewDocumentation={playArena.handleReviewDocumentation}
            onStatusReservation={playArena.handleStatusReservation}
              onUpdateScheduleAvailability={playArena.handleUpdateScheduleAvailability}
              onUpdateSpace={playArena.handleUpdateAdminSpace}
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
