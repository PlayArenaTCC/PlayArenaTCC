import { useEffect, useMemo, useState } from 'react'
import { sortReservations } from '../../utils/formatters'

const DEFAULT_STORAGE_KEY = 'playarena:reservations-status-filter'

export const reservationStatusFilterOptions = [
  { id: 'all', label: 'Todas as reservas', compactLabel: 'Todas', status: null },
  { id: 'confirmada', label: 'Apenas Confirmadas', compactLabel: 'Confirmadas', status: 'confirmada' },
  { id: 'concluida', label: 'Apenas Concluídas', compactLabel: 'Concluídas', status: 'concluida' },
  { id: 'cancelada', label: 'Apenas Canceladas', compactLabel: 'Canceladas', status: 'cancelada' },
]

const filterIds = new Set(reservationStatusFilterOptions.map((option) => option.id))

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeFilterId(value) {
  return filterIds.has(value) ? value : 'all'
}

export function getReservationFilterOption(filterId) {
  const normalizedFilterId = normalizeFilterId(filterId)
  return reservationStatusFilterOptions.find((option) => option.id === normalizedFilterId) || reservationStatusFilterOptions[0]
}

function readSavedFilter(storageKey) {
  try {
    if (typeof localStorage === 'undefined') {
      return 'all'
    }

    return normalizeFilterId(localStorage.getItem(storageKey))
  } catch {
    return 'all'
  }
}

function saveFilter(storageKey, filterId) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, normalizeFilterId(filterId))
    }
  } catch {
    void 0
  }
}

function countReservations(reservas = []) {
  const list = Array.isArray(reservas) ? reservas : []
  const counts = {
    all: 0,
    confirmada: 0,
    concluida: 0,
    cancelada: 0,
  }

  list.forEach((reserva) => {
    const status = normalizeStatus(reserva.status)
    counts.all += 1

    if (Object.prototype.hasOwnProperty.call(counts, status)) {
      counts[status] += 1
    }
  })

  return counts
}

export function useReservationStatusFilter(reservas, storageKey = DEFAULT_STORAGE_KEY, { enabled = true } = {}) {
  const [selectedFilter, setSelectedFilter] = useState(() => (
    enabled ? readSavedFilter(storageKey) : 'all'
  ))
  const activeFilterId = enabled ? normalizeFilterId(selectedFilter) : 'all'

  useEffect(() => {
    if (enabled) {
      saveFilter(storageKey, activeFilterId)
    }
  }, [activeFilterId, enabled, storageKey])

  const counts = useMemo(() => countReservations(reservas), [reservas])

  const filteredReservas = useMemo(() => {
    const orderedReservas = sortReservations(reservas)
    const activeFilter = getReservationFilterOption(activeFilterId)

    if (!enabled || !activeFilter.status) {
      return orderedReservas
    }

    return orderedReservas.filter((reserva) => normalizeStatus(reserva.status) === activeFilter.status)
  }, [activeFilterId, enabled, reservas])

  return {
    activeFilter: getReservationFilterOption(activeFilterId),
    counts,
    filteredReservas,
    selectedFilter: activeFilterId,
    setSelectedFilter: (filterId) => setSelectedFilter(normalizeFilterId(filterId)),
  }
}
