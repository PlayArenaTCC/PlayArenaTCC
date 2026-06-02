import { fallbackCourtImage } from '../data/demoData'

const textCorrections = [
  [/\bCampo Mourao\b/g, 'Campo Mourão'],
  [/\bColegio\b/g, 'Colégio'],
  [/\bIluminacao\b/g, 'Iluminação'],
  [/\bVestiario\b/g, 'Vestiário'],
  [/\bvestiarios\b/g, 'vestiários'],
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

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDate(value) {
  if (!value) {
    return 'Data não informada'
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

export function shortTime(value) {
  return String(value || '').slice(0, 5)
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
    return 'Dias nao informados'
  }

  if (days.length === 7) {
    return 'Todos os dias'
  }

  return days.map((day) => dayLabels[day]).join(', ')
}

export function formatOperatingHours(value) {
  const ranges = normalizeOperatingHours(value)

  if (!ranges.length) {
    return 'Funcionamento nao informado'
  }

  return ranges
    .map((range) => `${formatDays(range.dias)} das ${range.hora_inicio} as ${range.hora_fim}`)
    .join('; ')
}

export function normalizeCourt(quadra) {
  const photos = normalizeList(quadra.fotos || quadra.imagens || [], { formatText: false })
  const imagemUrl = quadra.imagem_url || photos[0] || fallbackCourtImage

  return {
    ...quadra,
    nome: formatPortugueseText(quadra.nome),
    descricao: formatPortugueseText(quadra.descricao),
    endereco: formatPortugueseText(quadra.endereco),
    bairro: formatPortugueseText(quadra.bairro),
    cidade: formatPortugueseText(quadra.cidade),
    imagem_url: imagemUrl,
    fotos: photos.length ? photos : [imagemUrl],
    preco_hora: Number(quadra.preco_hora || quadra.precoHora || 0),
    horarios_disponiveis: quadra.horarios_disponiveis || quadra.horarios || [],
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
    return value || 'Nao informado'
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
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
