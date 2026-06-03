import { useState } from 'react'
import { Plus } from 'lucide-react'

<<<<<<< Updated upstream
export function CourtForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
=======
const dayOptions = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
]

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

const defaultDays = [1, 2, 3, 4, 5]
const availableHourOptions = Array.from({ length: 17 }, (_, i) => {
  const hour = 6 + i
  return `${String(hour).padStart(2, '0')}:00`
})
const closingHourOptions = Array.from({ length: 17 }, (_, i) => {
  const hour = 7 + i
  return `${String(hour).padStart(2, '0')}:00`
})
const defaultAvailableHours = availableHourOptions.filter((hour) => hour >= '17:00' && hour < '23:00')

function timeToMinutes(value) {
  const [hours, minutes] = String(value || '').split(':').map(Number)
  return (hours * 60) + minutes
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function buildHoursBetween(start, end) {
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)

  return availableHourOptions.filter((hour) => {
    const minutes = timeToMinutes(hour)
    return minutes >= startMinutes && minutes < endMinutes
  })
}

function buildRangeFromHours(hours) {
  const sorted = [...new Set(hours)].sort()

  if (!sorted.length) {
    return null
  }

  const start = sorted[0]
  const end = minutesToTime(timeToMinutes(sorted[sorted.length - 1]) + 60)

  return {
    hora_inicio: start,
    hora_fim: end,
  }
}

function createCampo(index) {
  return {
    nome: `Campo ${index + 1}`,
    preco_hora: '90',
    fotos: [],
    horarios_funcionamento: [
      {
        dias: defaultDays,
        hora_inicio: '17:00',
        hora_fim: '23:00',
      },
    ],
    horarios_disponiveis: defaultAvailableHours,
    amenities: [],
  }
}

function createInitialForm() {
  return {
>>>>>>> Stashed changes
    nome: '',
    modalidade: 'futsal',
    endereco: '',
    bairro: '',
    cidade: 'Campo Mourao',
    preco_hora: '90',
    imagem_url: '',
    descricao: '',
<<<<<<< Updated upstream
  })
=======
    campos: [createCampo(0)],
  }
}

function mergePhotos(current, selectedFiles) {
  const files = Array.from(selectedFiles || [])
    .filter((file) => file.type.startsWith('image/'))

  return [...current, ...files].slice(0, 10)
}

export function CourtForm({ onSubmit, loading }) {
  const [form, setForm] = useState(createInitialForm)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingSubmit, setConfirmingSubmit] = useState(false)
>>>>>>> Stashed changes

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

