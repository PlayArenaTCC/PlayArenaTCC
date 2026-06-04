import { useEffect, useRef, useState } from 'react'
import { Building2, IdCard, LockKeyhole, Mail, Phone, Trash2, Upload, UserRound } from 'lucide-react'
import { formatCpf, formatPhone, isValidPhone } from '../../utils/formatters'

const PHOTO_TYPES = ['image/png', 'image/jpeg']
const MAX_PHOTO_SIZE = 5 * 1024 * 1024

export function ProfileView({
  session,
  loading = false,
  onChangePassword,
  onDeleteAccount,
  onUpdateProfile,
}) {
  const profile = session.usuario || {}
  const nome = profile.nome || profile.nome_responsavel || profile.nome_empresa || 'Usuário PlayArena'
  const nomeCompleto = profile.nome || profile.nome_responsavel || nome
  const canEditProfile = Boolean(onUpdateProfile) && ['usuario', 'proprietario'].includes(profile.perfil)
  const canDeleteAccount = Boolean(onDeleteAccount) && ['usuario', 'proprietario'].includes(profile.perfil)
  const canChangePassword = profile.perfil === 'admin'
  const profilePhoneKey = `${profile.id || ''}:${profile.telefone || ''}`
  const phoneInputRef = useRef(null)
  const photoInputRef = useRef(null)
  const previewUrlRef = useRef('')
  const [phoneDraft, setPhoneDraft] = useState(() => ({
    key: profilePhoneKey,
    value: formatPhone(profile.telefone || ''),
  }))
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    nova_senha: '',
    confirmar_nova_senha: '',
  })
  const telefone = phoneDraft.key === profilePhoneKey ? phoneDraft.value : formatPhone(profile.telefone || '')
  const displayedPhoto = photoPreview || profile.foto_perfil_url

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  function clearPhotoSelection() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }

    setPhotoFile(null)
    setPhotoPreview('')
  }

  function handlePhotoChange(event) {
    const [file] = event.target.files || []
    setPhotoError('')

    if (!file) {
      clearPhotoSelection()
      return
    }

    const hasAcceptedType = PHOTO_TYPES.includes(file.type)
    const hasAcceptedExtension = /\.(png|jpe?g)$/i.test(file.name)

    if (!hasAcceptedType && !hasAcceptedExtension) {
      clearPhotoSelection()
      setPhotoError('Envie uma foto em PNG ou JPG.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      clearPhotoSelection()
      setPhotoError('A foto deve ter no máximo 5 MB.')
      event.target.value = ''
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const nextPreview = URL.createObjectURL(file)
    previewUrlRef.current = nextPreview
    setPhotoFile(file)
    setPhotoPreview(nextPreview)
  }

  async function submit(event) {
    event.preventDefault()

    if (!canEditProfile) {
      return
    }

    if (telefone && !isValidPhone(telefone)) {
      phoneInputRef.current?.setCustomValidity('Telefone deve ter DDD e 8 ou 9 digitos.')
      phoneInputRef.current?.reportValidity()
      return
    }

    const updatedProfile = await onUpdateProfile({
      telefone,
      foto_perfil: photoFile,
    })

    if (updatedProfile) {
      clearPhotoSelection()
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  function closeDeleteDialog() {
    if (!deleting) {
      setConfirmingDelete(false)
    }
  }

  async function confirmDeleteAccount() {
    if (!canDeleteAccount) {
      return
    }

    setDeleting(true)
    const deleted = await onDeleteAccount()

    if (deleted === false) {
      setDeleting(false)
    }
  }

  async function submitPassword(event) {
    event.preventDefault()

    if (!canChangePassword) {
      return
    }

    const formElement = event.currentTarget
    const passwordError = getPasswordError(passwordForm.nova_senha)

    if (passwordError) {
      showPasswordFieldError(formElement, 'nova_senha', passwordError)
      return
    }

    if (!passwordForm.confirmar_nova_senha) {
      showPasswordFieldError(formElement, 'confirmar_nova_senha', 'Confirme a nova senha.')
      return
    }

    if (passwordForm.nova_senha !== passwordForm.confirmar_nova_senha) {
      showPasswordFieldError(formElement, 'confirmar_nova_senha', 'As senhas nao conferem.')
      return
    }

    setChangingPassword(true)
    const updated = await onChangePassword?.(passwordForm)
    setChangingPassword(false)

    if (updated) {
      setPasswordForm({
        nova_senha: '',
        confirmar_nova_senha: '',
      })
    }
  }

  return (
    <section className="profile-screen">
      {canChangePassword && (
        <form className="settings-list profile-password-card" onSubmit={submitPassword} noValidate>
          <h2>Alterar Senha</h2>
          <p>Defina uma nova senha para acessar o painel administrativo, sem validacao por e-mail.</p>
          <label className="field profile-info-field">
            <span>
              <LockKeyhole size={14} />
              Nova senha
            </span>
            <input
              name="nova_senha"
              autoComplete="new-password"
              type="password"
              value={passwordForm.nova_senha}
              onChange={(event) => {
                event.target.setCustomValidity('')
                event.currentTarget.form?.elements.confirmar_nova_senha?.setCustomValidity('')
                setPasswordForm((current) => ({ ...current, nova_senha: event.target.value }))
              }}
              placeholder="Ex.: Teste@123"
              minLength={8}
              disabled={loading || changingPassword}
              required
            />
            <small>Use 8 caracteres, letra maiuscula, numero e caractere especial.</small>
          </label>
          <label className="field profile-info-field">
            <span>
              <LockKeyhole size={14} />
              Confirmar nova senha
            </span>
            <input
              name="confirmar_nova_senha"
              autoComplete="new-password"
              type="password"
              value={passwordForm.confirmar_nova_senha}
              onChange={(event) => {
                event.target.setCustomValidity('')
                setPasswordForm((current) => ({ ...current, confirmar_nova_senha: event.target.value }))
              }}
              placeholder="Digite a senha novamente"
              minLength={8}
              disabled={loading || changingPassword}
              required
            />
          </label>
          <div className="profile-form-actions">
            <button className="primary-action" type="submit" disabled={loading || changingPassword}>
              {loading || changingPassword ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      )}
      <form className="profile-form" onSubmit={submit}>
        {canEditProfile && (
          <div className="settings-list profile-photo-card">
            <h2 className="profile-card-title">Foto de Perfil</h2>
            <div className="profile-photo-preview" aria-hidden="true">
              {displayedPhoto ? (
                <img src={displayedPhoto} alt="" />
              ) : (
                <span>{nome.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <input
              ref={photoInputRef}
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePhotoChange}
              disabled={loading}
            />
            <button
              className="secondary-action profile-photo-button"
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={loading}
            >
              <Upload size={14} />
              Alterar Foto
            </button>
            {photoError && <small className="profile-feedback">{photoError}</small>}
          </div>
        )}

        <div className="settings-list profile-info-card">
          <h2>Informações Pessoais</h2>
          <label className="field profile-info-field">
            <span>
              <Mail size={14} />
              Email
            </span>
            <input value={profile.email || ''} readOnly />
            <small>O email não pode ser alterado</small>
          </label>
          <label className="field profile-info-field">
            <span>
              <UserRound size={14} />
              Nome Completo
            </span>
            <input value={nomeCompleto} readOnly />
          </label>
          <label className="field profile-info-field">
            <span>
              <Phone size={14} />
              Telefone
            </span>
            <input
              ref={phoneInputRef}
              name="telefone"
              autoComplete="tel"
              inputMode="numeric"
              pattern="\d{2} \d{8,9}"
              maxLength={12}
              value={canEditProfile ? telefone : profile.telefone || 'Não informado'}
              onChange={(event) => {
                event.target.setCustomValidity('')
                setPhoneDraft({
                  key: profilePhoneKey,
                  value: formatPhone(event.target.value),
                })
              }}
              placeholder="44 999921435"
              readOnly={!canEditProfile}
            />
          </label>
          {profile.cpf && (
            <label className="field profile-info-field">
              <span>
                <IdCard size={14} />
                CPF
              </span>
              <input value={formatCpf(profile.cpf)} readOnly />
            </label>
          )}
          {profile.cpf_cnpj && (
            <label className="field profile-info-field">
              <span>
                <IdCard size={14} />
                CPF
              </span>
              <input value={formatCpf(profile.cpf_cnpj)} readOnly />
            </label>
          )}
          {profile.nome_empresa && (
            <label className="field profile-info-field">
              <span>
                <Building2 size={14} />
                Empresa
              </span>
              <input value={profile.nome_empresa} readOnly />
            </label>
          )}
          {canEditProfile && (
            <div className="profile-form-actions">
              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
          {canDeleteAccount && (
            <div className="profile-danger-zone">
              <button className="danger-action" type="button" onClick={() => setConfirmingDelete(true)} disabled={loading || deleting}>
                <Trash2 size={14} />
                Excluir conta
              </button>
            </div>
          )}
        </div>
      </form>
      {confirmingDelete && (
        <div className="modal-backdrop" onClick={closeDeleteDialog}>
          <section
            className="reservation-modal confirm-dialog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-account-${profile.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={`delete-account-${profile.id}`}>Excluir conta</h2>
            <p>Realmente deseja excluir?</p>
            <div className="modal-actions">
              <button className="secondary-action" type="button" onClick={closeDeleteDialog} disabled={deleting}>
                Voltar
              </button>
              <button className="danger-action" type="button" onClick={confirmDeleteAccount} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function showPasswordFieldError(formElement, fieldName, message) {
  const input = formElement.elements[fieldName]

  if (!input) {
    return
  }

  input.setCustomValidity(message)
  input.reportValidity()
}

function getPasswordError(password) {
  const value = String(password || '')
  const missingRequirements = []

  if (!value) {
    return 'Informe a nova senha.'
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
