import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Filter } from 'lucide-react'
import { getReservationFilterOption, reservationStatusFilterOptions } from './reservationStatusFilterState'

export function ReservationStatusFilter({ selectedFilter, onChange, counts }) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const activeFilter = getReservationFilterOption(selectedFilter)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function selectFilter(filterId) {
    onChange(filterId)
    setIsOpen(false)
  }

  return (
    <div className={isOpen ? 'reservation-filter is-open' : 'reservation-filter'} ref={rootRef}>
      <button
        className="reservation-filter-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Filter size={17} />
        <span>Filtros</span>
        <strong>{activeFilter.compactLabel}</strong>
        <ChevronDown className="reservation-filter-chevron" size={16} />
      </button>

      <span className="reservation-filter-current">
        Filtro ativo: <strong>{activeFilter.label}</strong>
      </span>

      {isOpen && (
        <div className="reservation-filter-menu" role="menu" aria-label="Filtros de status das reservas">
          {reservationStatusFilterOptions.map((option) => {
            const isActive = option.id === activeFilter.id

            return (
              <button
                className={isActive ? 'reservation-filter-option is-active' : 'reservation-filter-option'}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                key={option.id}
                onClick={() => selectFilter(option.id)}
              >
                <span className="reservation-filter-option-label">
                  {isActive && <Check size={15} />}
                  <span>{option.label}</span>
                </span>
                <strong>{counts[option.id] || 0}</strong>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
