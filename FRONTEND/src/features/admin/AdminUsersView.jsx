import { useState } from 'react'
import { Ban, CalendarClock, RotateCcw, Trash2, UserX } from 'lucide-react'
import { formatCpfCnpj } from '../../utils/formatters'

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

function blockFormFromAccount(account) {
  if (!account.bloqueada_inicio_em || !account.bloqueada_fim_em) {
    return defaultBlockForm()
  }

  return {
    data_inicio: toLocalDate(account.bloqueada_inicio_em),
    hora_inicio: toLocalTime(account.bloqueada_inicio_em),
    data_fim: toLocalDate(account.bloqueada_fim_em),
    hora_fim: toLocalTime(account.bloqueada_fim_em),
    motivo: account.motivo_bloqueio || '',
  }
}

function accountName(account) {
  return account.nome || account.nome_responsavel || account.nome_empresa || 'Conta'
}

function accountDocument(account) {
  return account.cpf || account.cpf_cnpj || ''
}

function accountDocumentLabel(account) {
  return account.cpf_cnpj ? 'CPF/CNPJ' : 'CPF'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Não informado'
}

function getAccountStatus(account) {
  if (account.temporariamente_bloqueado || account.status === 'bloqueado_temporariamente') {
    return {
      className: 'status-dot status-bloqueado-temporariamente',
      label: 'Bloqueado Temporariamente',
    }
  }

  if (account.status === 'inativo' || account.ativo === false) {
    return {
      className: 'status-dot status-cancelada',
      label: 'Banido',
    }
  }

  if (account.tipo_conta === 'proprietario') {
    return {
      className: `status-dot status-${account.status_aprovacao || 'pendente'}`,
      label: account.status_aprovacao || 'pendente',
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
  onDeleteManagedAccount,
  onOwnerApproval,
  onUnbanUser,
}) {
  const [banTarget, setBanTarget] = useState(null)
  const [blockTarget, setBlockTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

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
            onDelete={() => setDeleteTarget(account)}
            onOwnerApproval={onOwnerApproval}
            onUnban={() => onUnbanUser(account)}
          />
        ))}
      </div>

      {blockTarget && (
        <TemporaryBlockModal
          key={`${blockTarget.tipo_conta}-${blockTarget.id}-${blockTarget.bloqueada_fim_em || 'new'}`}
          account={blockTarget}
          loading={loading}
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
          account={banTarget}
          loading={loading}
          onClose={() => setBanTarget(null)}
          onConfirm={async (motivo) => {
            const banned = await onBanUser(banTarget, motivo)
            if (banned) {
              setBanTarget(null)
            }
          }}
        />
      )}

      {deleteTarget && (
        <DeleteAccountModal
          account={deleteTarget}
          loading={loading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async (motivo) => {
            const deleted = await onDeleteManagedAccount(deleteTarget, motivo)
            if (deleted) {
              setDeleteTarget(null)
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

function AdminUserRow({ account, onBan, onBlock, onDelete, onOwnerApproval, onUnban }) {
  const isOwner = account.tipo_conta === 'proprietario'
  const status = getAccountStatus(account)
  const hasBlock = Boolean(account.bloqueada_inicio_em && account.bloqueada_fim_em)
  const isBanned = account.status === 'inativo' || account.ativo === false
  const document = accountDocument(account)
  const ownerApprovalStatus = account.status_aprovacao || 'pendente'
  const showApproveOwner = ownerApprovalStatus !== 'aprovado'
  const showRejectOwner = ownerApprovalStatus !== 'reprovado'

  return (
    <article className="list-row admin-user-row">
      <div className="admin-user-main">
        <span className={status.className}>{status.label}</span>
        <h3>{accountName(account)}</h3>
        <p>
          {account.email} - {isOwner ? 'proprietario' : 'usuario'}
          {document ? ` - ${accountDocumentLabel(account)} ${formatCpfCnpj(document)}` : ''}
        </p>
        {hasBlock && (
          <small className="admin-user-block-note">
            {account.temporariamente_bloqueado
              ? 'Bloqueio ativo'
              : account.bloqueio_agendado
                ? 'Bloqueio agendado'
                : 'Período encerrado'}
            : {formatDateTime(account.bloqueada_inicio_em)} até {formatDateTime(account.bloqueada_fim_em)}
            {account.motivo_bloqueio ? ` - ${account.motivo_bloqueio}` : ''}
          </small>
        )}
      </div>

      <div className="row-actions admin-user-actions">
        {isOwner && (
          <>
            {showApproveOwner && (
              <button className="secondary-action" type="button" onClick={() => onOwnerApproval(account, 'aprovado')}>Aprovar</button>
            )}
            {showRejectOwner && (
              <button className="danger-action" type="button" onClick={() => onOwnerApproval(account, 'reprovado')}>Reprovar</button>
            )}
          </>
        )}
        <button className="secondary-action admin-user-block-action" type="button" onClick={onBlock}>
          <CalendarClock size={15} />
          {hasBlock ? 'Editar ban temporário' : 'Ban temporário'}
        </button>
        {isBanned ? (
          <button className="secondary-action" type="button" onClick={onUnban}>
            <RotateCcw size={15} />
            Desbanir
          </button>
        ) : (
          <button className="danger-action" type="button" onClick={onBan}>
            <Ban size={15} />
            Banir
          </button>
        )}
        <button className="danger-action" type="button" onClick={onDelete}>
          <Trash2 size={15} />
          Deletar conta
        </button>
      </div>
    </article>
  )
}

function TemporaryBlockModal({ account, loading, onClear, onClose, onSubmit }) {
  const [form, setForm] = useState(() => blockFormFromAccount(account))
  const hasBlock = Boolean(account.bloqueada_inicio_em && account.bloqueada_fim_em)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal admin-user-block-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Ban temporário</h2>
        <p>Defina um período de ban para <strong>{accountName(account)}</strong>. Ao iniciar, a conta será desconectada e não poderá executar ações até o fim do prazo.</p>

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
            <textarea value={form.motivo} onChange={(event) => update('motivo', event.target.value)} placeholder="Informe o motivo do ban temporário" required />
          </label>

          <div className="modal-actions wide-field admin-user-block-modal-actions">
            {hasBlock && (
              <button className="secondary-action" type="button" onClick={onClear} disabled={loading}>
                Remover bloqueio
              </button>
            )}
            <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="primary-action" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar ban temporário'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function BanUserModal({ account, loading, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Banir conta</h2>
        <p>
          Tem certeza que deseja banir <strong>{accountName(account)}</strong>? A conta perderá todas as permissões e será desconectada imediatamente.
        </p>
        <div className="confirm-warning-box">
          Este ban pode ser revertido pelo botão Desbanir. Para proprietários, os espaços vinculados também serão desativados.
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

function DeleteAccountModal({ account, loading, onClose, onConfirm }) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Deletar conta</h2>
        <p>
          Esta ação exclui todos os dados de <strong>{accountName(account)}</strong> e bloqueia permanentemente o e-mail e CPF/CNPJ para novos cadastros.
        </p>
        <div className="confirm-warning-box">
          Esta ação não é um ban reversível. A conta e seus dados relacionados serão apagados, e as credenciais ficarão proibidas para cadastro futuro.
        </div>
        <label className="field">
          <span>Motivo da exclusão</span>
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Informe o motivo da exclusão permanente" required />
        </label>
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="danger-action" type="button" onClick={() => onConfirm(motivo.trim())} disabled={loading || !motivo.trim()}>
            {loading ? 'Deletando...' : 'Confirmar exclusão'}
          </button>
        </div>
      </section>
    </div>
  )
}
