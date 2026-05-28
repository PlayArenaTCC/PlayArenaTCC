import { useState } from 'react'
import { Building2, Eye, EyeOff, IdCard, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Logo } from '../../components/Logo'
import loginBackgroundUrl from '../../../IMG/foto tela de login.png'

export function AuthScreen({ initialAccountType = 'usuario', initialMode = 'login', loading, onLogin, onRegister }) {
  const [mode, setMode] = useState(initialMode)
  const [accountType, setAccountType] = useState(initialAccountType)
  const [showPassword, setShowPassword] = useState(false)
  const initialForm = {
    nome: '',
    nome_empresa: '',
    cpf: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar_senha: '',
  }
  const [form, setForm] = useState(initialForm)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()

    if (mode === 'login') {
      await onLogin({
        email: form.email,
        senha: form.senha,
      })
      return
    }

    const cpfFieldName = accountType === 'proprietario' ? 'cpf_cnpj' : 'cpf'
    const cpfInput = event.currentTarget.elements[cpfFieldName]

    if (!isValidCpf(form[cpfFieldName])) {
      cpfInput.setCustomValidity('CPF invalido.')
      cpfInput.reportValidity()
      return
    }

    const passwordInput = event.currentTarget.elements.senha
    const passwordError = getPasswordError(form.senha)

    if (passwordError) {
      passwordInput.setCustomValidity(passwordError)
      passwordInput.reportValidity()
      return
    }

    if (form.senha !== form.confirmar_senha) {
      const confirmPasswordInput = event.currentTarget.elements.confirmar_senha
      confirmPasswordInput.setCustomValidity('As senhas nao conferem.')
      confirmPasswordInput.reportValidity()
      return
    }

    if (form.telefone && !isValidPhone(form.telefone)) {
      const phoneInput = event.currentTarget.elements.telefone
      phoneInput.setCustomValidity('Telefone deve seguir o formato 44 99921435.')
      phoneInput.reportValidity()
      return
    }

    if (accountType === 'proprietario') {
      await onRegister({
        perfil: 'proprietario',
        nome_responsavel: form.nome,
        nome_empresa: form.nome_empresa,
        cpf_cnpj: form.cpf_cnpj,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
        confirmar_senha: form.confirmar_senha,
      })
      setForm(initialForm)
      return
    }

    await onRegister({
      perfil: 'usuario',
      nome: form.nome,
      cpf: form.cpf,
      email: form.email,
      telefone: form.telefone,
      senha: form.senha,
      confirmar_senha: form.confirmar_senha,
    })
    setForm(initialForm)
  }

  return (
    <main
      className="auth-page"
      style={{ '--auth-bg': `url("${loginBackgroundUrl}")` }}
    >
      <section className="auth-hero">
        <form className="auth-panel" onSubmit={submit} autoComplete="off">
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
                    name="nome"
                    autoComplete="name"
                    value={form.nome}
                    onChange={(event) => updateField('nome', event.target.value)}
                    placeholder={accountType === 'proprietario' ? 'Nome do responsavel' : 'Seu nome'}
                    required
                  />
                </div>
              </label>
            )}

            {mode === 'register' && accountType === 'usuario' && (
              <label className="field">
                <span>CPF</span>
                <div className="input-with-icon">
                  <IdCard size={18} />
                  <input
                    name="cpf"
                    value={form.cpf}
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('cpf', formatCpf(event.target.value))
                    }}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    autoComplete="off"
                    minLength={14}
                    maxLength={14}
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
                    name="nome_empresa"
                    autoComplete="organization"
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
                  name="email"
                  autoComplete="email"
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
                    name="telefone"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="\d{2} \d{8}"
                    maxLength={11}
                    value={form.telefone}
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('telefone', formatPhone(event.target.value))
                    }}
                    placeholder="44 99921435"
                  />
                </div>
              </label>
            )}

            {mode === 'register' && accountType === 'proprietario' && (
              <label className="field">
                <span>CPF</span>
                <div className="input-with-icon">
                  <IdCard size={18} />
                  <input
                    name="cpf_cnpj"
                    value={form.cpf_cnpj}
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('cpf_cnpj', formatCpf(event.target.value))
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    minLength={14}
                    maxLength={14}
                    required
                    placeholder="000.000.000-00"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Senha</span>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  name="senha"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.senha}
                  onChange={(event) => {
                    event.target.setCustomValidity('')
                    event.currentTarget.form?.elements.confirmar_senha?.setCustomValidity('')
                    updateField('senha', event.target.value)
                  }}
                  placeholder="Ex.: Teste@123"
                  required
                  minLength={8}
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

            {mode === 'register' && (
              <label className="field">
                <span>Confirmar senha</span>
                <div className="input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    name="confirmar_senha"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmar_senha}
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('confirmar_senha', event.target.value)
                    }}
                    placeholder="Digite a senha novamente"
                    required
                    minLength={8}
                  />
                </div>
              </label>
            )}

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

function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11)

  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 10)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)} ${digits.slice(2)}`
}

function isValidPhone(value) {
  return /^\d{2} \d{8}$/.test(String(value || ''))
}

function isValidCpf(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false
  }

  const firstCheckDigit = calculateCpfCheckDigit(digits.slice(0, 9))
  const secondCheckDigit = calculateCpfCheckDigit(digits.slice(0, 10))

  return firstCheckDigit === Number(digits[9]) && secondCheckDigit === Number(digits[10])
}

function calculateCpfCheckDigit(baseDigits) {
  const factor = baseDigits.length + 1
  const sum = baseDigits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0)
  const remainder = (sum * 10) % 11

  return remainder === 10 ? 0 : remainder
}

function getPasswordError(password) {
  const hasRequiredLength = String(password || '').length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialCharacter = /[^\w\s]|_/.test(password)

  if (hasRequiredLength && hasUppercase && hasNumber && hasSpecialCharacter) {
    return ''
  }

  return 'A senha deve ter ao menos 8 caracteres, uma letra maiuscula, um numero e um caractere especial.'
}
