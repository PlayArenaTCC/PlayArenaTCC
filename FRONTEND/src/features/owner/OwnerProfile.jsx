import { BadgeCheck } from 'lucide-react'
import { ProfileView } from '../profile/ProfileView'

const ownerApprovalLabels = {
  aprovado: 'Perfil aprovado',
  pendente: 'Perfil em análise',
  reprovado: 'Perfil Reprovado',
}

function ownerApprovalTone(status) {
  if (status === 'reprovado') {
    return 'is-rejected'
  }

  if (status === 'pendente') {
    return 'is-pending'
  }

  return 'is-approved'
}

export function OwnerProfile({ session, loading, onDeleteAccount, onUpdateProfile }) {
  const profile = session.usuario || {}
  const approvalStatus = profile.status_aprovacao || 'pendente'

  return (
    <section className="screen-stack">
      <div className="section-title compact">
        <div>
          <span>Cadastro empresarial</span>
          <h1>Meu Perfil Empresarial</h1>
        </div>
      </div>
      <div className={`verified-banner ${ownerApprovalTone(approvalStatus)}`}>
        <BadgeCheck size={20} />
        {ownerApprovalLabels[approvalStatus] || `Perfil ${approvalStatus}`}
      </div>
      <ProfileView session={session} loading={loading} onDeleteAccount={onDeleteAccount} onUpdateProfile={onUpdateProfile} />
    </section>
  )
}
