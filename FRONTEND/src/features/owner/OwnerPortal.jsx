import { useState } from 'react'
import { BadgeCheck, Building2, CalendarDays, DollarSign, Plus } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { formatCurrency } from '../../utils/formatters'
import { CourtForm } from './CourtForm'
import { OwnerCourtCard } from './OwnerCourtCard'
import { OwnerProfile } from './OwnerProfile'
import { OwnerReservationList } from './OwnerReservationList'

export function OwnerPortal({
  activeView,
  session,
  ownerQuadras,
  ownerReservas,
  onCreateCourt,
  onCreateSchedule,
  onStatusReservation,
  loading,
}) {
  const [showForm, setShowForm] = useState(false)
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
        {showForm && <CourtForm onSubmit={onCreateCourt} loading={loading} />}
        <div className="court-grid">
          {ownerQuadras.map((quadra) => (
            <OwnerCourtCard key={quadra.id} quadra={quadra} onCreateSchedule={onCreateSchedule} />
          ))}
        </div>
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
    return <OwnerProfile session={session} />
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
