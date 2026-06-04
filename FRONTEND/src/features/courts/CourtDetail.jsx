<<<<<<< Updated upstream
import { ArrowLeft, CalendarDays, Check, Clock, DollarSign, MapPin } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { defaultHorarios, fallbackCourtImage, sportLabels, weekDays } from '../../data/demoData'
import { formatCurrency, shortTime } from '../../utils/formatters'

export function CourtDetail({ quadra, onBack, onReserve }) {
  const horarios = quadra.horarios_disponiveis?.length ? quadra.horarios_disponiveis : defaultHorarios
=======
import { ArrowLeft, CalendarDays, Clock, MapPin, Wallet } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { PhotoCarousel } from '../../components/PhotoCarousel'
import { sportLabels, weekDays } from '../../data/demoData'
import { formatCourtAddress, formatCurrency, formatDate, formatOperatingHours, shortTime } from '../../utils/formatters'

function getOriginalPrice(quadra) {
  const original = Number(quadra.preco_original || 0)
  const current = Number(quadra.preco_hora || 0)
  return original > current ? original : null
}

function buildOperatingHoursFromSchedules(horarios) {
  const byDay = (horarios || [])
    .filter((horario) => horario.disponivel !== false && horario.dia_semana !== null && horario.dia_semana !== undefined)
    .reduce((groups, horario) => {
      const day = Number(horario.dia_semana)
      return {
        ...groups,
        [day]: [...(groups[day] || []), horario],
      }
    }, {})

  return Object.entries(byDay).flatMap(([day, schedules]) => {
    const sorted = schedules.slice().sort((a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio)))
    const ranges = []

    sorted.forEach((schedule) => {
      const last = ranges[ranges.length - 1]

      if (last && shortTime(last.hora_fim) === shortTime(schedule.hora_inicio)) {
        last.hora_fim = shortTime(schedule.hora_fim)
        return
      }

      ranges.push({
        dias: [Number(day)],
        hora_inicio: shortTime(schedule.hora_inicio),
        hora_fim: shortTime(schedule.hora_fim),
      })
    })

    return ranges
  })
}

function formatSchedulePreview(horario) {
  const label = horario.data ? formatDate(horario.data) : weekDays[horario.dia_semana] || 'Data especifica'
  return `${label} ${shortTime(horario.hora_inicio)} - ${shortTime(horario.hora_fim)}`
}

function buildAvailabilityLabel(horarios) {
  const recurringLabel = formatOperatingHours(buildOperatingHoursFromSchedules(horarios))
  const hasRecurringHours = recurringLabel !== 'Funcionamento nao informado'
  const dateSchedules = (horarios || [])
    .filter((horario) => horario.data)
    .slice()
    .sort((a, b) => String(a.data).localeCompare(String(b.data)) || String(a.hora_inicio).localeCompare(String(b.hora_inicio)))
  const dateLabel = dateSchedules.slice(0, 2).map(formatSchedulePreview).join('; ')
  const extraDates = dateSchedules.length > 2 ? ` +${dateSchedules.length - 2} datas` : ''
  const parts = [
    hasRecurringHours ? recurringLabel : '',
    dateLabel ? `${dateLabel}${extraDates}` : '',
  ].filter(Boolean)

  return parts.length ? parts.join('; ') : 'Sem horarios cadastrados'
}

function buildAvailableDayLabel(horarios) {
  const recurringDays = new Set((horarios || [])
    .filter((horario) => !horario.data && horario.dia_semana !== null && horario.dia_semana !== undefined)
    .map((horario) => Number(horario.dia_semana)))
  const specificDates = new Set((horarios || [])
    .filter((horario) => horario.data)
    .map((horario) => horario.data))
  const parts = []

  if (recurringDays.size) {
    parts.push(`${recurringDays.size} dias/semana`)
  }

  if (specificDates.size) {
    parts.push(`${specificDates.size} ${specificDates.size === 1 ? 'data' : 'datas'}`)
  }

  return parts.length ? parts.join(' + ') : '0 dias'
}

