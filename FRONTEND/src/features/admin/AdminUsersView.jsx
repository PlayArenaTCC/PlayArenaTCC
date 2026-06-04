import { useState } from 'react'
import { Ban, CalendarClock, UserX } from 'lucide-react'
import { formatCpf } from '../../utils/formatters'

function toLocalDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function defaultBlockForm() {
  const start = new Date()
  start.setSeconds(0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    data_inicio: toLocalDate(start),
    hora_inicio: toLocalTime(start),
    data_fim: toLocalDate(end),
    hora_fim: toLocalTime(end),
    motivo: '',
  }
}

function blockFormFromUser(user) {
  if (!user.bloqueada_inicio_em || !user.bloqueada_fim_em) {
    return defaultBlockForm()
  }

  return {
    data_inicio: toLocalDate(user.bloqueada_inicio_em),
    hora_inicio: toLocalTime(user.bloqueada_inicio_em),
    data_fim: toLocalDate(user.bloqueada_fim_em),
    hora_fim: toLocalTime(user.bloqueada_fim_em),
    motivo: user.motivo_bloqueio || '',
  }
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Não informado'
}

function getUserStatus(user) {
  if (user.temporariamente_bloqueado || user.status === 'bloqueado_temporariamente') {
    return {
      className: 'status-dot status-bloqueado-temporariamente',
      label: 'Bloqueado Temporariamente',
    }
  }

  if (user.status === 'inativo') {
    return {
      className: 'status-dot status-cancelada',
      label: 'Inativo',
    }
  }

  return {
    className: 'status-dot status-confirmada',
    label: 'Ativo',
  }
}

export function AdminUsersView({
  loading,
  proprietarios,
  usuarios,
  onBanUser,
  onBlockUserTemporarily,
  onClearUserTemporaryBlock,
  onOwnerApproval,
}) {
  const [banTarget, setBanTarget] = useState(null)
  const [blockTarget, setBlockTarget] = useState(null)

  const accounts = [
    ...usuarios.map((account) => ({ ...account, tipo_conta: 'usuario' })),
    ...proprietarios.map((account) => ({ ...account, tipo_conta: 'proprietario' })),
  ]

  return (
    <section className="screen-stack">
      <AdminUsersTitle />
      <div className="list-stack">
        {accounts.map((account) => (
          <AdminUserRow
            account={account}
            key={`${account.tipo_conta}-${account.id}`}
            onBan={() => setBanTarget(account)}
            onBlock={() => setBlockTarget(account)}
            onOwnerApproval={onOwnerApproval}
          />
        ))}
      </div>

      {blockTarget && (
        <TemporaryBlockModal
          key={`${blockTarget.id}-${blockTarget.bloqueada_fim_em || 'new'}`}
          loading={loading}
          user={blockTarget}
          onClose={() => setBlockTarget(null)}
          onClear={async () => {
            const saved = await onClearUserTemporaryBlock(blockTarget)
            if (saved) {
              setBlockTarget(null)
            }
          }}
          onSubmit={async (payload) => {
            const saved = await onBlockUserTemporarily(blockTarget, payload)
            if (saved) {
              setBlockTarget(null)
            }
          }}
        />
      )}

      {banTarget && (
        <BanUserModal
          loading={loading}
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={async (motivo) => {
            const banned = await onBanUser(banTarget, motivo)
            if (banned) {
              setBanTarget(null)
            }
          }}
        />
      )}
    </section>
  )
}

function AdminUsersTitle() {
  return (
    <div className="admin-title">
      <UserX size={20} />
      <div>
        <span>Contas</span>
        <h1>Usuários do Administrador</h1>
      </div>
    </div>
  )
}

