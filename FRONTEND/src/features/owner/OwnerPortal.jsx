import { useState } from 'react'
<<<<<<< Updated upstream
import { BadgeCheck, Building2, CalendarDays, DollarSign, Plus } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { formatCurrency } from '../../utils/formatters'
=======
import { BadgeCheck, Building2, CalendarDays, DollarSign, LayoutDashboard, LifeBuoy, MapPin, Plus, User, X } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { SiteFooter } from '../../components/SiteFooter'
import { sportLabels, weekDays } from '../../data/demoData'
import { formatCurrency, shortTime } from '../../utils/formatters'
import { SettingsView } from '../profile/SettingsView'
import { SupportView } from '../support/SupportView'
>>>>>>> Stashed changes
import { CourtForm } from './CourtForm'
import { OwnerCourtCard } from './OwnerCourtCard'
import { OwnerProfile } from './OwnerProfile'
import { OwnerReservationList } from './OwnerReservationList'

<<<<<<< Updated upstream
=======
function getCourtAddress(quadra) {
  const addressLine = [quadra.endereco, quadra.numero].filter(Boolean).join(', ')

  return [
    addressLine,
    quadra.bairro,
    quadra.cidade && quadra.estado ? `${quadra.cidade}/${quadra.estado}` : quadra.cidade || quadra.estado,
  ].filter(Boolean).join(' - ')
}

const ownerFooterShortcuts = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'espacos', label: <>Meus espa&ccedil;os</>, icon: Building2 },
  { id: 'reservas', label: 'Reservas', icon: CalendarDays },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
  { id: 'perfil', label: 'Meu perfil', icon: User },
]

function OwnerPortalLayout({ children, onNavigate }) {
  return (
    <div className="screen-stack owner-portal-screen">
      <div className="owner-portal-content">
        {children}
      </div>
      <SiteFooter className="owner-portal-footer" shortcuts={ownerFooterShortcuts} onNavigate={onNavigate} />
    </div>
  )
}

function OwnerCourtDetails({ quadra, onClose }) {
  if (!quadra) {
    return null
  }

  const amenities = quadra.amenities || []
  const schedules = (quadra.horarios_disponiveis || [])
    .filter((schedule) => schedule.disponivel !== false)
    .slice()
    .sort((a, b) => Number(a.dia_semana ?? 0) - Number(b.dia_semana ?? 0) || String(a.hora_inicio).localeCompare(String(b.hora_inicio)))

  return (
    <div className="modal-backdrop">
      <section className="reservation-modal owner-court-details-modal">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <img className="owner-court-detail-image" src={quadra.imagem_url} alt={quadra.nome} />
        <div className="owner-court-detail-heading">
          <span className="tag">{quadra.ativa === false ? 'inativa' : 'ativa'}</span>
          <h2>{quadra.nome}</h2>
          <p>{sportLabels[quadra.modalidade] || quadra.modalidade || 'Modalidade não informada'}</p>
        </div>

        <div className="reservation-detail-lines">
          <span>
            <MapPin size={18} />
            <small>Endereço</small>
            <strong>{getCourtAddress(quadra) || 'Localidade não informada'}</strong>
          </span>
          <span>
            <DollarSign size={18} />
            <small>Valor</small>
            <strong>{formatCurrency(quadra.preco_hora)}/hora</strong>
          </span>
        </div>

        {amenities.length > 0 && (
          <div className="reservation-extra-block">
            <small>Comodidades</small>
            <div className="reservation-chip-list">
              {amenities.map((amenity) => (
                <span key={amenity}>{amenity}</span>
              ))}
            </div>
          </div>
        )}

        <div className="reservation-extra-block">
          <small>Horários cadastrados</small>
          {schedules.length ? (
            <div className="owner-schedule-chip-list">
              {schedules.map((schedule) => (
                <span key={schedule.id || `${schedule.dia_semana}-${schedule.hora_inicio}-${schedule.hora_fim}`}>
                  {weekDays[schedule.dia_semana] || 'Data específica'} {shortTime(schedule.hora_inicio)} - {shortTime(schedule.hora_fim)}
                </span>
              ))}
            </div>
          ) : (
            <p>Nenhum horário cadastrado.</p>
          )}
        </div>

        {quadra.descricao && (
          <div className="reservation-notes">
            <small>Descrição</small>
            <p>{quadra.descricao}</p>
          </div>
        )}
      </section>
    </div>
  )
}

