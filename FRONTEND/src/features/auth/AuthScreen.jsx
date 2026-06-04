import { useState } from 'react'
import { Building2, Eye, EyeOff, IdCard, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { formatPhone, isValidPhone } from '../../utils/formatters'
import loginBackgroundUrl from '../../../IMG/foto tela de login.png'

export function AuthScreen({
  initialAccountType = 'usuario',
  initialMode = 'login',
  loading,
  onConfirmRegistration,
  onLogin,
  onRegister,
  onResendRegistrationCode,
  onRequestPasswordReset,
  onResetPassword,
  onVerifyPasswordResetCode,
}) {
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
  const [pendingVerification, setPendingVerification] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const initialResetForm = {
    email: '',
    codigo: '',
    senha: '',
    confirmar_senha: '',
  }
  const [passwordReset, setPasswordReset] = useState(null)
  const [resetForm, setResetForm] = useState(initialResetForm)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateResetField(field, value) {
    setResetForm((current) => ({ ...current, [field]: value }))
  }

  function showFieldError(formElement, fieldName, message) {
    const input = formElement.elements[fieldName]

    if (!input || !message) {
      return false
    }

    input.setCustomValidity(message)
    input.reportValidity()
    return true
  }

  function validateRequiredField(formElement, fieldName, message) {
    const input = formElement.elements[fieldName]

    if (!String(input?.value || '').trim()) {
      return showFieldError(formElement, fieldName, message)
    }

    return false
  }

  function validateEmailField(formElement, fieldName, value) {
    const error = getEmailError(value)
    return error ? showFieldError(formElement, fieldName, error) : false
  }

  function validatePasswordFields(formElement, password, confirmPassword, confirmFieldName = 'confirmar_senha') {
    const passwordError = getPasswordError(password)

    if (passwordError) {
      return showFieldError(formElement, 'senha', passwordError)
    }

    if (!confirmPassword) {
      return showFieldError(formElement, confirmFieldName, 'Confirme a senha.')
    }

    if (password !== confirmPassword) {
      return showFieldError(formElement, confirmFieldName, 'As senhas nao conferem.')
    }

    return false
  }

  async function requestEmailVerification(payload) {
    const response = await onRegister(payload)

    if (response?.verification_id) {
      setPendingVerification({
        ...response,
        email: payload.email,
        perfil: payload.perfil,
      })
      setVerificationCode('')
    }
  }

  async function resendVerificationCode() {
    if (!pendingVerification) {
      return
    }

    const response = await onResendRegistrationCode?.({
      verification_id: pendingVerification.verification_id,
    })

    if (response?.verification_id) {
      setPendingVerification((current) => ({
        ...current,
        ...response,
      }))
      setVerificationCode('')
    }
  }

  async function submitPasswordReset(formElement) {
    if (!passwordReset) {
      if (validateEmailField(formElement, 'reset_email', resetForm.email)) {
        return
      }

      const response = await onRequestPasswordReset?.({
        email: resetForm.email,
      })

      if (response?.reset_id) {
        setPasswordReset({
          ...response,
          verified: false,
        })
        updateResetField('codigo', '')
      }

      return
    }

    const normalizedCode = resetForm.codigo.replace(/\D/g, '')

    if (!/^\d{4,10}$/.test(normalizedCode)) {
      showFieldError(formElement, 'reset_codigo', 'Informe o codigo numerico recebido por e-mail.')
      return
    }

    if (!passwordReset.verified) {
      const response = await onVerifyPasswordResetCode?.({
        reset_id: passwordReset.reset_id,
        codigo: normalizedCode,
      })

      if (response?.reset_id) {
        setPasswordReset((current) => ({
          ...current,
          ...response,
          verified: true,
        }))
      }

      return
    }

    if (validatePasswordFields(formElement, resetForm.senha, resetForm.confirmar_senha, 'reset_confirmar_senha')) {
      return
    }

    const updated = await onResetPassword?.({
      reset_id: passwordReset.reset_id,
      codigo: normalizedCode,
      senha: resetForm.senha,
      confirmar_senha: resetForm.confirmar_senha,
    })

    if (updated) {
      setPasswordReset(null)
      setResetForm(initialResetForm)
      setMode('login')
    }
  }

  async function submit(event) {
    event.preventDefault()
    const formElement = event.currentTarget

    if (mode === 'forgot') {
      await submitPasswordReset(formElement)
      return
    }

    if (pendingVerification) {
      const normalizedCode = verificationCode.replace(/\D/g, '')

      if (!/^\d{4,10}$/.test(normalizedCode)) {
        showFieldError(formElement, 'codigo_email', 'Informe o codigo numerico recebido por e-mail.')
        return
      }

      const confirmed = await onConfirmRegistration?.({
        verification_id: pendingVerification.verification_id,
        codigo: normalizedCode,
      })

      if (confirmed) {
        setPendingVerification(null)
        setVerificationCode('')
        setForm(initialForm)
        setMode('login')
      }

      return
    }

    if (mode === 'login') {
      if (validateEmailField(formElement, 'email', form.email)) {
        return
      }

      if (validateRequiredField(formElement, 'senha', 'Informe a senha.')) {
        return
      }

      await onLogin({
        email: form.email,
        senha: form.senha,
      })
      return
    }

    if (validateRequiredField(formElement, 'nome', accountType === 'proprietario' ? 'Informe o nome do responsavel.' : 'Informe o nome completo.')) {
      return
    }

    if (accountType === 'usuario' && !isValidCpf(form.cpf)) {
      showFieldError(formElement, 'cpf', getCpfError(form.cpf))
      return
    }

    if (validateEmailField(formElement, 'email', form.email)) {
      return
    }

    if (form.telefone && !isValidPhone(form.telefone)) {
      showFieldError(formElement, 'telefone', 'Telefone deve ter DDD e 8 ou 9 digitos. Exemplo: 44 999921435.')
      return
    }

    if (accountType === 'proprietario' && !isValidCpf(form.cpf_cnpj)) {
      showFieldError(formElement, 'cpf_cnpj', getCpfError(form.cpf_cnpj))
      return
    }

    if (validatePasswordFields(formElement, form.senha, form.confirmar_senha)) {
      return
    }

    if (accountType === 'proprietario') {
      await requestEmailVerification({
        perfil: 'proprietario',
        nome_responsavel: form.nome,
        nome_empresa: form.nome_empresa,
        cpf_cnpj: form.cpf_cnpj,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
        confirmar_senha: form.confirmar_senha,
      })
      return
    }

    await requestEmailVerification({
      perfil: 'usuario',
      nome: form.nome,
      cpf: form.cpf,
      email: form.email,
      telefone: form.telefone,
      senha: form.senha,
      confirmar_senha: form.confirmar_senha,
    })
  }

  return (
    <main
      className="auth-page"
      style={{ '--auth-bg': `url("${loginBackgroundUrl}")` }}
    >
      <section className="auth-hero">
        <form className="auth-panel" onSubmit={submit} autoComplete="off" noValidate>
          <div className="auth-form-content">
            <div className="auth-logo-orbit">
              <Logo compact />
            </div>
            <h2>
              {pendingVerification
                ? 'Verifique seu e-mail'
                : mode === 'forgot'
                  ? 'Recupere sua senha'
                  : mode === 'login'
                    ? 'Faca seu login'
                    : 'Crie sua conta'}
              <span aria-hidden="true">.</span>
            </h2>
            <p>
              {pendingVerification
                ? `Enviamos um codigo para ${pendingVerification.email}.`
                : mode === 'forgot'
                  ? 'Informe seu e-mail cadastrado e valide o codigo para trocar a senha.'
                : mode === 'login'
                  ? 'Acesse sua conta PLAYARENA.'
                  : 'Escolha seu perfil e comece na PLAYARENA.'}
            </p>

            {pendingVerification ? (
              <>
                <div className="auth-verification-card">
                  <div className="verification-icon" aria-hidden="true">
                    <ShieldCheck size={26} />
                  </div>
                  <strong>
                    {pendingVerification.email_provider === 'local' ? 'Codigo de teste gerado' : 'Codigo enviado por e-mail'}
                  </strong>
                  <span>
                    {pendingVerification.email_provider === 'local'
                      ? 'Veja o codigo no terminal do backend para concluir o teste.'
                      : 'Digite o codigo recebido no e-mail para concluir seu cadastro.'}
                  </span>
                </div>

                <label className="field">
                  <span>Codigo do e-mail</span>
                  <div className="input-with-icon">
                    <ShieldCheck size={18} />
                    <input
                      name="codigo_email"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="\d{4,10}"
                      maxLength={10}
                      value={verificationCode}
                      onChange={(event) => {
                        event.target.setCustomValidity('')
                        setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 10))
                      }}
                      placeholder="000000"
                      required
                    />
                  </div>
                </label>

                <button
                  className="secondary-action resend-code-button"
                  type="button"
                  onClick={resendVerificationCode}
                  disabled={loading}
                >
                  {loading ? 'Aguarde...' : 'Reenviar codigo por e-mail'}
                </button>

                <div className="auth-actions">
                  <button className="primary-action" type="submit" disabled={loading}>
                    {loading ? 'Validando...' : 'Validar codigo'}
                  </button>
                </div>

                <div className="auth-switch-row">
                  <button
                    className="text-switch"
                    type="button"
                    onClick={() => {
                      setPendingVerification(null)
                      setVerificationCode('')
                    }}
                  >
                    Voltar e corrigir e-mail
                  </button>
                </div>
              </>
            ) : mode === 'forgot' ? (
              <>
                <div className="auth-verification-card">
                  <div className="verification-icon" aria-hidden="true">
                    <ShieldCheck size={26} />
                  </div>
                  <strong>
                    {!passwordReset
                      ? 'Receba o codigo no e-mail'
                      : passwordReset.verified
                        ? 'Codigo validado'
                        : 'Digite o codigo recebido'}
                  </strong>
                  <span>
                    {!passwordReset
                      ? 'Use o mesmo e-mail cadastrado na sua conta PlayArena.'
                      : passwordReset.verified
                        ? 'Agora defina uma nova senha para sua conta.'
                        : `Enviamos um codigo para ${passwordReset.email}.`}
                  </span>
                </div>

                <label className="field">
                  <span>E-mail cadastrado</span>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                      name="reset_email"
                      autoComplete="email"
                      type="email"
                      value={resetForm.email}
                      onChange={(event) => {
                        event.target.setCustomValidity('')
                        updateResetField('email', event.target.value)
                      }}
                      placeholder="voce@email.com"
                      readOnly={Boolean(passwordReset)}
                    />
                  </div>
                </label>

                {passwordReset && (
                  <label className="field">
                    <span>Codigo do e-mail</span>
                    <div className="input-with-icon">
                      <ShieldCheck size={18} />
                      <input
                        name="reset_codigo"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="\d{4,10}"
                        maxLength={10}
                        value={resetForm.codigo}
                        onChange={(event) => {
                          event.target.setCustomValidity('')
                          updateResetField('codigo', event.target.value.replace(/\D/g, '').slice(0, 10))
                        }}
                        placeholder="000000"
                        readOnly={passwordReset.verified}
                      />
                    </div>
                  </label>
                )}

                {passwordReset?.verified && (
                  <>
                    <label className="field">
                      <span>Nova senha</span>
                      <div className="input-with-icon">
                        <LockKeyhole size={18} />
                        <input
                          name="senha"
                          autoComplete="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={resetForm.senha}
                          onChange={(event) => {
                            event.target.setCustomValidity('')
                            updateResetField('senha', event.target.value)
                          }}
                          placeholder="Ex.: Teste@123"
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span>Confirmar nova senha</span>
                      <div className="input-with-icon">
                        <LockKeyhole size={18} />
                        <input
                          name="reset_confirmar_senha"
                          autoComplete="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={resetForm.confirmar_senha}
                          onChange={(event) => {
                            event.target.setCustomValidity('')
                            updateResetField('confirmar_senha', event.target.value)
                          }}
                          placeholder="Digite a senha novamente"
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
                  </>
                )}

                <div className="auth-actions">
                  <button className="primary-action" type="submit" disabled={loading}>
                    {loading
                      ? 'Aguarde...'
                      : !passwordReset
                        ? 'Enviar codigo'
                        : passwordReset.verified
                          ? 'Salvar nova senha'
                          : 'Validar codigo'}
                  </button>
                </div>

                <div className="auth-switch-row">
                  <button
                    className="text-switch"
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setPasswordReset(null)
                      setResetForm(initialResetForm)
                    }}
                  >
                    Voltar para o login
                  </button>
                </div>
              </>
            ) : (
              <>
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
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('nome', event.target.value)
                    }}
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
                  onChange={(event) => {
                    event.target.setCustomValidity('')
                    updateField('email', event.target.value)
                  }}
                  placeholder="voce@email.com"
                  required
                />
              </div>
            </label>

            {mode === 'register' && (
              <label className="field">
                <span>Telefone com DDD (opcional)</span>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input
                    name="telefone"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="\d{2} \d{8,9}"
                    maxLength={12}
                    value={form.telefone}
                    onChange={(event) => {
                      event.target.setCustomValidity('')
                      updateField('telefone', formatPhone(event.target.value))
                    }}
                    placeholder="44 999921435"
                    aria-label="Celular com DDD, sem o codigo do pais"
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
                <button
                  className="ghost-link"
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setPendingVerification(null)
                    setPasswordReset(null)
                    setResetForm({ ...initialResetForm, email: form.email })
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <div className="auth-switch-row">
              <button
                className="text-switch"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setPendingVerification(null)
                  setPasswordReset(null)
                }}
              >
                {mode === 'login' ? 'Ainda nao tenho uma conta?' : 'Ja tenho uma conta?'}
              </button>
            </div>
              </>
            )}
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

