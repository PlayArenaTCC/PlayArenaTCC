import { CourtDetail } from '../courts/CourtDetail'
import { HomeView } from '../courts/HomeView'
import { SearchView } from '../courts/SearchView'
import { MapView } from '../map/MapView'
import { ProfileView } from '../profile/ProfileView'
import { SettingsView } from '../profile/SettingsView'
import { ReservationList } from '../reservations/ReservationList'
import { SupportView } from '../support/SupportView'

export function UserPortal({
  activeView,
  setActiveView,
  quadras,
  reservas,
  searchQuery,
  setSearchQuery,
  selectedCourt,
  onOpenCourt,
  onOwnerSignup,
  onReserve,
  onCancelReservation,
  onDeleteAccount,
  onUpdateProfile,
  loading,
  session,
}) {
  if (activeView === 'buscar') {
    return <SearchView initialQuery={searchQuery} quadras={quadras} onOpenCourt={onOpenCourt} />
  }

  if (activeView === 'detalhe' && selectedCourt) {
    return <CourtDetail quadra={selectedCourt} onBack={() => setActiveView('buscar')} onReserve={onReserve} />
  }

  if (activeView === 'minhas-reservas') {
    return (
      <section className="screen-stack">
        <div className="section-title compact">
          <div>
            <span>Acompanhamento</span>
            <h1>Minhas Reservas</h1>
          </div>
        </div>
        <ReservationList reservas={reservas} onCancel={onCancelReservation} />
      </section>
    )
  }

  if (activeView === 'mapa') {
    return <MapView quadras={quadras} onOpenCourt={onOpenCourt} />
  }

  if (activeView === 'suporte') {
    return <SupportView />
  }

  if (activeView === 'perfil') {
    return <ProfileView session={session} loading={loading} onDeleteAccount={onDeleteAccount} onUpdateProfile={onUpdateProfile} />
  }

  if (activeView === 'configuracoes') {
    return <SettingsView />
  }

  return (
    <HomeView
      quadras={quadras}
      onNavigate={setActiveView}
      onOpenCourt={onOpenCourt}
      onOwnerSignup={onOwnerSignup}
      onSearch={(query) => {
        setSearchQuery(query)
        setActiveView('buscar')
      }}
    />
  )
}
