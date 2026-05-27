import { useState } from 'react'
import { Building2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Logo } from '../../components/Logo'
import loginBackgroundUrl from '../../../IMG/foto tela de login.png'

export function AuthScreen({ loading, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [accountType, setAccountType] = useState('usuario')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    nome_empresa: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    senha: '',
  })

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()

    if (mode === 'login') {
      onLogin({
        email: form.email,
        senha: form.senha,
      })
      return
    }

    if (accountType === 'proprietario') {
      onRegister({
        perfil: 'proprietario',
        nome_responsavel: form.nome,
        nome_empresa: form.nome_empresa,
        cpf_cnpj: form.cpf_cnpj,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
      })
      return
    }

    onRegister({
      perfil: 'usuario',
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      senha: form.senha,
    })
  }

  return (
    <main
      className="auth-page"
      style={{ '--auth-bg': `url("${loginBackgroundUrl}")` }}
    >
      <section className="auth-hero">
        <form className="auth-panel" onSubmit={submit}>
          <div className="auth-form-content">
            <div className="auth-logo-orbit">
              <Logo compact />
            </div>
            <h2>
              {mode === 'login' ? 'Faca seu login' : 'Crie sua conta'}
              <span aria-hidden="true">.</span>
            </h2>
            <p>{mode === 'login' ? 'Acesse sua conta PLAYARENA.' : 'Escolha seu perfil e comece na PLAYARENA.'}</p>

            {mode === 'register' && (
              <div className="auth-account-type" aria-label="Tipo de cadastro">
                <button
                  className={accountType === 'usuario' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setAccountType('usuario')}
                >
                  <UserRound size={17} />
                  Usuario
                </button>
                <button
                  className={accountType === 'proprietario' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setAccountType('proprietario')}
                >
                  <Building2 size={17} />
                  Proprietario
                </button>
              </div>
            )}

            {mode === 'register' && (
              <label className="field">
                <span>{accountType === 'proprietario' ? 'Responsavel' : 'Nome completo'}</span>
                <div className="input-with-icon">
                  <UserRound size={18} />
                  <input
                    value={form.nome}
                    onChange={(event) => updateField('nome', event.target.value)}
                    placeholder={accountType === 'proprietario' ? 'Nome do responsavel' : 'Seu nome'}
                    required
                  />
                </div>
              </label>
            )}

            {mode === 'register' && accountType === 'proprietario' && (
              <label className="field">
                <span>Nome da arena</span>
                <div className="input-with-icon">
                  <Building2 size={18} />
                  <input
                    value={form.nome_empresa}
                    onChange={(event) => updateField('nome_empresa', event.target.value)}
                    placeholder="Arena, clube ou empresa"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="voce@email.com"
                  required
                />
              </div>
            </label>

            {mode === 'register' && (
              <label className="field">
                <span>Telefone</span>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input
                    value={form.telefone}
                    onChange={(event) => updateField('telefone', event.target.value)}
                    placeholder="(44) 99999-0000"
                  />
                </div>
              </label>
            )}

            {mode === 'register' && accountType === 'proprietario' && (
              <label className="field">
                <span>CPF ou CNPJ</span>
                <div className="input-with-icon">
                  <Building2 size={18} />
                  <input
                    value={form.cpf_cnpj}
                    onChange={(event) => updateField('cpf_cnpj', event.target.value)}
                    placeholder="Documento do proprietario"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Senha</span>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.senha}
                  onChange={(event) => updateField('senha', event.target.value)}
                  placeholder="Minimo de 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  className="password-toggle"
                  type="button"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="auth-actions">
              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Cadastre-se'}
              </button>
            </div>

            {mode === 'login' && (
              <div className="auth-links">
                <button className="ghost-link" type="button">Esqueci minha senha</button>
              </div>
            )}

            <div className="auth-switch-row">
              <button
                className="text-switch"
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Ainda nao tenho uma conta?' : 'Ja tenho uma conta?'}
              </button>
            </div>
          </div>

          <div className="auth-panel-media" aria-hidden="true" />
        </form>
      </section>
    </main>
  )
}
