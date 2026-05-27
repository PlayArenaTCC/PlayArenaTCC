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

export function normalizeCourt(quadra) {
  return {
    ...quadra,
    imagem_url: quadra.imagem_url || fallbackCourtImage,
    preco_hora: Number(quadra.preco_hora || quadra.precoHora || 0),
    horarios_disponiveis: quadra.horarios_disponiveis || quadra.horarios || [],
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
