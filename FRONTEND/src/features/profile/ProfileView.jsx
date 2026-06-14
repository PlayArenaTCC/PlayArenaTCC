import { roleLabels } from '../../data/demoData'

export function ProfileView({ session }) {
  const profile = session.usuario || {}
  const nome = profile.nome || profile.nome_responsavel || profile.nome_empresa || 'Usuario PlayArena'

  return (
    <section className="profile-screen">
      <div className="profile-hero">
        <span>{nome.slice(0, 1).toUpperCase()}</span>
        <h1>{nome}</h1>
        <p>{roleLabels[profile.perfil]}</p>
      </div>
      <div className="settings-list">
        <label className="field">
          <span>E-mail</span>
          <input value={profile.email || ''} readOnly />
        </label>
        <label className="field">
          <span>Telefone</span>
          <input value={profile.telefone || 'Nao informado'} readOnly />
        </label>
        {profile.nome_empresa && (
          <label className="field">
            <span>Empresa</span>
            <input value={profile.nome_empresa} readOnly />
          </label>
        )}
      </div>
    </section>
  )
}
