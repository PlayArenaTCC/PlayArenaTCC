import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { weekDays } from '../../data/demoData'
<<<<<<< Updated upstream
import { formatCurrency } from '../../utils/formatters'

export function OwnerCourtCard({ quadra, onCreateSchedule }) {
  const [open, setOpen] = useState(false)
=======
import { formatCourtAddress, formatCurrency, formatDate, shortTime, todayISO } from '../../utils/formatters'

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

const documentationStatusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em analise',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
}

function uniqueList(items) {
  return (items || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, list) => (
      list.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index
    ))
}

function getSchedulePrice(horario, basePrice) {
  const base = Number(basePrice || 0)

  if (Object.prototype.hasOwnProperty.call(horario || {}, 'valor_especial')) {
    return horario.valor_especial ? Number(horario.valor || base || 0) : base
  }

  return Number(horario?.valor || base || 0)
}

function getScheduleGroupLabel(horario) {
  return horario.data ? formatDate(horario.data) : weekDays[horario.dia_semana] || 'Data especifica'
}

function compareSchedules(a, b) {
  const aHasDate = Boolean(a.data)
  const bHasDate = Boolean(b.data)

  if (aHasDate !== bHasDate) {
    return aHasDate ? 1 : -1
  }

  if (aHasDate && bHasDate) {
    return String(a.data).localeCompare(String(b.data)) || String(a.hora_inicio).localeCompare(String(b.hora_inicio))
  }

  return Number(a.dia_semana ?? 0) - Number(b.dia_semana ?? 0) || String(a.hora_inicio).localeCompare(String(b.hora_inicio))
}

function groupSchedules(horarios) {
  return (horarios || [])
    .slice()
    .sort(compareSchedules)
    .reduce((groups, horario) => {
      const label = getScheduleGroupLabel(horario)
      const current = groups.find((group) => group.label === label)

      if (current) {
        current.items.push(horario)
        return groups
      }

      return [...groups, { label, items: [horario] }]
    }, [])
}

export function OwnerCourtCard({ quadra, onCreateSchedule, onDeleteCourt, onDeleteSchedule, onUpdateCourt, onUpdateScheduleAvailability, onOpen }) {
  const [open, setOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const documentationStatus = quadra.documentacao_local?.status || 'pendente'
  const amenities = quadra.amenities || []
  const activeScheduleGroups = groupSchedules((quadra.horarios_disponiveis || []).filter((horario) => horario.disponivel !== false))
  const inactiveScheduleGroups = groupSchedules((quadra.horarios_disponiveis || []).filter((horario) => horario.disponivel === false))
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    preco_hora: quadra.preco_hora || 0,
    amenities,
    fotos: [],
  })
