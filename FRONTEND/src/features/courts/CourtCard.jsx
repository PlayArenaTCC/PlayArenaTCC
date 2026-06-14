import { DollarSign, MapPin } from 'lucide-react'
import { fallbackCourtImage, sportLabels } from '../../data/demoData'
import { formatPlainCurrency } from '../../utils/formatters'

export function CourtCard({ quadra, onOpen, featured = false }) {
  return (
    <article className={featured ? 'court-card is-featured' : 'court-card'} onClick={() => onOpen(quadra)}>
      <div className="court-card-media">
        <img src={quadra.imagem_url} alt={quadra.nome} onError={(event) => { event.currentTarget.src = fallbackCourtImage }} />
        <div className="media-shade" />
        <span className={`sport-badge sport-${quadra.modalidade}`}>{sportLabels[quadra.modalidade] || quadra.modalidade}</span>
        {featured && <span className="featured-badge">Destaque</span>}
      </div>
      <div className="court-card-body">
        <div>
          <h3>{quadra.nome}</h3>
          <p>
            <MapPin size={15} />
            {quadra.cidade}, {quadra.estado}
          </p>
        </div>
        {quadra.amenities?.length > 0 && (
          <div className="amenity-row">
            {quadra.amenities.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
            {quadra.amenities.length > 3 && <span>+{quadra.amenities.length - 3}</span>}
          </div>
        )}
        <div className="court-card-footer">
          <strong>
            <DollarSign size={20} />
            {formatPlainCurrency(quadra.preco_hora)}
            <small>/hora</small>
          </strong>
        </div>
      </div>
    </article>
  )
}
