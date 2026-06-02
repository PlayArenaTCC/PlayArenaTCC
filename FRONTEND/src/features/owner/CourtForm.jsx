import { useState } from 'react'
import { ImagePlus, Plus } from 'lucide-react'
import { sportOptions } from '../../data/demoData'

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
  'Vestiario',
  'Chuveiro',
  'Iluminacao',
  'Cobertura',
  'Lanchonete',
  'Wi-Fi',
  'Ar Condicionado',
  'Bebedouro',
  'Arquibancada',
  'Material Esportivo',
  'Seguranca 24h',
]

const defaultDays = [1, 2, 3, 4, 5]

function createCampo(index) {
  return {
    nome: `Campo ${index + 1}`,
    preco_hora: '90',
    fotos: [''],
    horarios_funcionamento: [
      {
        dias: defaultDays,
        hora_inicio: '17:00',
        hora_fim: '23:00',
      },
    ],
    horarios_disponiveis: [],
    amenities: [],
  }
}

function createInitialForm() {
  return {
    nome: '',
    modalidade: 'futsal',
    quantidade_campos: '1',
    endereco: '',
    bairro: '',
    cidade: 'Campo Mourao',
    estado: 'PR',
    descricao: '',
    campos: [createCampo(0)],
  }
}

function cleanPhotos(fotos) {
  return fotos.map((foto) => foto.trim()).filter(Boolean).slice(0, 10)
}

export function CourtForm({ onSubmit, loading }) {
  const [form, setForm] = useState(createInitialForm)

  const availableHours = Array.from({ length: 18 }, (_, i) => {
    const hour = 6 + i
    return `${String(hour).padStart(2, '0')}:00`
  })


  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

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

    updateCampo(index, 'horarios_disponiveis', next)
  }

  function selectAllHours(index) {
    updateCampo(index, 'horarios_disponiveis', availableHours)
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

  function updatePhoto(index, photoIndex, value) {
    const fotos = form.campos[index].fotos.map((foto, currentIndex) => (
      currentIndex === photoIndex ? value : foto
    ))

    updateCampo(index, 'fotos', fotos)
  }

  function addPhoto(index) {
    const fotos = form.campos[index].fotos

    if (fotos.length < 10) {
      updateCampo(index, 'fotos', [...fotos, ''])
    }
  }

  function removePhoto(index, photoIndex) {
    const fotos = form.campos[index].fotos.filter((_, currentIndex) => currentIndex !== photoIndex)
    updateCampo(index, 'fotos', fotos.length ? fotos : [''])
  }

  async function submit(event) {
    event.preventDefault()

    const payload = {
      ...form,
      quantidade_campos: Number(form.quantidade_campos || form.campos.length),
      campos: form.campos.map((campo, index) => {
        const fotos = cleanPhotos(campo.fotos)
        const [horario] = campo.horarios_funcionamento

        return {
          ...campo,
          nome: campo.nome.trim() || `Campo ${index + 1}`,
          preco_hora: Number(campo.preco_hora || 0),
          imagem_url: fotos[0] || '',
          fotos,
          horarios_funcionamento: horario?.dias?.length ? [horario] : [],
        }
      }),
    }

    const saved = await onSubmit(payload)

    if (saved !== false) {
      setForm(createInitialForm())
    }
  }

  return (
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
                  <small>Adicione ate 10 URLs de fotos; a primeira sera a imagem principal.</small>
                </div>
                <button className="secondary-action slim-action" type="button" onClick={() => addPhoto(index)} disabled={campo.fotos.length >= 10}>
                  <ImagePlus size={16} />
                  Foto
                </button>
              </div>

              <div className="photo-url-list">
                {campo.fotos.map((foto, photoIndex) => (
                  <label className="field photo-url-field" key={`campo-${index}-foto-${photoIndex}`}>
                    <span>Foto {photoIndex + 1}</span>
                    <input value={foto} onChange={(event) => updatePhoto(index, photoIndex, event.target.value)} placeholder="https://..." />
                    {campo.fotos.length > 1 && (
                      <button className="text-switch remove-inline" type="button" onClick={() => removePhoto(index, photoIndex)}>
                        Remover
                      </button>
                    )}
                  </label>
                ))}
              </div>
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

              
            </div>
            <div className="form-block">
              <div className="form-section-header compact">
                <div>
                  <strong>Horários Disponíveis</strong>
                  <small>Selecione os horários disponíveis por hora.</small>
                </div>
                <button className="secondary-action slim-action" type="button" onClick={() => selectAllHours(index)}>
                  Selecionar Todos
                </button>
              </div>

              <div className="available-times-grid">
                {availableHours.map((h) => (
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

      <button className="primary-action wide-field" type="submit" disabled={loading}>
        <Plus size={17} />
        {loading ? 'Salvando...' : form.campos.length > 1 ? `Cadastrar ${form.campos.length} campos` : 'Cadastrar quadra'}
      </button>
    </form>
  )
}
