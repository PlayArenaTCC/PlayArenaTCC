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

export function normalizeCourt(quadra) {
  return {
    ...quadra,
    nome: formatPortugueseText(quadra.nome),
    descricao: formatPortugueseText(quadra.descricao),
    endereco: formatPortugueseText(quadra.endereco),
    bairro: formatPortugueseText(quadra.bairro),
    cidade: formatPortugueseText(quadra.cidade),
    imagem_url: quadra.imagem_url || fallbackCourtImage,
    preco_hora: Number(quadra.preco_hora || quadra.precoHora || 0),
    horarios_disponiveis: quadra.horarios_disponiveis || quadra.horarios || [],
    rating: Number(quadra.rating || 4.8),
    total_reviews: Number(quadra.total_reviews || 12),
    amenities: (quadra.amenities || ['Coberta', 'Iluminação', 'Vestiário']).map(formatPortugueseText),
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
