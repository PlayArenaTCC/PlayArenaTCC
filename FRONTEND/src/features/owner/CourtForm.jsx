import { useRef, useState } from 'react'
import { FileText, ImagePlus, MapPin, Plus, ShieldCheck } from 'lucide-react'
import { sportOptions } from '../../data/demoData'
import { fetchAddressByCep, fetchGeocodedAddress } from '../../services/playarenaApi'
import { LocationPicker } from './LocationPicker'

const ownerTypeOptions = [
  { value: 'dono_local', label: 'DONO DO LOCAL' },
  { value: 'gerenciador', label: 'GERENCIADOR' },
]

const documentLabels = {
  documento_pessoal: 'Documento pessoal (RG ou CNH)',
  cpf: 'CPF ou CNPJ',
  comprovante_endereco: 'Comprovante de endereço',
  comprovante_posse: 'Documento de posse/propriedade do local',
  autorizacao_gerenciamento: 'Autorização do proprietário',
}

const requiredDocumentsByOwnerType = {
  dono_local: ['documento_pessoal', 'cpf', 'comprovante_endereco', 'comprovante_posse'],
  gerenciador: ['documento_pessoal', 'cpf', 'comprovante_endereco', 'autorizacao_gerenciamento'],
}

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
    documentacao: {
      tipo_proprietario: 'dono_local',
      documentos: {},
    },
    nome: '',
    modalidade: 'futsal',
    quantidade_campos: '1',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: 'Campo Mourao',
    estado: 'PR',
    latitude: null,
    longitude: null,
    localizacao_confirmada: false,
    precisao_localizacao: null,
    descricao: '',
    campos: [createCampo(0)],
  }
}

function formatCepInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

function buildAddressLine(source = {}) {
  return [source.endereco, source.numero]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
}

function normalizeLocationText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function buildLocationKey(source = {}) {
  return [
    source.cep ? normalizeLocationText(source.cep) : '',
    normalizeLocationText(buildAddressLine(source)),
    normalizeLocationText(source.bairro),
    normalizeLocationText(source.cidade || 'Campo Mourao'),
    normalizeLocationText(source.estado || 'PR'),
  ].filter(Boolean).join('|')
}

function findReusableDocumentation(documentacoes, form) {
  const key = buildLocationKey(form)

  if (!key || !normalizeLocationText(form.endereco)) {
    return null
  }

  return (documentacoes || []).find((documentacao) => (
    documentacao.status === 'aprovado' && documentacao.endereco_key === key
  )) || null
}

function mergePhotos(current, selectedFiles) {
  const files = Array.from(selectedFiles || [])
    .filter((file) => file.type.startsWith('image/'))

  return [...current, ...files].slice(0, 10)
}

function isDocumentFile(value) {
  return typeof File !== 'undefined' && value instanceof File
}

function getDocumentFileSignature(file) {
  if (!isDocumentFile(file)) {
    return ''
  }

  return [file.name, file.size, file.type, file.lastModified].join('|')
}

function findDuplicateDocument(documents, keys) {
  const seen = new Map()

  for (const key of keys) {
    const file = documents[key]
    const signature = getDocumentFileSignature(file)

    if (!signature) {
      continue
    }

    if (seen.has(signature)) {
      return {
        firstKey: seen.get(signature),
        currentKey: key,
        fileName: file.name,
      }
    }

    seen.set(signature, key)
  }

  return null
}

function getDuplicateDocumentMessage(duplicate) {
  const firstLabel = documentLabels[duplicate.firstKey] || duplicate.firstKey
  const currentLabel = documentLabels[duplicate.currentKey] || duplicate.currentKey

  return `O arquivo "${duplicate.fileName}" já foi selecionado em "${firstLabel}". Envie um documento diferente para "${currentLabel}".`
}