<<<<<<< Updated upstream
  async function submit(event) {
    event.preventDefault()
    await onSubmit(form)
    setForm((current) => ({ ...current, nome: '', endereco: '', bairro: '', descricao: '' }))
  }

  return (
    <form className="management-form" onSubmit={submit}>
      <label className="field">
        <span>Nome da quadra</span>
        <input value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Arena Central" />
      </label>
      <label className="field">
        <span>Modalidade</span>
        <select value={form.modalidade} onChange={(event) => update('modalidade', event.target.value)}>
          <option value="futsal">Futsal</option>
          <option value="society">Society</option>
          <option value="basquete">Basquete</option>
          <option value="poliesportiva">Poliesportiva</option>
        </select>
      </label>
      <label className="field">
        <span>Endereco</span>
        <input value={form.endereco} onChange={(event) => update('endereco', event.target.value)} placeholder="Rua e numero" />
      </label>
      <label className="field">
        <span>Bairro</span>
        <input value={form.bairro} onChange={(event) => update('bairro', event.target.value)} placeholder="Centro" />
      </label>
      <label className="field">
        <span>Cidade</span>
        <input value={form.cidade} onChange={(event) => update('cidade', event.target.value)} />
      </label>
      <label className="field">
        <span>Valor por hora</span>
        <input type="number" min="0" value={form.preco_hora} onChange={(event) => update('preco_hora', event.target.value)} />
      </label>
      <label className="field wide-field">
        <span>Imagem URL</span>
        <input value={form.imagem_url} onChange={(event) => update('imagem_url', event.target.value)} placeholder="https://..." />
      </label>
      <label className="field wide-field">
        <span>Descricao</span>
        <textarea value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Caracteristicas do espaco" />
      </label>
      <button className="primary-action wide-field" type="submit" disabled={loading}>
        <Plus size={17} />
        {loading ? 'Salvando...' : 'Cadastrar quadra'}
=======
  function updateCampo(index, field, value) {
    setForm((current) => ({
      ...current,
      campos: current.campos.map((campo, campoIndex) => (
        campoIndex === index ? { ...campo, [field]: value } : campo
      )),
    }))
  }

  function updateQuantidade(value) {
    const amount = Math.min(Math.max(Number(value) || 1, 1), 12)

    setForm((current) => ({
      ...current,
      quantidade_campos: String(amount),
      campos: Array.from({ length: amount }, (_, index) => current.campos[index] || createCampo(index)),
    }))
  }

  function updateHorario(index, field, value) {
    setForm((current) => ({
      ...current,
      campos: current.campos.map((campo, campoIndex) => {
        if (campoIndex !== index) {
          return campo
        }

        const [horario] = campo.horarios_funcionamento
        return {
          ...campo,
          horarios_funcionamento: [
            {
              ...horario,
              [field]: value,
            },
          ],
        }
      }),
    }))
  }

  function updateHorarioRange(index, field, value) {
    setForm((current) => ({
      ...current,
      campos: current.campos.map((campo, campoIndex) => {
        if (campoIndex !== index) {
          return campo
        }

        const [horario] = campo.horarios_funcionamento
        const nextHorario = {
          ...horario,
          [field]: value,
        }
        const start = nextHorario.hora_inicio
        const end = nextHorario.hora_fim

        if (timeToMinutes(end) <= timeToMinutes(start)) {
          return {
            ...campo,
            horarios_funcionamento: [nextHorario],
            horarios_disponiveis: [],
          }
        }

        return {
          ...campo,
          horarios_funcionamento: [nextHorario],
          horarios_disponiveis: buildHoursBetween(start, end),
        }
      }),
    }))
  }

  function toggleDay(index, day) {
    setForm((current) => ({
      ...current,
      campos: current.campos.map((campo, campoIndex) => {
        if (campoIndex !== index) {
          return campo
        }

        const [horario] = campo.horarios_funcionamento
        const selectedDays = horario.dias.includes(day)
          ? horario.dias.filter((item) => item !== day)
          : [...horario.dias, day].sort((a, b) => a - b)

        return {
          ...campo,
          horarios_funcionamento: [{ ...horario, dias: selectedDays }],
        }
      }),
    }))
  }

  function selectAllDays(index) {
    updateHorario(index, 'dias', dayOptions.map((day) => day.value))
  }

  function toggleHour(index, hour) {
    const campo = form.campos[index]
    const current = campo.horarios_disponiveis || []
    const next = current.includes(hour) ? current.filter((h) => h !== hour) : [...current, hour].sort()
    const range = buildRangeFromHours(next)

    if (range) {
      const [horario] = campo.horarios_funcionamento
      updateCampo(index, 'horarios_funcionamento', [{ ...horario, ...range }])
    }

    updateCampo(index, 'horarios_disponiveis', next)
  }

  function selectAllHours(index) {
    const campo = form.campos[index]
    const [horario] = campo.horarios_funcionamento

    updateCampo(index, 'horarios_funcionamento', [{ ...horario, hora_inicio: '06:00', hora_fim: '23:00' }])
    updateCampo(index, 'horarios_disponiveis', availableHourOptions)
  }

  function toggleAmenity(index, amenity) {
    const campo = form.campos[index]
    const amenities = campo.amenities.includes(amenity)
      ? campo.amenities.filter((item) => item !== amenity)
      : [...campo.amenities, amenity]

    updateCampo(index, 'amenities', amenities)
  }

  function selectAllAmenities(index) {
    updateCampo(index, 'amenities', amenityOptions)
  }

  function addPhotos(index, files) {
    const fotos = form.campos[index].fotos || []
    updateCampo(index, 'fotos', mergePhotos(fotos, files))
  }

  function removePhoto(index, photoIndex) {
    const fotos = form.campos[index].fotos.filter((_, currentIndex) => currentIndex !== photoIndex)
    updateCampo(index, 'fotos', fotos)
  }

  function submit(event) {
    event.preventDefault()

    if (loading || submitting) {
      return
    }

    setConfirmingSubmit(true)
  }

  async function confirmSubmit() {
    if (loading || submitting) {
      return
    }

    setConfirmingSubmit(false)
    setSubmitting(true)

    const amount = Math.min(Math.max(Number(form.quantidade_campos) || 1, 1), 12)
    const camposSelecionados = form.campos.slice(0, amount)
    const payload = {
      ...form,
      quantidade_campos: amount,
      campos: camposSelecionados.map((campo, index) => {
        const [horario] = campo.horarios_funcionamento
        const horariosDisponiveis = campo.horarios_disponiveis || []

        return {
          ...campo,
          nome: campo.nome.trim() || `Campo ${index + 1}`,
          preco_hora: Number(campo.preco_hora || 0),
          fotos: campo.fotos || [],
          horarios_funcionamento: horario?.dias?.length && horariosDisponiveis.length ? [horario] : [],
          horarios_disponiveis: horariosDisponiveis,
        }
      }),
    }

    try {
      const saved = await onSubmit(payload)

      if (saved !== false) {
        setForm(createInitialForm())
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="management-form court-registration-form" onSubmit={submit}>
      <section className="form-section wide-field">
        <div className="form-section-header">
          <div>
            <strong>1. Informacoes Basicas</strong>
            <small>Dados principais do espaco esportivo</small>
          </div>
        </div>

        <label className="field">
          <span>Nome do espaco *</span>
          <input required value={form.nome} onChange={(event) => update('nome', event.target.value)} placeholder="Ex.: Arena Futsal Central" />
        </label>

        <label className="field">
          <span>Tipo de esporte *</span>
          <select required value={form.modalidade} onChange={(event) => update('modalidade', event.target.value)}>
            {sportOptions.map((sport) => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Quantos campos existem no espaco? *</span>
          <input required type="number" min="1" max="12" value={form.quantidade_campos} onChange={(event) => updateQuantidade(event.target.value)} />
          <small className="field-help">Ao informar 3, por exemplo, o cadastro cria Campo 1, Campo 2 e Campo 3 com dados proprios.</small>
        </label>

        <label className="field wide-field">
          <span>Descricao</span>
          <textarea value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Descreva estrutura, facilidades e diferenciais do espaco." />
        </label>
      </section>

      <section className="form-section wide-field">
        <div className="form-section-header">
          <div>
            <strong>2. Localizacao</strong>
            <small>Onde o espaco esta localizado</small>
          </div>
        </div>

        <label className="field wide-field">
          <span>Endereco completo *</span>
          <input required value={form.endereco} onChange={(event) => update('endereco', event.target.value)} placeholder="Rua, numero, bairro" />
        </label>

        <label className="field">
          <span>Bairro</span>
          <input value={form.bairro} onChange={(event) => update('bairro', event.target.value)} placeholder="Centro" />
        </label>

        <label className="field">
          <span>Cidade</span>
          <input value={form.cidade} onChange={(event) => update('cidade', event.target.value)} />
        </label>
      </section>

      {form.campos.map((campo, index) => {
        const [horario] = campo.horarios_funcionamento

        return (
          <section className="subcourt-card wide-field" key={`campo-${index}`}>
            <div className="form-section-header">
              <div>
                <strong>Campo {index + 1}</strong>
                <small>Fotos, preco, funcionamento e comodidades deste campo</small>
              </div>
            </div>

            <div className="subcourt-grid">
              <label className="field">
                <span>Nome do campo *</span>
                <input required value={campo.nome} onChange={(event) => updateCampo(index, 'nome', event.target.value)} placeholder={`Campo ${index + 1}`} />
              </label>

              <label className="field">
                <span>Valor por hora (R$) *</span>
                <input required type="number" min="0" step="0.01" value={campo.preco_hora} onChange={(event) => updateCampo(index, 'preco_hora', event.target.value)} />
              </label>
            </div>

            <div className="form-block">
              <div className="form-section-header compact">
                <div>
                  <strong>Fotos do Campo {index + 1}</strong>
                  <small>Envie ate 10 fotos do seu computador; a primeira sera a imagem principal.</small>
                </div>
              </div>

              <div className="photo-upload-box">
                <label className="secondary-action photo-upload-button">
                  <ImagePlus size={16} />
                  Escolher fotos
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    type="file"
                    onChange={(event) => {
                      addPhotos(index, event.target.files)
                      event.target.value = ''
                    }}
                  />
                </label>
                <span>{campo.fotos.length ? `${campo.fotos.length} foto(s) selecionada(s)` : 'Nenhuma foto selecionada'}</span>
              </div>

              {campo.fotos.length > 0 && (
                <div className="photo-file-list">
                  {campo.fotos.map((foto, photoIndex) => (
                    <div className="photo-file-row" key={`${foto.name}-${photoIndex}`}>
                      <span>{photoIndex + 1}. {foto.name}</span>
                      <button className="text-switch remove-inline" type="button" onClick={() => removePhoto(index, photoIndex)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-block">
              <div className="form-section-header compact">
                <div>
                  <strong>Horarios de Funcionamento</strong>
                  <small>Defina os dias e a faixa de horario em que este campo abre.</small>
                </div>
                <button className="secondary-action slim-action" type="button" onClick={() => selectAllDays(index)}>
                  Selecionar todos
                </button>
              </div>

              <div className="day-choice-grid">
                {dayOptions.map((day) => (
                  <button
                    className={horario.dias.includes(day.value) ? 'choice-pill is-selected' : 'choice-pill'}
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(index, day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="time-range-grid">
                <label className="field">
                  <span>Abre</span>
                  <select value={horario.hora_inicio} onChange={(event) => updateHorarioRange(index, 'hora_inicio', event.target.value)}>
                    {availableHourOptions.map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Fecha</span>
                  <select value={horario.hora_fim} onChange={(event) => updateHorarioRange(index, 'hora_fim', event.target.value)}>
                    {closingHourOptions.map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="form-block">
              <div className="form-section-header compact">
                <div>
                  <strong>Horários Disponíveis</strong>
                  <small>Esses são os horários que o usuário verá para reservar.</small>
                </div>
                <button className="secondary-action slim-action" type="button" onClick={() => selectAllHours(index)}>
                  Selecionar Todos
                </button>
              </div>

              <div className="available-times-grid">
                {availableHourOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={(campo.horarios_disponiveis || []).includes(h) ? 'choice-pill is-selected' : 'choice-pill'}
                    onClick={() => toggleHour(index, h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-block">
              <div className="form-section-header compact">
                <div>
                  <strong>Comodidades</strong>
                  <small>Marque as facilidades oferecidas neste campo.</small>
                </div>
                <button className="secondary-action slim-action" type="button" onClick={() => selectAllAmenities(index)}>
                  Selecionar todas
                </button>
              </div>

              <div className="amenity-choice-grid">
                {amenityOptions.map((amenity) => (
                  <label className="checkbox-pill" key={amenity}>
                    <input type="checkbox" checked={campo.amenities.includes(amenity)} onChange={() => toggleAmenity(index, amenity)} />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <button className="primary-action wide-field" type="submit" disabled={loading || submitting}>
        <Plus size={17} />
        {loading || submitting ? 'Salvando...' : form.campos.length > 1 ? `Cadastrar ${form.campos.length} campos` : 'Cadastrar quadra'}
>>>>>>> Stashed changes
      </button>
      </form>

      {confirmingSubmit && (
        <div className="modal-backdrop">
          <section className="reservation-modal confirm-dialog-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-court-title">
            <h2 id="confirm-court-title">Confirmar cadastro</h2>
            <p>Deseja mesmo cadastrar esta quadra?</p>
            <div className="confirm-warning-box">
              Para um novo cadastro, uma nova documenta&ccedil;&atilde;o dever&aacute; ser enviada para an&aacute;lise.
            </div>
            <div className="modal-actions">
              <button className="secondary-action" type="button" disabled={submitting} onClick={() => setConfirmingSubmit(false)}>
                Voltar
              </button>
              <button className="primary-action" type="button" disabled={submitting || loading} onClick={confirmSubmit}>
                {submitting || loading ? 'Salvando...' : 'Confirmar cadastro'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
