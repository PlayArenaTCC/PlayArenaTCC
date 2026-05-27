import { ArrowLeft, CalendarDays, Check, Clock, DollarSign, MapPin, Star } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { defaultHorarios, fallbackCourtImage, sportLabels, weekDays } from '../../data/demoData'
import { formatCurrency, shortTime } from '../../utils/formatters'

export function CourtDetail({ quadra, onBack, onReserve }) {
  const horarios = quadra.horarios_disponiveis?.length ? quadra.horarios_disponiveis : defaultHorarios

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
                <span><Star size={16} /> {quadra.rating.toFixed(1)} ({quadra.total_reviews} avaliações)</span>
              </div>
            </div>
            <span className="sport-badge inline-badge">{sportLabels[quadra.modalidade] || quadra.modalidade}</span>
          </div>
          <p>{quadra.descricao || 'Espaço esportivo de qualidade para você aproveitar seu jogo.'}</p>
          <hr />
          <h2>Informações</h2>
          <div className="info-grid">
            <Metric icon={DollarSign} label="Preço" value={formatCurrency(quadra.preco_hora) + '/hora'} />
            <Metric icon={Clock} label="Horários" value={`${shortTime(horarios[0]?.hora_inicio)} às ${shortTime(horarios[horarios.length - 1]?.hora_fim)}`} tone="blue" />
            <Metric icon={MapPin} label="Endereço" value={quadra.endereco} tone="purple" />
            <Metric icon={CalendarDays} label="Dias Disponíveis" value={`${new Set(horarios.map((item) => item.dia_semana)).size} dias/semana`} tone="yellow" />
          </div>
          <hr />
          <h2>Comodidades</h2>
          <div className="amenities-grid">
            {(quadra.amenities || []).map((item) => (
              <span key={item}><Check size={18} /> {item}</span>
            ))}
          </div>
          <hr />
          <h2>Avaliações ({quadra.total_reviews})</h2>
          <div className="reviews-empty">Ainda não há avaliações detalhadas para este espaço</div>
        </div>
        <aside className="price-panel">
          <strong>{formatCurrency(quadra.preco_hora)}<small>/hora</small></strong>
          <span><Star size={16} /> {quadra.rating.toFixed(1)} • {quadra.total_reviews} avaliações</span>
          <button className="primary-action" type="button" onClick={() => onReserve(quadra)}>
            Reservar Agora
          </button>
          <small>Você não será cobrado ainda</small>
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
