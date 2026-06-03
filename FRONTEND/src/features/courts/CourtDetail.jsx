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
import { fallbackCourtImage, sportLabels, weekDays } from '../../data/demoData'
import { formatCurrency, formatDate, formatOperatingHours, shortTime } from '../../utils/formatters'

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
  const horarios = (quadra.horarios_disponiveis || []).filter((horario) => horario.disponivel !== false)
  const operatingHoursLabel = buildAvailabilityLabel(horarios)
  const availableDayLabel = buildAvailableDayLabel(horarios)
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
        <img className="detail-image" src={quadra.imagem_url} alt={quadra.nome} onError={(event) => { event.currentTarget.src = fallbackCourtImage }} />
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
          <p>{quadra.descricao || 'Espaco esportivo de qualidade para voce aproveitar seu jogo.'}</p>
          <hr />
          <h2>Informacoes</h2>
          <div className="info-grid">
<<<<<<< Updated upstream
            <Metric icon={DollarSign} label="Preco" value={formatCurrency(quadra.preco_hora) + '/hora'} />
            <Metric icon={Clock} label="Horarios" value={`${shortTime(horarios[0]?.hora_inicio)} as ${shortTime(horarios[horarios.length - 1]?.hora_fim)}`} tone="blue" />
            <Metric icon={MapPin} label="Endereco" value={quadra.endereco} tone="purple" />
            <Metric icon={CalendarDays} label="Dias Disponiveis" value={`${new Set(horarios.map((item) => item.dia_semana)).size} dias/semana`} tone="yellow" />
=======
            <Metric icon={Wallet} label="Preço" value={formatCurrency(quadra.preco_hora) + '/hora'} />
            <Metric icon={Clock} label="Funcionamento" value={operatingHoursLabel} tone="blue" />
            <Metric icon={MapPin} label="Endereço" value={quadra.endereco} tone="purple" />
            <Metric icon={CalendarDays} label="Dias disponíveis" value={availableDayLabel} tone="yellow" />
>>>>>>> Stashed changes
          </div>
          {horarios.length > 0 && (
            <>
              <hr />
              <h2>Horarios disponiveis</h2>
              <div className="reservation-chip-list">
                {horarios.slice(0, 10).map((horario) => (
                  <span key={horario.id || `${horario.data || horario.dia_semana}-${horario.hora_inicio}-${horario.hora_fim}`}>
                    {formatSchedulePreview(horario)}
                  </span>
                ))}
                {horarios.length > 10 && <span>+{horarios.length - 10}</span>}
              </div>
            </>
          )}
          <hr />
          <h2>Comodidades</h2>
          <div className="amenities-grid">
            {(quadra.amenities || []).map((item) => (
              <span key={item}><Check size={18} /> {item}</span>
            ))}
          </div>
        </div>
        <aside className="price-panel">
          <div className={originalPrice ? 'price-stack is-promo' : 'price-stack'}>
            {originalPrice && <span className="promo-old-price">De {formatCurrency(originalPrice)}</span>}
            {originalPrice && <span className="promo-badge">Promoção</span>}
            <strong>{formatCurrency(quadra.preco_hora)}<small>/hora</small></strong>
          </div>
          <button className="primary-action" type="button" onClick={() => onReserve(quadra)}>
            Reservar Agora
          </button>
          <small>Voce nao sera cobrado ainda</small>
        </aside>
      </div>
      <div className="schedule-strip">
        {horarios.slice(0, 5).map((horario) => (
          <span key={`${horario.id}-${horario.hora_inicio}`}>
            {weekDays[horario.dia_semana] || 'Data fixa'} {shortTime(horario.hora_inicio)}
          </span>
        ))}
      </div>
      <button className="ghost-link align-left detail-mobile-back" type="button" onClick={onBack}>
        Voltar
      </button>
    </section>
  )
}
