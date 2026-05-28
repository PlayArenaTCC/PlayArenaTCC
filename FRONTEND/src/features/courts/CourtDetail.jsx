import { ArrowLeft, CalendarDays, Clock, DollarSign, MapPin } from 'lucide-react'
import { Metric } from '../../components/Metric'
import { defaultHorarios, fallbackCourtImage, sportLabels } from '../../data/demoData'
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
            <Metric icon={CalendarDays} label="Dias disponíveis" value={`${new Set(horarios.map((item) => item.dia_semana)).size} dias/semana`} tone="yellow" />
          </div>
          <hr />
          <h2>Comodidades</h2>
          <div className="amenities-grid">
            {(quadra.amenities || []).map((item) => (
              <span key={item}><i className="amenity-dot" aria-hidden="true" /> {item}</span>
            ))}
          </div>
        </div>
        <aside className="price-panel">
          <strong>{formatCurrency(quadra.preco_hora)}<small>/hora</small></strong>
          <button className="primary-action" type="button" onClick={() => onReserve(quadra)}>
            Reservar Agora
          </button>
          <small>Você não será cobrado ainda</small>
        </aside>
      </div>
      <button className="ghost-link align-left detail-mobile-back" type="button" onClick={onBack}>
        Voltar
      </button>
    </section>
  )
}