>>>>>>> Stashed changes
  const [schedule, setSchedule] = useState({
    dia_semana: 1,
    hora_inicio: '18:00',
    hora_fim: '19:00',
    valor: quadra.preco_hora || 90,
  })

  function update(field, value) {
    setSchedule((current) => ({ ...current, [field]: value }))
  }

  return (
    <article className="court-card owner-card">
      <img src={quadra.imagem_url} alt={quadra.nome} />
      <div className="court-card-body">
        <span className="tag">{quadra.ativa === false ? 'inativa' : 'ativa'}</span>
        <span className={`status-dot status-${documentationStatus}`}>Docs: {documentationStatusLabels[documentationStatus] || documentationStatus}</span>
        <h3>{quadra.nome}</h3>
        <p>
          <MapPin size={15} />
          {formatCourtAddress(quadra, 'Localidade nao informada')}
        </p>
        <div className="court-card-footer">
          <strong>{formatCurrency(quadra.preco_hora)}<small>/h</small></strong>
<<<<<<< Updated upstream
          <button className="secondary-action" type="button" onClick={() => setOpen((value) => !value)}>
            Horarios
          </button>
        </div>
        {open && (
          <form className="schedule-form" onSubmit={(event) => {
            event.preventDefault()
            onCreateSchedule(quadra, schedule)
          }}>
            <select value={schedule.dia_semana} onChange={(event) => update('dia_semana', event.target.value)}>
              {weekDays.map((day, index) => (
                <option value={index} key={day}>{day}</option>
              ))}
            </select>
            <input type="time" value={schedule.hora_inicio} onChange={(event) => update('hora_inicio', event.target.value)} />
            <input type="time" value={schedule.hora_fim} onChange={(event) => update('hora_fim', event.target.value)} />
            <input type="number" min="0" value={schedule.valor} onChange={(event) => update('valor', event.target.value)} />
            <button className="primary-action" type="submit">Adicionar</button>
          </form>
=======
          <button className="secondary-action" type="button" onClick={(event) => {
            event.stopPropagation()
            setOpen((value) => !value)
          }}>
            Gerenciar horários
          </button>
        </div>
        {open && (
          <div className="owner-schedule-manager" onClick={(event) => event.stopPropagation()}>
            <form className="owner-court-edit-form" onSubmit={submitEdit}>
              <div className="owner-schedule-active">
                <strong>Editar anuncio</strong>
                <p>Altere apenas o preco geral, fotos e comodidades da quadra.</p>
              </div>

              <label>
                <span>Preco geral exibido na vitrine</span>
                <input type="number" min="0" step="0.01" value={editForm.preco_hora} onChange={(event) => updateEdit('preco_hora', event.target.value)} />
              </label>

              <div className="photo-upload-box">
                <label className="secondary-action photo-upload-button">
                  <ImagePlus size={16} />
                  Trocar fotos
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    type="file"
                    onChange={(event) => {
                      addEditPhotos(event.target.files)
                      event.target.value = ''
                    }}
                  />
                </label>
                <span>{editForm.fotos.length ? `${editForm.fotos.length} nova(s) foto(s)` : 'Mantendo as fotos atuais'}</span>
              </div>

              {editForm.fotos.length > 0 && (
                <div className="photo-file-list">
                  {editForm.fotos.map((foto, index) => (
                    <div className="photo-file-row" key={`${foto.name}-${index}`}>
                      <span>{index + 1}. {foto.name}</span>
                      <button className="text-switch remove-inline" type="button" onClick={() => removeEditPhoto(index)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="owner-edit-amenities">
                {amenityOptions.map((amenity) => (
                  <label className="checkbox-pill" key={amenity}>
                    <input type="checkbox" checked={editForm.amenities.includes(amenity)} onChange={() => toggleEditAmenity(amenity)} />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>

              <button className="primary-action" type="submit" disabled={savingEdit}>
                {savingEdit ? 'Salvando...' : 'Salvar alteracoes'}
              </button>
              <button className="danger-action" type="button" onClick={requestDeleteCourt}>
                Excluir anúncio
              </button>
            </form>

            <div className="owner-schedule-active">
              <strong>Horários ativos</strong>
              {activeScheduleGroups.length ? (
                <div className="owner-schedule-groups">
                  {activeScheduleGroups.map((group) => (
                    <div className="owner-schedule-group" key={group.label}>
                      <small>{group.label}</small>
                      {group.items.map((horario) => (
                        <div className="owner-schedule-row" key={horario.id}>
                          <Clock size={14} />
                          <span className="owner-schedule-time">
                          {shortTime(horario.hora_inicio)} - {shortTime(horario.hora_fim)} · {formatCurrency(getSchedulePrice(horario, quadra.preco_hora))}
                          </span>
                          <div className="owner-schedule-row-actions">
                            <button className="schedule-disable-button" type="button" title="Inativar horario" aria-label="Inativar horario" onClick={() => onUpdateScheduleAvailability?.(quadra, horario, false)}>
                              <EyeOff size={13} />
                            </button>
                            <button className="schedule-delete-button" type="button" title="Apagar horario" aria-label="Apagar horario" onClick={() => onDeleteSchedule?.(quadra, horario)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhum horário ativo cadastrado.</p>
              )}
            </div>

            {inactiveScheduleGroups.length > 0 && (
              <div className="owner-schedule-active">
                <strong>Hor&aacute;rios inativos</strong>
                <div className="owner-schedule-groups">
                  {inactiveScheduleGroups.map((group) => (
                    <div className="owner-schedule-group is-inactive" key={group.label}>
                      <small>{group.label}</small>
                      {group.items.map((horario) => (
                        <div className="owner-schedule-row is-inactive" key={horario.id}>
                          <Clock size={14} />
                          <span className="owner-schedule-time">
                            {shortTime(horario.hora_inicio)} - {shortTime(horario.hora_fim)} · {formatCurrency(getSchedulePrice(horario, quadra.preco_hora))}
                          </span>
                          <div className="owner-schedule-row-actions">
                            <button className="schedule-reactivate-button" type="button" title="Reativar horario" aria-label="Reativar horario" onClick={() => onUpdateScheduleAvailability?.(quadra, horario, true)}>
                              <Eye size={13} />
                            </button>
                            <button className="schedule-delete-button" type="button" title="Apagar horario" aria-label="Apagar horario" onClick={() => onDeleteSchedule?.(quadra, horario)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form className="schedule-form" onSubmit={submitSchedule}>
              <div className="schedule-type-toggle" role="group" aria-label="Tipo de horario">
                <button className={schedule.tipo === 'weekly' ? 'is-selected' : ''} type="button" onClick={() => update('tipo', 'weekly')}>
                  Dia fixo
                </button>
                <button className={schedule.tipo === 'date' ? 'is-selected' : ''} type="button" onClick={() => update('tipo', 'date')}>
                  Data especifica
                </button>
              </div>
              {schedule.tipo === 'weekly' ? (
                <label>
                  <span>Dia</span>
                  <select value={schedule.dia_semana} onChange={(event) => update('dia_semana', event.target.value)}>
                    {weekDays.map((day, index) => (
                      <option value={index} key={day}>{day}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span>Data</span>
                  <input type="date" min={todayISO()} value={schedule.data} onChange={(event) => update('data', event.target.value)} />
                </label>
              )}
              <label>
                <span>Início</span>
                <input type="time" value={schedule.hora_inicio} onChange={(event) => update('hora_inicio', event.target.value)} />
              </label>
              <label>
                <span>Fim</span>
                <input type="time" value={schedule.hora_fim} onChange={(event) => update('hora_fim', event.target.value)} />
              </label>
              <label>
                <span>Valor</span>
                <input type="number" min="0" value={schedule.valor} onChange={(event) => update('valor', event.target.value)} />
              </label>
              <button className="primary-action" type="submit">Adicionar horário</button>
            </form>
          </div>
>>>>>>> Stashed changes
        )}
      </div>
    </article>
  )
}
