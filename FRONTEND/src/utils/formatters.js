<<<<<<< Updated upstream
=======
import { fallbackCourtImage } from '../data/demoData'

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

>>>>>>> Stashed changes
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
    return 'Data nao informada'
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

export function shortTime(value) {
  return String(value || '').slice(0, 5)
}

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
export function normalizeCourt(quadra) {
  return {
    ...quadra,
    imagem_url: quadra.imagem_url || fallbackCourtImage,
    preco_hora: Number(quadra.preco_hora || quadra.precoHora || 0),
<<<<<<< Updated upstream
    horarios_disponiveis: quadra.horarios_disponiveis || quadra.horarios || [],
=======
    preco_original: quadra.preco_original ? Number(quadra.preco_original) : null,
    horarios_disponiveis: normalizeSchedules(quadra.horarios_disponiveis || quadra.horarios || []),
    horarios_funcionamento: normalizeOperatingHours(quadra.horarios_funcionamento || quadra.funcionamento || []),
>>>>>>> Stashed changes
    rating: Number(quadra.rating || 4.8),
    total_reviews: Number(quadra.total_reviews || 12),
    amenities: quadra.amenities || ['Coberta', 'Iluminacao', 'Vestiario'],
  }
}

export function formatPlainCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}
import { fallbackCourtImage } from '../data/demoData'
