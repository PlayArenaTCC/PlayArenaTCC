import { useState } from 'react'
import {
  CalendarClock,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  MapPin,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react'
import { fallbackCourtImage, sportLabels, sportOptions, weekDays } from '../../data/demoData'
import { formatCourtAddress, formatCurrency, formatDate, shortTime, todayISO } from '../../utils/formatters'

const spaceTypeOptions = ['Quadra', 'Arena', 'Campo', 'Ginásio', 'Complexo esportivo']
const amenityOptions = [
  'Estacionamento',
  'Vestiário',
  'Chuveiro',
  'Iluminação',
  'Cobertura',
  'Lanchonete',
  'Wi-Fi',
  'Ar Condicionado',
  'Bebedouro',
  'Arquibancada',
  'Material Esportivo',
  'Segurança 24h',
]

function uniqueList(items) {
  return (items || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index)
}

function createSchedule(preco = 0) {
  return {
    dia_semana: 1,
    hora_inicio: '18:00',
    hora_fim: '19:00',
    valor: preco || 0,
  }
}

function createInitialSpace(proprietarios = []) {
  return {
    proprietario_id: proprietarios[0]?.id || '',
    nome: '',
    tipo_espaco: 'Quadra',
    modalidade: 'futsal',
    modalidades: ['futsal'],
    cidade: 'Campo Mourão',
    endereco: '',
    numero: '',
    bairro: '',
    estado: 'PR',
    cep: '',
    descricao: '',
    preco_hora: '',
    fotos: [],
    amenities: [],
    ativa: true,
    horarios: [createSchedule()],
  }
}

function spaceToForm(space) {
  return {
    proprietario_id: space.proprietario_id || '',
    nome: space.nome || '',
    tipo_espaco: space.tipo_espaco || 'Quadra',
    modalidade: space.modalidade || 'poliesportiva',
    modalidades: uniqueList(space.modalidades || [space.modalidade]),
    cidade: space.cidade || '',
    endereco: space.endereco || '',
    numero: space.numero || '',
    bairro: space.bairro || '',
    estado: space.estado || 'PR',
    cep: space.cep || '',
    descricao: space.descricao || '',
    preco_hora: space.preco_hora || 0,
    fotos: uniqueList([space.imagem_url, ...(space.fotos || [])]),
    amenities: uniqueList(space.amenities),
    ativa: space.ativa_base ?? space.ativa !== false,
  }
}

function localDateTimeDefaults() {
  const start = new Date()
  start.setMinutes(start.getMinutes() + 5)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  const toDate = (value) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const toTime = (value) => `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`

  return {
    data_inicio: toDate(start),
    hora_inicio: toTime(start),
    data_fim: toDate(end),
    hora_fim: toTime(end),
    motivo: '',
  }
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('pt-BR') : ''
}

function getOwnerName(space) {
  return space.proprietario?.nome_empresa || space.proprietario?.nome_responsavel || 'Proprietário não informado'
}

export function AdminSpacesView({
  espacos,
  proprietarios,
  loading,
  onClearSpaceDeactivation,
  onCreateSchedule,
  onCreateSpace,
  onDeactivateSpace,
  onDeleteSchedule,
  onDeleteSpace,
  onUpdateScheduleAvailability,
  onUpdateSpace,
}) {
  const [formState, setFormState] = useState(null)
  const [deactivationTarget, setDeactivationTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [scheduleTargetId, setScheduleTargetId] = useState('')

  function openCreate() {
    setFormState({
      mode: 'create',
      space: null,
      form: createInitialSpace(proprietarios),
    })
  }

  function openEdit(space) {
    setFormState({
      mode: 'edit',
      space,
      form: spaceToForm(space),
    })
  }

  async function submitSpace(form) {
    const saved = formState.mode === 'create'
      ? await onCreateSpace(form)
      : await onUpdateSpace(formState.space, form)

    if (saved) {
      setFormState(null)
    }
  }

  return (
    <section className="screen-stack">
      <div className="admin-spaces-heading">
        <div>
          <span>Supervisão</span>
          <h1>Espaços do Administrador</h1>
          <p>Crie, edite, desative e exclua espaços cadastrados na plataforma.</p>
        </div>
        <button className="primary-action" type="button" onClick={openCreate}>
          <Plus size={16} />
          Novo Espaço
        </button>
      </div>

      <div className="admin-space-list">
        {espacos.length ? espacos.map((space) => (
          <AdminSpaceCard
            key={space.id}
            space={space}
            scheduleOpen={scheduleTargetId === space.id}
            onClearDeactivation={onClearSpaceDeactivation}
            onCreateSchedule={onCreateSchedule}
            onDeactivate={() => setDeactivationTarget(space)}
            onDelete={() => setDeleteTarget(space)}
            onDeleteSchedule={onDeleteSchedule}
            onEdit={() => openEdit(space)}
            onToggleSchedules={() => setScheduleTargetId((current) => current === space.id ? '' : space.id)}
            onUpdateScheduleAvailability={onUpdateScheduleAvailability}
          />
        )) : (
          <section className="empty-state">
            <MapPin size={30} />
            <h2>Nenhum espaço cadastrado</h2>
            <p>Use o botão Novo Espaço para iniciar o cadastro.</p>
          </section>
        )}
      </div>

      {formState && (
        <AdminSpaceFormModal
          form={formState.form}
          loading={loading}
          mode={formState.mode}
          proprietarios={proprietarios}
          onClose={() => setFormState(null)}
          onSubmit={submitSpace}
        />
      )}

      {deactivationTarget && (
        <DeactivationModal
          loading={loading}
          space={deactivationTarget}
          onClose={() => setDeactivationTarget(null)}
          onSubmit={async (payload) => {
            const saved = await onDeactivateSpace(deactivationTarget, payload)
            if (saved) {
              setDeactivationTarget(null)
            }
          }}
        />
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Excluir espaço permanentemente</h2>
            <p>Deseja excluir <strong>{deleteTarget.nome}</strong>? Horários, reservas, imagens e dados relacionados serão removidos.</p>
            <div className="confirm-warning-box">Esta ação é permanente e não poderá ser desfeita.</div>
            <div className="modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancelar</button>
              <button
                className="danger-action"
                type="button"
                disabled={loading}
                onClick={async () => {
                  const deleted = await onDeleteSpace(deleteTarget)
                  if (deleted) {
                    setDeleteTarget(null)
                  }
                }}
              >
                {loading ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function AdminSpaceCard({
  space,
  scheduleOpen,
  onClearDeactivation,
  onCreateSchedule,
  onDeactivate,
  onDelete,
  onDeleteSchedule,
  onEdit,
  onToggleSchedules,
  onUpdateScheduleAvailability,
}) {
  const hasDeactivation = Boolean(space.desativada_inicio_em && space.desativada_fim_em)
  const statusLabel = space.ativa ? 'ATIVO' : 'INATIVO'

  return (
    <article className="admin-space-card">
      <img src={space.imagem_url || fallbackCourtImage} alt="" onError={(event) => { event.currentTarget.src = fallbackCourtImage }} />
      <div className="admin-space-card-main">
        <div className="admin-space-card-title">
          <span className={space.ativa ? 'admin-court-status is-active' : 'admin-court-status is-inactive'}>{statusLabel}</span>
          {space.desativacao_agendada && <span className="admin-court-status is-scheduled">DESATIVAÇÃO AGENDADA</span>}
          <h3>{space.nome}</h3>
        </div>
        <p>{space.tipo_espaco} · {getOwnerName(space)} · {formatCourtAddress(space, space.cidade)}</p>
        <div className="admin-space-chips">
          {(space.modalidades || [space.modalidade]).map((modality) => <span key={modality}>{sportLabels[modality] || modality}</span>)}
          {(space.amenities || []).slice(0, 3).map((amenity) => <span key={amenity}>{amenity}</span>)}
        </div>
        {hasDeactivation && (
          <small className="admin-space-deactivation-note">
            {space.temporariamente_inativa ? 'Inativo' : space.desativacao_agendada ? 'Agendado' : 'Período encerrado'}:
            {' '}{formatDateTime(space.desativada_inicio_em)} até {formatDateTime(space.desativada_fim_em)}
            {space.motivo_desativacao ? ` · ${space.motivo_desativacao}` : ''}
          </small>
        )}
      </div>
      <strong className="admin-space-price">{formatCurrency(space.preco_hora)}</strong>
      <div className="admin-space-actions">
        <button className="secondary-action" type="button" onClick={onEdit}><Edit3 size={14} /> Editar</button>
        <button className="secondary-action" type="button" onClick={onToggleSchedules}><Clock size={14} /> Horários</button>
        <button className="soft-action" type="button" onClick={onDeactivate}><Power size={14} /> Desativar</button>
        {hasDeactivation && (
          <button className="soft-action" type="button" onClick={() => onClearDeactivation(space)}><Eye size={14} /> Reativar</button>
        )}
        <button className="danger-action" type="button" onClick={onDelete}><Trash2 size={14} /> Deletar</button>
      </div>
      {scheduleOpen && (
        <ScheduleManager
          space={space}
          onCreateSchedule={onCreateSchedule}
          onDeleteSchedule={onDeleteSchedule}
          onUpdateScheduleAvailability={onUpdateScheduleAvailability}
        />
      )}
    </article>
  )
}

function AdminSpaceFormModal({ form: initialForm, loading, mode, proprietarios, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const isCreate = mode === 'create'

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleList(field, value) {
    setForm((current) => {
      const list = current[field] || []

      if (field === 'modalidades' && list.includes(value) && list.length === 1) {
        return current
      }

      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      return {
        ...current,
        [field]: next,
        ...(field === 'modalidades' ? { modalidade: next[0] || current.modalidade } : {}),
      }
    })
  }

  function addPhotos(files) {
    setForm((current) => ({
      ...current,
      fotos: [...(current.fotos || []), ...Array.from(files || []).filter((file) => file.type.startsWith('image/'))].slice(0, 10),
    }))
  }

  function updateSchedule(index, field, value) {
    setForm((current) => ({
      ...current,
      horarios: current.horarios.map((schedule, currentIndex) => currentIndex === index ? { ...schedule, [field]: value } : schedule),
    }))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal admin-space-form-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <h2>{isCreate ? 'Novo Espaço' : 'Editar Espaço'}</h2>
        <form className="admin-space-form" onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            ...form,
            modalidades: uniqueList(form.modalidades),
            amenities: uniqueList(form.amenities),
          })
        }}>
          <label className="field">
            <span>Proprietário</span>
            <select value={form.proprietario_id} onChange={(event) => update('proprietario_id', event.target.value)} disabled={!isCreate} required>
              <option value="">Selecione</option>
              {proprietarios.map((owner) => <option key={owner.id} value={owner.id}>{owner.nome_empresa || owner.nome_responsavel}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Nome do espaço</span>
            <input value={form.nome} onChange={(event) => update('nome', event.target.value)} required />
          </label>
          <label className="field">
            <span>Tipo da arena/quadra</span>
            <select value={form.tipo_espaco} onChange={(event) => update('tipo_espaco', event.target.value)}>
              {spaceTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Status permanente</span>
            <select value={form.ativa ? 'ativo' : 'inativo'} onChange={(event) => update('ativa', event.target.value === 'ativo')}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
          <label className="field">
            <span>Cidade</span>
            <input value={form.cidade} onChange={(event) => update('cidade', event.target.value)} required />
          </label>
          <label className="field">
            <span>Endereço</span>
            <input value={form.endereco} onChange={(event) => update('endereco', event.target.value)} required />
          </label>
          <label className="field">
            <span>Número</span>
            <input value={form.numero} onChange={(event) => update('numero', event.target.value)} />
          </label>
          <label className="field">
            <span>Bairro</span>
            <input value={form.bairro} onChange={(event) => update('bairro', event.target.value)} />
          </label>
          <label className="field">
            <span>Estado</span>
            <input maxLength={2} value={form.estado} onChange={(event) => update('estado', event.target.value.toUpperCase())} />
          </label>
          <label className="field">
            <span>CEP</span>
            <input value={form.cep} onChange={(event) => update('cep', event.target.value)} />
          </label>
          <label className="field">
            <span>Valor por hora</span>
            <input type="number" min="0" step="0.01" value={form.preco_hora} onChange={(event) => update('preco_hora', event.target.value)} required />
          </label>
          <label className="field wide-field">
            <span>Descrição</span>
            <textarea value={form.descricao} onChange={(event) => update('descricao', event.target.value)} />
          </label>

          <div className="admin-space-form-block wide-field">
            <strong>Modalidades esportivas</strong>
            <div className="admin-space-choice-grid">
              {sportOptions.map((sport) => (
                <label className="checkbox-pill" key={sport.value}>
                  <input type="checkbox" checked={form.modalidades.includes(sport.value)} onChange={() => toggleList('modalidades', sport.value)} />
                  <span>{sport.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-space-form-block wide-field">
            <strong>Comodidades</strong>
            <div className="admin-space-choice-grid">
              {amenityOptions.map((amenity) => (
                <label className="checkbox-pill" key={amenity}>
                  <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleList('amenities', amenity)} />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="admin-space-form-block wide-field">
            <strong>Imagens</strong>
            <label className="secondary-action admin-space-photo-button">
              <ImagePlus size={15} />
              Adicionar imagens
              <input
                accept="image/png,image/jpeg,image/webp"
                multiple
                type="file"
                onChange={(event) => {
                  addPhotos(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
            <div className="admin-space-photo-list">
              {(form.fotos || []).map((photo, index) => (
                <span key={typeof photo === 'string' ? photo : `${photo.name}-${index}`}>
                  {typeof photo === 'string' ? `Imagem ${index + 1}` : photo.name}
                  <button type="button" onClick={() => update('fotos', form.fotos.filter((_, currentIndex) => currentIndex !== index))}>Remover</button>
                </span>
              ))}
            </div>
          </div>

          {isCreate && (
            <div className="admin-space-form-block wide-field">
              <div className="admin-space-block-heading">
                <strong>Horários disponíveis</strong>
                <button className="secondary-action" type="button" onClick={() => update('horarios', [...form.horarios, createSchedule(form.preco_hora)])}>
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              <div className="admin-initial-schedules">
                {form.horarios.map((schedule, index) => (
                  <div className="admin-initial-schedule-row" key={index}>
                    <select value={schedule.dia_semana} onChange={(event) => updateSchedule(index, 'dia_semana', Number(event.target.value))}>
                      {weekDays.map((day, dayIndex) => <option value={dayIndex} key={day}>{day}</option>)}
                    </select>
                    <input type="time" value={schedule.hora_inicio} onChange={(event) => updateSchedule(index, 'hora_inicio', event.target.value)} />
                    <input type="time" value={schedule.hora_fim} onChange={(event) => updateSchedule(index, 'hora_fim', event.target.value)} />
                    <input type="number" min="0" step="0.01" value={schedule.valor} onChange={(event) => updateSchedule(index, 'valor', event.target.value)} placeholder="Valor" />
                    <button className="danger-action" type="button" onClick={() => update('horarios', form.horarios.filter((_, currentIndex) => currentIndex !== index))}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions wide-field">
            <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="primary-action" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar espaço'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ScheduleManager({ space, onCreateSchedule, onDeleteSchedule, onUpdateScheduleAvailability }) {
  const [schedule, setSchedule] = useState({
    tipo: 'weekly',
    dia_semana: 1,
    data: todayISO(),
    hora_inicio: '18:00',
    hora_fim: '19:00',
    valor: space.preco_hora || 0,
  })
  const schedules = (space.horarios_disponiveis || []).slice().sort((a, b) => (
    String(a.data || '').localeCompare(String(b.data || ''))
    || Number(a.dia_semana ?? 0) - Number(b.dia_semana ?? 0)
    || String(a.hora_inicio).localeCompare(String(b.hora_inicio))
  ))

  return (
    <div className="admin-space-schedule-manager">
      <strong>Gerenciar horários</strong>
      <div className="admin-space-schedule-list">
        {schedules.length ? schedules.map((item) => (
          <div className={item.disponivel === false ? 'admin-space-schedule-row is-inactive' : 'admin-space-schedule-row'} key={item.id}>
            <Clock size={14} />
            <span>{item.data ? formatDate(item.data) : weekDays[item.dia_semana]} · {shortTime(item.hora_inicio)} - {shortTime(item.hora_fim)} · {formatCurrency(item.valor ?? space.preco_hora)}</span>
            <button
              className={item.disponivel === false ? 'schedule-reactivate-button' : 'schedule-disable-button'}
              type="button"
              onClick={() => onUpdateScheduleAvailability(space, item, item.disponivel === false)}
              title={item.disponivel === false ? 'Reativar horário' : 'Inativar horário'}
            >
              {item.disponivel === false ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button className="schedule-delete-button" type="button" onClick={() => onDeleteSchedule(space, item)} title="Excluir horário"><Trash2 size={13} /></button>
          </div>
        )) : <p>Nenhum horário cadastrado.</p>}
      </div>
      <form className="schedule-form" onSubmit={(event) => {
        event.preventDefault()
        onCreateSchedule(space, {
          ...(schedule.tipo === 'date' ? { data: schedule.data } : { dia_semana: schedule.dia_semana }),
          hora_inicio: schedule.hora_inicio,
          hora_fim: schedule.hora_fim,
          valor: schedule.valor,
        })
      }}>
        <div className="schedule-type-toggle">
          <button className={schedule.tipo === 'weekly' ? 'is-selected' : ''} type="button" onClick={() => setSchedule((current) => ({ ...current, tipo: 'weekly' }))}>Dia fixo</button>
          <button className={schedule.tipo === 'date' ? 'is-selected' : ''} type="button" onClick={() => setSchedule((current) => ({ ...current, tipo: 'date' }))}>Data específica</button>
        </div>
        {schedule.tipo === 'weekly' ? (
          <label><span>Dia</span><select value={schedule.dia_semana} onChange={(event) => setSchedule((current) => ({ ...current, dia_semana: Number(event.target.value) }))}>{weekDays.map((day, index) => <option value={index} key={day}>{day}</option>)}</select></label>
        ) : (
          <label><span>Data</span><input type="date" min={todayISO()} value={schedule.data} onChange={(event) => setSchedule((current) => ({ ...current, data: event.target.value }))} /></label>
        )}
        <label><span>Início</span><input type="time" value={schedule.hora_inicio} onChange={(event) => setSchedule((current) => ({ ...current, hora_inicio: event.target.value }))} /></label>
        <label><span>Fim</span><input type="time" value={schedule.hora_fim} onChange={(event) => setSchedule((current) => ({ ...current, hora_fim: event.target.value }))} /></label>
        <label><span>Valor</span><input type="number" min="0" step="0.01" value={schedule.valor} onChange={(event) => setSchedule((current) => ({ ...current, valor: event.target.value }))} /></label>
        <button className="primary-action" type="submit">Adicionar horário</button>
      </form>
    </div>
  )
}

function DeactivationModal({ loading, space, onClose, onSubmit }) {
  const [form, setForm] = useState(localDateTimeDefaults)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Desativar Espaço</h2>
        <p>Defina o período em que <strong>{space.nome}</strong> ficará indisponível para novas reservas.</p>
        <form className="admin-deactivation-form" onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}>
          <label className="field"><span>Data de início</span><input type="date" min={todayISO()} value={form.data_inicio} onChange={(event) => setForm((current) => ({ ...current, data_inicio: event.target.value }))} required /></label>
          <label className="field"><span>Hora de início</span><input type="time" value={form.hora_inicio} onChange={(event) => setForm((current) => ({ ...current, hora_inicio: event.target.value }))} required /></label>
          <label className="field"><span>Data final</span><input type="date" min={form.data_inicio || todayISO()} value={form.data_fim} onChange={(event) => setForm((current) => ({ ...current, data_fim: event.target.value }))} required /></label>
          <label className="field"><span>Hora final</span><input type="time" value={form.hora_fim} onChange={(event) => setForm((current) => ({ ...current, hora_fim: event.target.value }))} required /></label>
          <label className="field wide-field"><span>Motivo da desativação (opcional)</span><textarea value={form.motivo} onChange={(event) => setForm((current) => ({ ...current, motivo: event.target.value }))} /></label>
          <div className="modal-actions wide-field">
            <button className="secondary-action" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="danger-action" type="submit" disabled={loading}><CalendarClock size={14} /> {loading ? 'Salvando...' : 'Confirmar desativação'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
