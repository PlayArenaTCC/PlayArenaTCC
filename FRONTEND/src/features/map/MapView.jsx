import { MapPin } from 'lucide-react'

export function MapView({ quadras, onOpenCourt }) {
  return (
    <section className="map-screen">
      <div className="section-title compact">
        <div>
          <span>Campo Mourao</span>
          <h1>Mapa de Espacos</h1>
        </div>
      </div>
      <div className="map-panel">
        <div className="map-road horizontal" />
        <div className="map-road vertical" />
        <div className="map-road diagonal" />
        {quadras.slice(0, 5).map((quadra, index) => (
          <button
            key={quadra.id}
            className={`map-pin pin-${index + 1}`}
            type="button"
            onClick={() => onOpenCourt(quadra)}
          >
            <MapPin size={18} />
            <span>{quadra.nome}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