>>>>>>> Stashed changes
export function OwnerPortal({
  activeView,
  session,
  ownerQuadras,
  ownerDocumentacoes,
  ownerReservas,
  onCreateCourt,
  onCreateSchedule,
<<<<<<< Updated upstream
  onStatusReservation,
  loading,
}) {
  const [showForm, setShowForm] = useState(false)
=======
  onDeleteCourt,
  onDeleteSchedule,
  onDeleteAccount,
  onStatusReservation,
  onUpdateCourt,
  onUpdateProfile,
  onUpdateScheduleAvailability,
  onNavigate,
  loading,
}) {
  const [showForm, setShowForm] = useState(false)
  const [selectedOwnerCourtId, setSelectedOwnerCourtId] = useState(null)
  const selectedOwnerCourt = ownerQuadras.find((quadra) => quadra.id === selectedOwnerCourtId) || null
>>>>>>> Stashed changes
  const totalReceita = ownerReservas
    .filter((reserva) => reserva.status !== 'cancelada')
    .reduce((sum, reserva) => sum + Number(reserva.valor_total || 0), 0)

  if (activeView === 'espacos') {
    return (
      <section className="screen-stack">
        <div className="section-title compact">
          <div>
            <span>Gestão</span>
            <h1>Meus Espaços</h1>
          </div>
          <button className="primary-action slim-action" type="button" onClick={() => setShowForm((value) => !value)}>
            <Plus size={17} />
            Novo Espaço
          </button>
        </div>
        {showForm && <CourtForm documentacoes={ownerDocumentacoes} onSubmit={onCreateCourt} loading={loading} token={session.token} />}
        <div className="court-grid">
          {ownerQuadras.map((quadra) => (
<<<<<<< Updated upstream
            <OwnerCourtCard key={quadra.id} quadra={quadra} onCreateSchedule={onCreateSchedule} />
          ))}
        </div>
=======
            <OwnerCourtCard
              key={quadra.id}
              quadra={quadra}
              onCreateSchedule={onCreateSchedule}
              onDeleteCourt={onDeleteCourt}
              onDeleteSchedule={onDeleteSchedule}
              onUpdateCourt={onUpdateCourt}
              onUpdateScheduleAvailability={onUpdateScheduleAvailability}
              onOpen={(quadra) => setSelectedOwnerCourtId(quadra.id)}
            />
          ))}
        </div>
        <OwnerCourtDetails quadra={selectedOwnerCourt} onClose={() => setSelectedOwnerCourtId(null)} />
>>>>>>> Stashed changes
      </section>
    )
  }

  if (activeView === 'reservas') {
    return (
      <section className="screen-stack">
        <div className="section-title compact">
          <div>
            <span>Controle</span>
            <h1>Gerenciar Reservas</h1>
          </div>
        </div>
        <OwnerReservationList reservas={ownerReservas} onStatusReservation={onStatusReservation} />
      </section>
    )
  }

  if (activeView === 'perfil') {
<<<<<<< Updated upstream
    return <OwnerProfile session={session} />
=======
    return withFooter(<OwnerProfile session={session} loading={loading} onDeleteAccount={onDeleteAccount} onUpdateProfile={onUpdateProfile} />)
  }

  if (activeView === 'suporte') {
    return withFooter(<SupportView />)
  }

  if (activeView === 'configuracoes') {
    return withFooter(<SettingsView />)
>>>>>>> Stashed changes
  }

  return (
    <section className="screen-stack">
      <div className="section-title compact">
        <div>
          <span>Resumo</span>
          <h1>Dashboard</h1>
        </div>
      </div>
      <div className="metrics-grid">
        <Metric icon={Building2} label="Meus espaços" value={ownerQuadras.length} />
        <Metric icon={CalendarDays} label="Reservas recebidas" value={ownerReservas.length} tone="blue" />
        <Metric icon={DollarSign} label="Receita estimada" value={formatCurrency(totalReceita)} tone="yellow" />
        <Metric icon={BadgeCheck} label="Status" value={session.usuario?.status_aprovacao || 'pendente'} tone="purple" />
      </div>
      <section className="split-panels">
        <div className="plain-panel">
          <h2>Próximas Reservas</h2>
          <OwnerReservationList reservas={ownerReservas.slice(0, 3)} onStatusReservation={onStatusReservation} compact />
        </div>
        <div className="plain-panel">
          <h2>Meus Espaços</h2>
          <div className="mini-list">
            {ownerQuadras.slice(0, 4).map((quadra) => (
              <span key={quadra.id}>
                <img src={quadra.imagem_url} alt="" />
                {quadra.nome}
              </span>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
