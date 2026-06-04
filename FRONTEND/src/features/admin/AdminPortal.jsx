import { useState } from 'react'
import { Building2, CheckCircle, DollarSign, ExternalLink, FileText, IdCard, Mail, Phone, Shield, Trophy, UserPlus, Users, XCircle } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { formatCpf, formatCurrency, formatPhone, isValidPhone } from '../../utils/formatters'
import { OwnerReservationList } from '../owner/OwnerReservationList'
import { ProfileView } from '../profile/ProfileView'
import { AdminSpacesView } from './AdminSpacesView'
import { AdminUsersView } from './AdminUsersView'

const ownerTypeLabels = {
  dono_local: 'Dono do local',
  gerenciador: 'Gerenciador',
}

const documentStatusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em analise',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

const documentLabels = {
  documento_pessoal: 'Documento pessoal',
  cpf: 'CPF',
  comprovante_endereco: 'Comprovante de endereco',
  comprovante_posse: 'Posse/propriedade',
  autorizacao_gerenciamento: 'Autorizacao de gerenciamento',
}

function formatDateTime(value) {
  if (!value) {
    return 'Nao informado'
  }

  return new Date(value).toLocaleString('pt-BR')
}

export function AdminPortal({
  activeView,
  adminData,
  loading,
  session,
  onBanUser,
  onBlockUserTemporarily,
  onChangePassword,
  onClearSpaceDeactivation,
  onClearUserTemporaryBlock,
  onCreateAdmin,
  onCreateSchedule,
  onCreateSpace,
  onDeactivateSpace,
  onDeleteSchedule,
  onDeleteSpace,
  onReviewDocumentation,
  onStatusReservation,
  onUpdateScheduleAvailability,
  onUpdateSpace,
  onOwnerApproval,
}) {
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reviewingId, setReviewingId] = useState('')
  const indicadores = adminData.indicadores || {}
  const usuarios = adminData.usuarios || []
  const proprietarios = adminData.proprietarios || []
  const quadras = adminData.quadras || []
  const reservas = adminData.reservas || []
  const documentacoes = adminData.documentacoes || []
  const administradores = adminData.administradores || []

  async function approveDocumentation(documentacao) {
    setReviewingId(documentacao.id)
    try {
      await onReviewDocumentation(documentacao, 'aprovado')
    } finally {
      setReviewingId('')
    }
  }

  async function confirmRejectDocumentation() {
    if (!rejectTarget || !rejectReason.trim()) {
      return
    }

    setReviewingId(rejectTarget.id)
    try {
      const reviewed = await onReviewDocumentation(rejectTarget, 'reprovado', rejectReason.trim())

      if (reviewed !== false) {
        setRejectTarget(null)
        setRejectReason('')
      }
    } finally {
      setReviewingId('')
    }
  }

  if (activeView === 'espacos') {
    return (
      <AdminSpacesView
        espacos={quadras}
        proprietarios={proprietarios}
        loading={loading}
        onClearSpaceDeactivation={onClearSpaceDeactivation}
        onCreateSchedule={onCreateSchedule}
        onCreateSpace={onCreateSpace}
        onDeactivateSpace={onDeactivateSpace}
        onDeleteSchedule={onDeleteSchedule}
        onDeleteSpace={onDeleteSpace}
        onUpdateScheduleAvailability={onUpdateScheduleAvailability}
        onUpdateSpace={onUpdateSpace}
      />
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

  if (activeView === 'documentos') {
    return (
      <section className="screen-stack">
        <AdminTitle title="Documentos dos Espaços" subtitle="Validação" />
        <div className="list-stack">
          {documentacoes.length ? documentacoes.map((documentacao) => (
            <article className="list-row admin-document-row" key={documentacao.id}>
              <div className="admin-document-main">
                <div className="owner-reservation-title">
                  <span className={`status-dot status-${documentacao.status}`}>{documentStatusLabels[documentacao.status] || documentacao.status}</span>
                  <h3>{documentacao.proprietario?.nome_empresa || documentacao.proprietario?.nome_responsavel || 'Proprietario'}</h3>
                </div>
                <div className="owner-reservation-summary">
                  <span>{ownerTypeLabels[documentacao.tipo_proprietario] || documentacao.tipo_proprietario}</span>
                  <span>{documentacao.endereco}, {documentacao.cidade}/{documentacao.estado}</span>
                  <span>CEP: {documentacao.cep || 'Não informado'}</span>
                  {documentacao.proprietario.email && (
                    <span><Mail size={14} style={{ display: 'inline', marginRight: '4px' }} /> {documentacao.proprietario.email}</span>
                  )}
                  {documentacao.proprietario.telefone && (
                    <span><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> {documentacao.proprietario.telefone}</span>
                  )}
                  <span>Enviado em {formatDateTime(documentacao.enviado_em)}</span>
                </div>
                <div className="admin-document-files">
                  {Object.entries(documentacao.documentos || {}).map(([key, url]) => (
                    <a href={url} key={key} target="_blank" rel="noreferrer">
                      <FileText size={15} />
                      {documentLabels[key] || key}
                      <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
                {documentacao.motivo_reprovacao && (
                  <div className="owner-reservation-details">
                    <small>Motivo da reprovação</small>
                    <span>{documentacao.motivo_reprovacao}</span>
                  </div>
                )}
              </div>
              <div className="row-actions admin-document-actions">
                <button className="secondary-action" type="button" onClick={() => approveDocumentation(documentacao)} disabled={reviewingId === documentacao.id}>
                  <CheckCircle size={15} />
                  {reviewingId === documentacao.id ? 'Salvando...' : 'Aprovar'}
                </button>
                <button className="danger-action" type="button" onClick={() => {
                  setRejectTarget(documentacao)
                  setRejectReason('')
                }} disabled={reviewingId === documentacao.id}>
                  <XCircle size={15} />
                  Reprovar
                </button>
              </div>
            </article>
          )) : (
            <section className="empty-state">
              <FileText size={30} />
              <h2>Nenhuma documentação enviada</h2>
              <p>Os documentos dos proprietarios aparecerao aqui para analise.</p>
            </section>
          )}
        </div>

        {rejectTarget && (
          <div className="modal-backdrop" onClick={() => setRejectTarget(null)}>
            <section
              className="reservation-modal confirm-dialog-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`reject-documentation-${rejectTarget.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={`reject-documentation-${rejectTarget.id}`}>Reprovar documentação</h2>
              <p>Informe o motivo da reprovação para registrar a auditoria.</p>
              <label className="field">
                <span>Motivo da reprovação</span>
                <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Descreva o motivo da reprovação" />
              </label>
              <div className="modal-actions">
                <button className="secondary-action" type="button" onClick={() => setRejectTarget(null)} disabled={reviewingId === rejectTarget.id}>
                  Voltar
                </button>
                <button className="danger-action" type="button" onClick={confirmRejectDocumentation} disabled={reviewingId === rejectTarget.id || !rejectReason.trim()}>
                  {reviewingId === rejectTarget.id ? 'Reprovando...' : 'Confirmar reprovação'}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    )
  }

  if (activeView === 'usuarios') {
    return (
      <AdminUsersView
        loading={loading}
        proprietarios={proprietarios}
        usuarios={usuarios}
        onBanUser={onBanUser}
        onBlockUserTemporarily={onBlockUserTemporarily}
        onClearUserTemporaryBlock={onClearUserTemporaryBlock}
        onOwnerApproval={onOwnerApproval}
      />
    )
  }

  if (activeView === 'administradores' && session.usuario?.nivel_acesso === 'super_admin') {
    return (
      <AdminRegistrationView
        administradores={administradores}
        loading={loading}
        onCreateAdmin={onCreateAdmin}
      />
    )
  }

  if (activeView === 'perfil') {
    return (
      <ProfileView
        session={session}
        loading={loading}
        onChangePassword={onChangePassword}
      />
    )
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

const initialAdminForm = {
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  senha: '',
  confirmar_senha: '',
}

function AdminRegistrationView({ administradores, loading, onCreateAdmin }) {
  const [form, setForm] = useState(initialAdminForm)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const formElement = event.currentTarget

    if (!form.nome.trim()) {
      showFormFieldError(formElement, 'nome', 'Informe o nome completo.')
      return
    }

    const cpfError = getCpfError(form.cpf)

    if (cpfError) {
      showFormFieldError(formElement, 'cpf', cpfError)
      return
    }

    const emailError = getEmailError(form.email)

    if (emailError) {
      showFormFieldError(formElement, 'email', emailError)
      return
    }

    if (!isValidPhone(form.telefone)) {
      showFormFieldError(formElement, 'telefone', 'Informe um telefone com DDD e 8 ou 9 digitos.')
      return
    }

    const passwordError = getPasswordError(form.senha)

    if (passwordError) {
      showFormFieldError(formElement, 'senha', passwordError)
      return
    }

    if (!form.confirmar_senha) {
      showFormFieldError(formElement, 'confirmar_senha', 'Confirme a senha.')
      return
    }

    if (form.senha !== form.confirmar_senha) {
      showFormFieldError(formElement, 'confirmar_senha', 'As senhas nao conferem.')
      return
    }

    const created = await onCreateAdmin?.({
      ...form,
      perfil: 'admin',
    })

    if (created) {
      setForm(initialAdminForm)
    }
  }

  return (
    <section className="screen-stack">
      <AdminTitle title="Cadastro de Administradores" subtitle="Acesso administrativo" />

      <form className="management-form admin-registration-form" onSubmit={submit} noValidate>
        <div className="form-section-header">
          <div>
            <strong>Novo administrador</strong>
            <small>O novo usuario recebera apenas permissoes do perfil Administrador.</small>
          </div>
          <UserPlus size={20} />
        </div>

        <label className="field">
          <span>Nome completo</span>
          <input
            name="nome"
            autoComplete="name"
            value={form.nome}
            onChange={(event) => {
              event.target.setCustomValidity('')
              updateField('nome', event.target.value)
            }}
            placeholder="Nome completo"
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span>CPF</span>
          <input
            name="cpf"
            autoComplete="off"
            inputMode="numeric"
            value={form.cpf}
            onChange={(event) => {
              event.target.setCustomValidity('')
              updateField('cpf', formatCpfInput(event.target.value))
            }}
            placeholder="000.000.000-00"
            maxLength={14}
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span>E-mail</span>
          <input
            name="email"
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => {
              event.target.setCustomValidity('')
              updateField('email', event.target.value)
            }}
            placeholder="administrador@email.com"
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span>Telefone</span>
          <input
            name="telefone"
            autoComplete="tel"
            inputMode="numeric"
            value={form.telefone}
            onChange={(event) => {
              event.target.setCustomValidity('')
              updateField('telefone', formatPhone(event.target.value))
            }}
            placeholder="44 999921435"
            maxLength={12}
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span>Tipo de usuario/perfil</span>
          <input value="Administrador" readOnly />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            name="senha"
            autoComplete="new-password"
            type="password"
            value={form.senha}
            onChange={(event) => {
              event.target.setCustomValidity('')
              event.currentTarget.form?.elements.confirmar_senha?.setCustomValidity('')
              updateField('senha', event.target.value)
            }}
            placeholder="Ex.: Teste@123"
            minLength={8}
            disabled={loading}
            required
          />
          <small className="field-help">Use 8 caracteres, letra maiuscula, numero e caractere especial.</small>
        </label>

        <label className="field">
          <span>Confirmar senha</span>
          <input
            name="confirmar_senha"
            autoComplete="new-password"
            type="password"
            value={form.confirmar_senha}
            onChange={(event) => {
              event.target.setCustomValidity('')
              updateField('confirmar_senha', event.target.value)
            }}
            placeholder="Digite a senha novamente"
            minLength={8}
            disabled={loading}
            required
          />
        </label>

        <div className="admin-registration-actions wide-field">
          <button className="primary-action" type="submit" disabled={loading}>
            <UserPlus size={15} />
            {loading ? 'Cadastrando...' : 'Cadastrar administrador'}
          </button>
        </div>
      </form>

      <section className="plain-panel admin-list-panel">
        <h2>Administradores cadastrados</h2>
        <div className="list-stack">
          {administradores.length ? administradores.map((administrador) => (
            <article className="list-row admin-account-row" key={administrador.id}>
              <div>
                <span className="status-dot status-confirmada">
                  {administrador.nivel_acesso === 'super_admin' ? 'Administrador principal' : 'Administrador'}
                </span>
                <h3>{administrador.nome}</h3>
                <p>{administrador.email}</p>
              </div>
              <div className="admin-account-contact">
                <span><IdCard size={14} /> CPF {formatCpf(administrador.cpf)}</span>
                <span><Phone size={14} /> {administrador.telefone || 'Telefone nao informado'}</span>
              </div>
            </article>
          )) : (
            <section className="empty-state compact-empty">
              <UserPlus size={28} />
              <h2>Nenhum administrador cadastrado</h2>
            </section>
          )}
        </div>
      </section>
    </section>
  )
}

function showFormFieldError(formElement, fieldName, message) {
  const input = formElement.elements[fieldName]

  if (!input) {
    return
  }

  input.setCustomValidity(message)
  input.reportValidity()
}

function formatCpfInput(value) {
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
  const missingRequirements = []

  if (!value) {
    return 'Informe uma senha.'
  }

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

  return missingRequirements.length
    ? `A senha precisa ter ${missingRequirements.join(', ')}.`
    : ''
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