function getEmailError(email) {
  const value = String(email || '').trim()

  if (!value) {
    return 'Informe o e-mail.'
  }

  if (/\s/.test(value)) {
    return 'O e-mail nao pode conter espacos.'
  }

  if (!value.includes('@')) {
    return 'O e-mail precisa conter @. Exemplo: nome@email.com.'
  }

  const [localPart, domainPart, extraPart] = value.split('@')

  if (extraPart !== undefined) {
    return 'O e-mail deve conter apenas um @.'
  }

  if (!localPart) {
    return 'Digite a parte antes do @ no e-mail.'
  }

  if (!domainPart) {
    return 'Digite o dominio depois do @. Exemplo: nome@email.com.'
  }

  if (!domainPart.includes('.')) {
    return 'O dominio do e-mail precisa ter ponto. Exemplo: nome@email.com.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Digite um e-mail valido. Exemplo: nome@email.com.'
  }

  return ''
}

function getCpfError(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) {
    return 'Informe o CPF.'
  }

  if (digits.length !== 11) {
    return 'CPF deve ter 11 digitos.'
  }

  if (/^(\d)\1+$/.test(digits)) {
    return 'CPF invalido: todos os digitos sao iguais.'
  }

  if (!isValidCpf(digits)) {
    return 'CPF invalido. Confira os numeros digitados.'
  }

  return ''
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
  const value = String(password || '')

  if (!value) {
    return 'Informe uma senha.'
  }

  const missingRequirements = []

  if (value.length < 8) {
    missingRequirements.push('8 caracteres')
  }

  if (!/[A-Z]/.test(value)) {
    missingRequirements.push('uma letra maiuscula')
  }

  if (!/\d/.test(value)) {
    missingRequirements.push('um numero')
  }

  if (!/[^\w\s]|_/.test(value)) {
    missingRequirements.push('um caractere especial')
  }

  if (!missingRequirements.length) {
    return ''
  }

  return `A senha precisa ter ${missingRequirements.join(', ')}.`
}
