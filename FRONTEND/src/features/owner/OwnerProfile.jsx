import { BadgeCheck } from 'lucide-react'
import { ProfileView } from '../profile/ProfileView'

export function OwnerProfile({ session, loading, onUpdateProfile }) {
  const profile = session.usuario || {}

  return (
    <section className="screen-stack">
      <div className="section-title compact">
        <div>
          <span>Cadastro empresarial</span>
          <h1>Meu Perfil Empresarial</h1>
        </div>
      </div>
      <div className="verified-banner">
        <BadgeCheck size={20} />
        Perfil {profile.status_aprovacao || 'pendente'}
      </div>
      <ProfileView session={session} loading={loading} onUpdateProfile={onUpdateProfile} />
    </section>
  )
}