export function CourtForm({ documentacoes = [], onSubmit, loading, token }) {
  const [form, setForm] = useState(createInitialForm)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingSubmit, setConfirmingSubmit] = useState(false)
  const [documentationError, setDocumentationError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const cepRequestIdRef = useRef(0)
  const geocodeRequestIdRef = useRef(0)
  const reusableDocumentation = findReusableDocumentation(documentacoes, form)
  const requiredDocumentKeys = requiredDocumentsByOwnerType[form.documentacao.tipo_proprietario] || []
  const hasCoordinates = Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude))

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function lookupCep(cep) {
    const digits = String(cep || '').replace(/\D/g, '')

    if (digits.length !== 8) {
      setLocationError('Informe um CEP válido com 8 dígitos.')
      return false
    }

    const requestId = cepRequestIdRef.current + 1
    cepRequestIdRef.current = requestId
    setCepLoading(true)
    setLocationError('')

    try {
      const localizacao = await fetchAddressByCep(token, digits)

      if (cepRequestIdRef.current !== requestId) {
        return false
      }

      setForm((current) => ({
        ...current,
        cep: localizacao.cep || formatCepInput(digits),
        endereco: localizacao.endereco || '',
        bairro: localizacao.bairro || '',
        cidade: localizacao.cidade || '',
        estado: localizacao.estado || '',
        numero: '',
        latitude: null,
        longitude: null,
        localizacao_confirmada: false,
        precisao_localizacao: null,
      }))
      setLocationError(
        localizacao.endereco
          ? ''
          : 'Este CEP não possui logradouro automático. Informe o endereço antes do número.',
      )
      return true
    } catch (error) {
      if (cepRequestIdRef.current === requestId) {
        setLocationError(error.message)
      }
      return false
    } finally {
      if (cepRequestIdRef.current === requestId) {
        setCepLoading(false)
      }
    }
  }

  function updateCep(value) {
    const cep = formatCepInput(value)
    const digits = cep.replace(/\D/g, '')

    cepRequestIdRef.current += 1
    geocodeRequestIdRef.current += 1
    setCepLoading(false)
    setGeocoding(false)
    setLocationError('')
    setForm((current) => ({
      ...current,
      cep,
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      latitude: null,
      longitude: null,
      localizacao_confirmada: false,
      precisao_localizacao: null,
    }))

    if (digits.length === 8) {
      lookupCep(cep)
    }
  }

  function updateLocationField(field, value) {
    geocodeRequestIdRef.current += 1
    setGeocoding(false)
    setLocationError('')
    setForm((current) => ({
      ...current,
      [field]: value,
      latitude: null,
      longitude: null,
      localizacao_confirmada: false,
      precisao_localizacao: null,
    }))
  }

  async function locateAddress() {
    if (!form.cep || !form.endereco || !form.numero || !form.cidade || !form.estado) {
      setLocationError('Informe um CEP válido e o número do local para posicionar o espaço no mapa.')
      return false
    }

    setGeocoding(true)
    setLocationError('')
    const requestId = geocodeRequestIdRef.current + 1
    geocodeRequestIdRef.current = requestId

    try {
      const localizacao = await fetchGeocodedAddress(token, form)

      if (geocodeRequestIdRef.current !== requestId) {
        return false
      }

      setForm((current) => ({
        ...current,
        ...localizacao,
        localizacao_confirmada: localizacao.precisao === 'exata',
        precisao_localizacao: localizacao.precisao,
      }))
      return localizacao
    } catch (error) {
      if (geocodeRequestIdRef.current === requestId) {
        setLocationError(error.message)
      }
      return false
    } finally {
      if (geocodeRequestIdRef.current === requestId) {
        setGeocoding(false)
      }
    }
  }

  function updateMarkerPosition({ latitude, longitude }) {
    setLocationError('')
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      localizacao_confirmada: false,
      precisao_localizacao: 'ajustada',
    }))
  }

  function confirmMarkerPosition() {
    if (!hasCoordinates) {
      return
    }

    setLocationError('')
    setForm((current) => ({
      ...current,
      localizacao_confirmada: true,
    }))
  }

  function updateDocumentation(field, value) {
    setDocumentationError('')
    setForm((current) => ({
      ...current,
      documentacao: {
        ...current.documentacao,
        [field]: value,
        documentos: field === 'tipo_proprietario' ? {} : current.documentacao.documentos,
      },
    }))
  }

  function updateDocumentFile(key, file) {
    const nextDocuments = { ...(form.documentacao.documentos || {}) }

    if (file) {
      nextDocuments[key] = file
    } else {
      delete nextDocuments[key]
    }

    const duplicate = findDuplicateDocument(nextDocuments, requiredDocumentKeys)

    if (duplicate) {
      delete nextDocuments[key]
      setDocumentationError(getDuplicateDocumentMessage(duplicate))
      setForm((current) => ({
        ...current,
        documentacao: {
          ...current.documentacao,
          documentos: nextDocuments,
        },
      }))
      return false
    }

    setDocumentationError('')
    setForm((current) => ({
      ...current,
      documentacao: {
        ...current.documentacao,
        documentos: nextDocuments,
      },
    }))
    return true
  }

  function validateDocumentation() {
    if (reusableDocumentation) {
      return true
    }

    const missingDocuments = requiredDocumentKeys.filter((key) => !form.documentacao.documentos[key])

    if (missingDocuments.length) {
      setDocumentationError('Envie todos os documentos obrigatórios antes de cadastrar o espaço.')
      return false
    }

    const duplicate = findDuplicateDocument(form.documentacao.documentos || {}, requiredDocumentKeys)

    if (duplicate) {
      setDocumentationError(getDuplicateDocumentMessage(duplicate))
      return false
    }

    return true
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

  async function submit(event) {
    event.preventDefault()

    if (loading || submitting || cepLoading || geocoding) {
      return
    }

    if (!hasCoordinates) {
      const located = await locateAddress()

      if (!located) {
        return
      }

      if (located.precisao !== 'exata') {
        setLocationError('A localização foi aproximada. Ajuste o marcador no mapa e confirme a posição exata.')
        return
      }
    } else if (!form.localizacao_confirmada) {
      setLocationError('Confirme a posição exata do marcador no mapa antes de continuar.')
      return
    }

    if (!validateDocumentation()) {
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
      documentacao: reusableDocumentation
        ? {
          tipo_proprietario: reusableDocumentation.tipo_proprietario,
          documentos: {},
        }
        : form.documentacao,
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
        setLocationError('')
        setDocumentationError('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="management-form court-registration-form" onSubmit={submit}>
      <section className="form-section wide-field document-step-card">
        <div className="form-section-header">
          <div>
            <strong>1. Validação documental</strong>
            <small>Obrigatória antes da liberação do espaço esportivo</small>
          </div>
          <ShieldCheck size={20} />
        </div>

        <div className="document-warning">
          Sua documenta&ccedil;&atilde;o ser&aacute; analisada pela equipe administrativa antes da libera&ccedil;&atilde;o do espa&ccedil;o esportivo.
        </div>

        {reusableDocumentation && (
          <div className="document-reuse-box">
            Documentação aprovada encontrada para este endereço. Ela será reutilizada automaticamente neste cadastro.
          </div>
        )}

        <label className="field wide-field">
          <span>Tipo de proprietário *</span>
          <select
            required
            value={form.documentacao.tipo_proprietario}
            onChange={(event) => updateDocumentation('tipo_proprietario', event.target.value)}
            disabled={Boolean(reusableDocumentation)}
          >
            {ownerTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="document-upload-grid">
          {requiredDocumentKeys.map((key) => {
            const selectedFile = form.documentacao.documentos[key]

            return (
              <label className={selectedFile ? 'document-upload-field is-filled' : 'document-upload-field'} key={key}>
                <span>
                  <FileText size={15} />
                  {documentLabels[key]}
                </span>
                <input
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  disabled={Boolean(reusableDocumentation)}
                  name={key}
                  type="file"
                  onChange={(event) => {
                    const accepted = updateDocumentFile(key, event.target.files?.[0] || null)

                    if (!accepted) {
                      event.target.value = ''
                    }
                  }}
                />
                <small>{selectedFile?.name || (reusableDocumentation ? 'Documento já aprovado' : 'PDF, PNG, JPG ou WebP')}</small>
              </label>
            )
          })}
        </div>

        {documentationError && <div className="form-error-box">{documentationError}</div>}
      </section>

      <section className="form-section wide-field">
        <div className="form-section-header">
          <div>
            <strong>2. Informações Básicas</strong>
            <small>Dados principais do espaço esportivo</small>
          </div>
        </div>

        <label className="field">
          <span>Nome do espaço *</span>
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
          <span>Quantos campos existem no espaço*</span>
          <input required type="number" min="1" max="12" value={form.quantidade_campos} onChange={(event) => updateQuantidade(event.target.value)} />
          <small className="field-help">Ao informar 3, por exemplo, o cadastro cria Campo 1, Campo 2 e Campo 3 com dados proprios.</small>
        </label>

        <label className="field wide-field">
          <span>Descrição</span>
          <textarea value={form.descricao} onChange={(event) => update('descricao', event.target.value)} placeholder="Descreva estrutura, facilidades e diferenciais do espaço." />
        </label>
      </section>

      <section className="form-section wide-field">
        <div className="form-section-header">
          <div>
            <strong>3. Localização</strong>
            <small>Digite o CEP para preencher o endereço automaticamente e depois informe apenas o número.</small>
          </div>
        </div>

        <label className="field">
          <span>CEP *</span>
          <input
            required
            inputMode="numeric"
            maxLength="9"
            value={form.cep}
            onBlur={() => {
              if (form.cep.replace(/\D/g, '').length === 8 && !form.endereco) {
                lookupCep(form.cep)
              }
            }}
            onChange={(event) => updateCep(event.target.value)}
            placeholder="00000-000"
          />
          <small className="field-help">{cepLoading ? 'Buscando CEP...' : 'Rua, bairro, cidade e UF serão preenchidos automaticamente.'}</small>
        </label>

        <label className="field">
          <span>Numero do local *</span>
          <input
            required
            value={form.numero}
            onBlur={locateAddress}
            onChange={(event) => updateLocationField('numero', event.target.value)}
            placeholder="Ex.: 2020"
          />
          <small className="field-help">Usado para posicionar o marcador no ponto correto do mapa.</small>
        </label>

        <label className="field wide-field">
          <span>Logradouro *</span>
          <input required value={form.endereco} onChange={(event) => updateLocationField('endereco', event.target.value)} placeholder="Preenchido automaticamente pelo CEP" />
        </label>

        <label className="field">
          <span>Bairro</span>
          <input value={form.bairro} onChange={(event) => updateLocationField('bairro', event.target.value)} placeholder="Preenchido automaticamente pelo CEP" />
        </label>

        <label className="field">
          <span>Cidade</span>
          <input required value={form.cidade} onChange={(event) => updateLocationField('cidade', event.target.value)} placeholder="Preenchida automaticamente pelo CEP" />
        </label>

        <label className="field">
          <span>UF</span>
          <input required maxLength="2" value={form.estado} onChange={(event) => updateLocationField('estado', event.target.value.toUpperCase())} placeholder="UF" />
        </label>

        {geocoding && (
          <div className="location-progress-box">
            <MapPin size={17} />
            Localizando o CEP e número no mapa...
          </div>
        )}

        {!geocoding && hasCoordinates && (
          <div className="location-picker-field">
            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={updateMarkerPosition}
            />
            <small>Arraste o marcador caso ele não esteja exatamente na entrada do local.</small>
          </div>
        )}

        {!geocoding && hasCoordinates && form.localizacao_confirmada && (
          <div className="location-success-box">
            <MapPin size={17} />
            Posição exata confirmada. Esta será a localização exibida aos usuários.
          </div>
        )}

        {!geocoding && hasCoordinates && !form.localizacao_confirmada && (
          <div className="location-confirmation-box">
            <span>
              <MapPin size={17} />
              Confira a bolinha no mapa e confirme a posição exata do local.
            </span>
            <button className="secondary-action slim-action" type="button" onClick={confirmMarkerPosition}>
              Confirmar posição
            </button>
          </div>
        )}

        {locationError && <div className="form-error-box">{locationError}</div>}
      </section>

      {form.campos.map((campo, index) => {
        const [horario] = campo.horarios_funcionamento

        return (
          <section className="subcourt-card wide-field" key={`campo-${index}`}>
            <div className="form-section-header">
              <div>
                <strong>Campo {index + 1}</strong>
                <small>Fotos, preço, funcionamento e comodidades deste campo</small>
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
                  <small>Envie até 10 fotos do seu computador; a primeira será a imagem principal.</small>
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
                  <strong>Horários de Funcionamento</strong>
                  <small>Defina os dias e a faixa de horário em que este campo abre.</small>
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

      <button className="primary-action wide-field" type="submit" disabled={loading || submitting || cepLoading || geocoding}>
        <Plus size={17} />
        {geocoding ? 'Localizando endereço...' : loading || submitting ? 'Salvando...' : form.campos.length > 1 ? `Cadastrar ${form.campos.length} campos` : 'Cadastrar quadra'}
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