export function CourtDetail({ quadra, onBack, onReserve }) {
  const originalPrice = getOriginalPrice(quadra)
  const isInactive = quadra.ativa === false
  const horarios = (quadra.horarios_disponiveis || []).filter((horario) => horario.disponivel !== false)
  const operatingHoursLabel = buildAvailabilityLabel(horarios)
  const availableDayLabel = buildAvailableDayLabel(horarios)
  
  // Construir lista de fotos: imagem principal + fotos adicionais
  const photoList = []
  if (quadra.imagem_url) {
    photoList.push(quadra.imagem_url)
  }
  if (Array.isArray(quadra.fotos) && quadra.fotos.length > 0) {
    quadra.fotos.forEach(foto => {
      if (foto && foto !== quadra.imagem_url && !photoList.includes(foto)) {
        photoList.push(foto)
      }
    })
  }
>>>>>>> Stashed changes

  return (
    <section className="detail-page">
      <div className="detail-topbar">
        <button className="ghost-link align-left" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>
      <div className="detail-main">
        <PhotoCarousel photos={photoList} alt={quadra.nome} />
      </div>
      <div className="detail-grid">
        <div className="detail-content">
          <div className="detail-heading">
            <div>
              <h1>{quadra.nome}</h1>
              <div className="detail-meta">
                <span><MapPin size={16} /> {quadra.cidade}, {quadra.estado}</span>
              </div>
            </div>
            <span className="sport-badge inline-badge">{sportLabels[quadra.modalidade] || quadra.modalidade}</span>
          </div>
          {isInactive && (
            <div className="court-inactive-notice">
              Este espaço está inativo no momento e não pode receber novas reservas.
            </div>
          )}
          <p>{quadra.descricao || 'Espaço esportivo de qualidade para você aproveitar seu jogo.'}</p>
          <hr />
          <h2>Informações</h2>
          <div className="info-grid">
<<<<<<< Updated upstream
            <Metric icon={DollarSign} label="Preco" value={formatCurrency(quadra.preco_hora) + '/hora'} />
            <Metric icon={Clock} label="Horarios" value={`${shortTime(horarios[0]?.hora_inicio)} as ${shortTime(horarios[horarios.length - 1]?.hora_fim)}`} tone="blue" />
            <Metric icon={MapPin} label="Endereco" value={quadra.endereco} tone="purple" />
            <Metric icon={CalendarDays} label="Dias Disponiveis" value={`${new Set(horarios.map((item) => item.dia_semana)).size} dias/semana`} tone="yellow" />
=======
            <Metric icon={Wallet} label="Preço" value={formatCurrency(quadra.preco_hora) + '/hora'} />
            <Metric icon={Clock} label="Funcionamento" value={operatingHoursLabel} tone="blue" />
            <Metric icon={MapPin} label="Endereço" value={formatCourtAddress(quadra, 'Localidade nao informada')} tone="purple" />
            <Metric icon={CalendarDays} label="Dias disponíveis" value={availableDayLabel} tone="yellow" />
>>>>>>> Stashed changes
          </div>
          <hr />
          <h2>Comodidades</h2>
          <div className="amenities-grid">
            {(quadra.amenities || []).length > 0
              ? (quadra.amenities || []).map((item) => (
                <span key={item}><i className="amenity-dot" aria-hidden="true" /> {item}</span>
              ))
              : <span>Nenhuma comodidade cadastrada.</span>}
          </div>
        </div>
        <aside className="price-panel">
<<<<<<< Updated upstream
          <strong>{formatCurrency(quadra.preco_hora)}<small>/hora</small></strong>
          <button className="primary-action" type="button" onClick={() => onReserve(quadra)}>
            Reservar Agora
=======
          <div className={originalPrice ? 'price-stack is-promo' : 'price-stack'}>
            {originalPrice && <span className="promo-old-price">De {formatCurrency(originalPrice)}</span>}
            {originalPrice && <span className="promo-badge">Promoção</span>}
            <strong>{formatCurrency(quadra.preco_hora)}<small>/hora</small></strong>
          </div>
          <button className="primary-action" type="button" onClick={() => onReserve(quadra)} disabled={isInactive}>
            {isInactive ? 'Espaço Inativo' : 'Reservar Agora'}
>>>>>>> Stashed changes
          </button>
          <small>{isInactive ? 'Novas reservas estão temporariamente bloqueadas' : 'Você não será cobrado ainda'}</small>
        </aside>
      </div>
      <button className="ghost-link align-left detail-mobile-back" type="button" onClick={onBack}>
        Voltar
      </button>
    </section>
  )
}
