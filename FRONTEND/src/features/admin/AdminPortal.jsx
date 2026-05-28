import { Building2, DollarSign, Shield, Trophy, Users } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { formatCpf, formatCurrency } from '../../utils/formatters'
import { OwnerReservationList } from '../owner/OwnerReservationList'
import { ProfileView } from '../profile/ProfileView'

export function AdminPortal({ activeView, adminData, session, onStatusReservation, onUserStatus, onOwnerApproval }) {
  const indicadores = adminData.indicadores || {}
  const usuarios = adminData.usuarios || []
  const proprietarios = adminData.proprietarios || []
  const quadras = adminData.quadras || []
  const reservas = adminData.reservas || []

  if (activeView === 'espacos') {
    return (
      <section className="screen-stack">
        <AdminTitle title="Espaços do Administrador" subtitle="Supervisão" />
        <div className="list-stack">
          {quadras.map((quadra) => (
            <article className="list-row" key={quadra.id}>
              <img className="row-thumb" src={quadra.imagem_url} alt="" />
              <div>
                <span className="status-dot status-confirmada">{quadra.ativa === false ? 'inativa' : 'ativa'}</span>
                <h3>{quadra.nome}</h3>
                <p>{quadra.proprietario?.nome_empresa || quadra.proprietario?.nome_responsavel} - {quadra.cidade}</p>
              </div>
              <strong>{formatCurrency(quadra.preco_hora)}</strong>
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (activeView === 'reservas') {
    return (
      <section className="screen-stack">
        <AdminTitle title="Reservas do Administrador" subtitle="Acompanhamento" />
        <OwnerReservationList reservas={reservas} onStatusReservation={onStatusReservation} />
      </section>
    )
  }

  if (activeView === 'usuarios') {
    const accounts = [
      ...usuarios.map((account) => ({ ...account, tipo_conta: 'usuario' })),
      ...proprietarios.map((account) => ({ ...account, tipo_conta: 'proprietario' })),
    ]

    return (
      <section className="screen-stack">
        <AdminTitle title="Usuários do Administrador" subtitle="Contas" />
        <div className="list-stack">
          {accounts.map((account) => (
            <article className="list-row" key={`${account.email}-${account.id}`}>
              <div>
                <span className="status-dot status-confirmada">{account.status || account.status_aprovacao || 'ativo'}</span>
                <h3>{account.nome || account.nome_responsavel || account.nome_empresa}</h3>
                <p>
                  {account.email} - {account.tipo_conta}
                  {account.cpf ? ` - CPF ${formatCpf(account.cpf)}` : ''}
                </p>
              </div>
              {account.tipo_conta === 'usuario' ? (
                <button
                  className={account.status === 'inativo' ? 'secondary-action' : 'danger-action'}
                  type="button"
                  onClick={() => onUserStatus(account, account.status === 'inativo' ? 'ativo' : 'inativo')}
                >
                  {account.status === 'inativo' ? 'Ativar' : 'Bloquear'}
                </button>
              ) : (
                <div className="row-actions">
                  <button className="secondary-action" type="button" onClick={() => onOwnerApproval(account, 'aprovado')}>Aprovar</button>
                  <button className="danger-action" type="button" onClick={() => onOwnerApproval(account, 'reprovado')}>Reprovar</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    )
  }

  if (activeView === 'perfil') {
    return <ProfileView session={session} />
  }

  return (
    <section className="screen-stack admin-dashboard">
      <AdminTitle title="Painel Administrativo" subtitle="Visão geral" />
      <div className="metrics-grid">
        <Metric icon={Users} label="Usuários" value={indicadores.totalUsuarios || usuarios.length} tone="blue" />
        <Metric icon={Building2} label="Proprietários" value={indicadores.totalProprietarios || proprietarios.length} />
        <Metric icon={Trophy} label="Espaços" value={indicadores.totalQuadras || quadras.length} tone="purple" />
        <Metric icon={DollarSign} label="Receita" value={formatCurrency(indicadores.receita || 0)} tone="yellow" />
      </div>
      <section className="plain-panel">
        <h2>Reservas recentes</h2>
        <OwnerReservationList reservas={reservas.slice(0, 4)} onStatusReservation={onStatusReservation} compact />
      </section>
    </section>
  )
}

function AdminTitle({ title, subtitle }) {
  return (
    <div className="admin-title">
      <Shield size={20} />
      <div>
        <span>{subtitle}</span>
        <h1>{title}</h1>
      </div>
    </div>
  )
}
