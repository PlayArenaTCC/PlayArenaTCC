import { MapPin } from 'lucide-react'
import { fallbackCourtImage, sportLabels } from '../../data/demoData'
import { formatCurrency } from '../../utils/formatters'

function getOriginalPrice(quadra) {
  const original = Number(quadra.preco_original || 0)
  const current = Number(quadra.preco_hora || 0)
  return original > current ? original : null
}

export function CourtCard({ quadra, onOpen, featured = false }) {
  const originalPrice = getOriginalPrice(quadra)
  const className = [
    'court-card',
    featured ? 'is-featured' : '',
    quadra.ativa === false ? 'is-inactive' : '',
  ].filter(Boolean).join(' ')

  return (
    <article className={className} onClick={() => onOpen(quadra)}>
      <div className="court-card-media">
        <img src={quadra.imagem_url} alt={quadra.nome} onError={(event) => { event.currentTarget.src = fallbackCourtImage }} />
        <div className="media-shade" />
        <span className={`sport-badge sport-${quadra.modalidade}`}>{sportLabels[quadra.modalidade] || quadra.modalidade}</span>
        <span className={quadra.ativa === false ? 'court-availability-badge is-inactive' : 'court-availability-badge is-active'}>
          {quadra.ativa === false ? 'Inativo' : 'Ativo'}
        </span>
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
          <div className={originalPrice ? 'price-stack is-promo' : 'price-stack'}>
            {originalPrice && (
              <span className="promo-old-price">De {formatCurrency(originalPrice)}</span>
            )}
            {originalPrice && <span className="promo-badge">Promoção</span>}
            <strong>
              {formatCurrency(quadra.preco_hora)}
              <small>/hora</small>
            </strong>
          </div>
        </div>
      </div>
    </article>
  )
}
