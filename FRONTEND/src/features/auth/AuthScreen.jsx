import { useState } from 'react'
import { Mail, LockKeyhole } from 'lucide-react'
import { Logo } from '../../components/Logo'

export function AuthScreen({ loading, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    nome: '',
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

    onRegister({
      perfil: 'usuario',
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      senha: form.senha,
    })
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <form className="auth-panel" onSubmit={submit}>
          <div className="auth-logo-orbit">
            <Logo compact />
          </div>
          <h1>{mode === 'login' ? 'Welcome to PlayArena' : 'Create your account'}</h1>
          <p>{mode === 'login' ? 'Sign in to continue' : 'Sign up to start booking spaces'}</p>

          <button className="google-action" type="button">
            <span>G</span>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {mode === 'register' && (
            <label className="field">
              <span>Nome completo</span>
              <input value={form.nome} onChange={(event) => updateField('nome', event.target.value)} placeholder="Seu nome" />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={18} />
              <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" />
            </div>
          </label>

          {mode === 'register' && (
            <label className="field">
              <span>Telefone</span>
              <input value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} placeholder="(44) 99999-0000" />
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input type="password" value={form.senha} onChange={(event) => updateField('senha', event.target.value)} placeholder="********" />
            </div>
          </label>

          <button className="primary-action" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>

          <div className="auth-links">
            {mode === 'login' && <button className="ghost-link" type="button">Forgot password?</button>}
            <button
              className="text-switch"
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
