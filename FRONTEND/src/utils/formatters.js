import { fallbackCourtImage } from '../data/demoData'
import { formatAppCurrency } from './appSettings'

const textCorrections = [
  [/\bCampo Mourao\b/g, 'Campo Mourão'],
  [/\bColegio\b/g, 'Colégio'],
  [/\bIluminacao\b/g, 'Iluminação'],
  [/\bVestiario\b/g, 'Vestiário'],
  [/\bvestiarios\b/g, 'vestiários'],
  [/\bSeguranca\b/g, 'Segurança'],
  [/\bsintetica\b/g, 'sintética'],
  [/\bEspaco\b/g, 'Espaço'],
  [/\bespaco\b/g, 'espaço'],
  [/\bvoce\b/g, 'você'],
  [/\bVoce\b/g, 'Você'],
  [/\bnao\b/g, 'não'],
  [/\bNao\b/g, 'Não'],
]

export function formatPortugueseText(value) {
  if (typeof value !== 'string') {
    return value
  }

  return textCorrections.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export function todayISO(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function isPastISODate(value, referenceDate = todayISO()) {
  const date = String(value || '').trim()
  const today = String(referenceDate || '').trim()

  return isoDatePattern.test(date) && isoDatePattern.test(today) && date < today
}

export function formatCurrency(value) {
  return formatAppCurrency(value)
}

export function formatDate(value) {
  if (!value) {
    return 'Data não informada'
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

export function formatCourtAddress(quadra = {}, fallback = '') {
  const addressLine = [quadra.endereco, quadra.numero]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ')
  const cityState = [quadra.cidade, quadra.estado]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('/')
  const parts = [addressLine, quadra.bairro, cityState]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  return parts.length ? parts.join(' - ') : fallback
}

export function shortTime(value) {
  return String(value || '').slice(0, 5)
}

const reservationStatusPriority = {
  confirmada: 0,
  concluida: 1,
  cancelada: 3,
}

function getReservationStatusPriority(status) {
  return reservationStatusPriority[status] ?? 2
}

function reservationTimestamp(reserva) {
  if (!reserva.data_reserva) {
    return Number.MAX_SAFE_INTEGER
  }

  const time = shortTime(reserva.hora_inicio) || '00:00'
  const timestamp = new Date(`${reserva.data_reserva}T${time}:00`).getTime()

  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER
}

export function sortReservations(reservas = []) {
  const list = Array.isArray(reservas) ? reservas : []

  return [...list].sort((a, b) => {
    const statusDiff = getReservationStatusPriority(a.status) - getReservationStatusPriority(b.status)

    if (statusDiff) {
      return statusDiff
    }

    const dateDiff = reservationTimestamp(a) - reservationTimestamp(b)

    if (dateDiff) {
      return dateDiff
    }

    const aCreatedAt = a.createdAt || a.created_at || ''
    const bCreatedAt = b.createdAt || b.created_at || ''

    return String(bCreatedAt).localeCompare(String(aCreatedAt)) || String(a.id || '').localeCompare(String(b.id || ''))
  })
}

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function normalizeList(value, { formatText = true } = {}) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return source
    .map((item) => {
      const text = String(item || '').trim()
      return formatText ? formatPortugueseText(text) : text
    })
    .filter(Boolean)
    .filter((item, index, list) => (
      list.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index
    ))
}

function normalizeDay(value) {
  const day = Number(value)
  return Number.isInteger(day) && day >= 0 && day <= 6 ? day : null
}

export function normalizeOperatingHours(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const rawDays = Array.isArray(item.dias)
        ? item.dias
        : Array.isArray(item.dias_semana)
          ? item.dias_semana
          : [item.dia_semana ?? item.dia]
      const dias = [...new Set(rawDays.map(normalizeDay))]
        .filter((day) => day !== null)
        .sort((a, b) => a - b)

      if (!dias.length || !item.hora_inicio || !item.hora_fim) {
        return null
      }

      return {
        dias,
        hora_inicio: shortTime(item.hora_inicio),
        hora_fim: shortTime(item.hora_fim),
      }
    })
    .filter(Boolean)
}

function formatDays(days) {
  if (!days.length) {
    return 'Dias não informados'
  }

  if (days.length === 7) {
    return 'Todos os dias'
  }

  return days.map((day) => dayLabels[day]).join(', ')
}

export function formatOperatingHours(value) {
  const ranges = normalizeOperatingHours(value)

  if (!ranges.length) {
    return 'Funcionamento não informado'
  }

  const compactRanges = ranges.reduce((acc, range) => {
    const key = `${range.hora_inicio}-${range.hora_fim}`
    const existing = acc.find((item) => item.key === key)

    if (existing) {
      existing.dias = [...new Set([...existing.dias, ...range.dias])].sort((a, b) => a - b)
      return acc
    }

    return [...acc, { ...range, key }]
  }, [])

  return compactRanges
    .map((range) => `${formatDays(range.dias)} das ${range.hora_inicio} as ${range.hora_fim}`)
    .join('; ')
}

function normalizeSchedules(value) {
  const schedules = Array.isArray(value) ? value : []

  return schedules.map((schedule) => {
    const normalized = {
      ...schedule,
      valor: schedule.valor === undefined || schedule.valor === null ? schedule.valor : Number(schedule.valor),
    }

    if (Object.prototype.hasOwnProperty.call(schedule, 'valor_especial')) {
      normalized.valor_especial = Boolean(schedule.valor_especial)
    }

    return normalized
  })
}

export function normalizeCourt(quadra) {
  const photos = normalizeList(quadra.fotos || quadra.imagens || [], { formatText: false })
  const imagemUrl = quadra.imagem_url || photos[0] || fallbackCourtImage
  const modalidades = normalizeList(quadra.modalidades || [quadra.modalidade], { formatText: false })

  return {
    ...quadra,
    nome: formatPortugueseText(quadra.nome),
    descricao: formatPortugueseText(quadra.descricao),
    endereco: formatPortugueseText(quadra.endereco),
    bairro: formatPortugueseText(quadra.bairro),
    cidade: formatPortugueseText(quadra.cidade),
    numero: String(quadra.numero || '').trim() || null,
    cep: String(quadra.cep || '').trim() || null,
    latitude: quadra.latitude === undefined || quadra.latitude === null ? null : Number(quadra.latitude),
    longitude: quadra.longitude === undefined || quadra.longitude === null ? null : Number(quadra.longitude),
    localizacao_confirmada: Boolean(quadra.localizacao_confirmada),
    imagem_url: imagemUrl,
    fotos: photos.length ? photos : [imagemUrl],
    modalidade: quadra.modalidade || modalidades[0] || 'poliesportiva',
    modalidades: modalidades.length ? modalidades : [quadra.modalidade || 'poliesportiva'],
    tipo_espaco: String(quadra.tipo_espaco || 'Quadra').trim() || 'Quadra',
    ativa_base: Object.prototype.hasOwnProperty.call(quadra, 'ativa_base') ? Boolean(quadra.ativa_base) : quadra.ativa !== false,
    temporariamente_inativa: Boolean(quadra.temporariamente_inativa),
    desativacao_agendada: Boolean(quadra.desativacao_agendada),
    preco_hora: Number(quadra.preco_hora || quadra.precoHora || 0),
    preco_original: quadra.preco_original ? Number(quadra.preco_original) : null,
    horarios_disponiveis: normalizeSchedules(quadra.horarios_disponiveis || quadra.horarios || []),
    horarios_funcionamento: normalizeOperatingHours(quadra.horarios_funcionamento || quadra.funcionamento || []),
    rating: Number(quadra.rating || 4.8),
    total_reviews: Number(quadra.total_reviews || 12),
    amenities: normalizeList(quadra.amenities || quadra.comodidades || []),
  }
}

export function formatPlainCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatCpf(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11)

  if (digits.length !== 11) {
    return value || 'Não informado'
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCpfCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14)

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  return value || 'Não informado'
}

export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)} ${digits.slice(2)}`
}

export function isValidPhone(value) {
  return /^\d{2} \d{8,9}$/.test(String(value || ''))
}