function AdminUserRow({ account, onBan, onBlock, onOwnerApproval }) {
  const isUser = account.tipo_conta === 'usuario'
  const status = isUser
    ? getUserStatus(account)
    : {
      className: `status-dot status-${account.status_aprovacao || 'pendente'}`,
      label: account.status_aprovacao || 'pendente',
    }
  const hasBlock = Boolean(account.bloqueada_inicio_em && account.bloqueada_fim_em)

  return (
    <article className="list-row admin-user-row">
      <div className="admin-user-main">
        <span className={status.className}>{status.label}</span>
        <h3>{account.nome || account.nome_responsavel || account.nome_empresa}</h3>
        <p>
          {account.email} - {account.tipo_conta}
          {account.cpf ? ` - CPF ${formatCpf(account.cpf)}` : ''}
        </p>
        {isUser && hasBlock && (
          <small className="admin-user-block-note">
            {account.temporariamente_bloqueado
              ? 'Bloqueio ativo'
              : account.bloqueio_agendado
                ? 'Bloqueio agendado'
                : 'Período encerrado'}
            : {formatDateTime(account.bloqueada_inicio_em)} até {formatDateTime(account.bloqueada_fim_em)}
            {account.motivo_bloqueio ? ` · ${account.motivo_bloqueio}` : ''}
          </small>
        )}
      </div>

      {isUser ? (
        <div className="row-actions admin-user-actions">
          <button className="secondary-action admin-user-block-action" type="button" onClick={onBlock}>
            <CalendarClock size={15} />
            {hasBlock ? 'Editar bloqueio temporário' : 'Bloquear temporariamente'}
          </button>
          <button className="danger-action" type="button" onClick={onBan}>
            <Ban size={15} />
            Banir
          </button>
        </div>
      ) : (
        <div className="row-actions">
          <button className="secondary-action" type="button" onClick={() => onOwnerApproval(account, 'aprovado')}>Aprovar</button>
          <button className="danger-action" type="button" onClick={() => onOwnerApproval(account, 'reprovado')}>Reprovar</button>
        </div>
      )}
    </article>
  )
}

function TemporaryBlockModal({ loading, user, onClear, onClose, onSubmit }) {
  const [form, setForm] = useState(() => blockFormFromUser(user))
  const hasBlock = Boolean(user.bloqueada_inicio_em && user.bloqueada_fim_em)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal admin-user-block-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Bloquear temporariamente</h2>
        <p>Defina o período em que <strong>{user.nome}</strong> não poderá acessar a plataforma.</p>

        <form className="admin-user-block-form" onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}>
          <label className="field">
            <span>Data de início</span>
            <input type="date" value={form.data_inicio} onChange={(event) => update('data_inicio', event.target.value)} required />
          </label>
          <label className="field">
            <span>Hora de início</span>
            <input type="time" value={form.hora_inicio} onChange={(event) => update('hora_inicio', event.target.value)} required />
          </label>
          <label className="field">
            <span>Data final</span>
            <input type="date" min={form.data_inicio} value={form.data_fim} onChange={(event) => update('data_fim', event.target.value)} required />
          </label>
          <label className="field">
            <span>Hora final</span>
            <input type="time" value={form.hora_fim} onChange={(event) => update('hora_fim', event.target.value)} required />
          </label>
          <label className="field wide-field">
            <span>Motivo do bloqueio</span>
            <textarea value={form.motivo} onChange={(event) => update('motivo', event.target.value)} placeholder="Informe o motivo do bloqueio temporário" required />
          </label>

          <div className="modal-actions wide-field admin-user-block-modal-actions">
            {hasBlock && (
              <button className="secondary-action" type="button" onClick={onClear} disabled={loading}>
                Remover bloqueio
              </button>
            )}
            <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="primary-action" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar bloqueio'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function BanUserModal({ loading, user, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Banir usuário</h2>
        <p>
          Tem certeza que deseja banir <strong>{user.nome}</strong>? Essa ação irá excluir permanentemente o usuário e todos os seus registros do banco de dados.
        </p>
        <div className="confirm-warning-box">
          Reservas, notificações, dados pessoais e histórico relacionado serão removidos. Esta ação não poderá ser desfeita.
        </div>
        <label className="field">
          <span>Motivo do banimento</span>
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Informe o motivo do banimento" required />
        </label>
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="danger-action" type="button" onClick={() => onConfirm(motivo.trim())} disabled={loading || !motivo.trim()}>
            {loading ? 'Banindo...' : 'Confirmar banimento'}
          </button>
        </div>
      </section>
    </div>
  )
}
