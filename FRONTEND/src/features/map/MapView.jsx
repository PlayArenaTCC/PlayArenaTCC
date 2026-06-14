import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatCurrency } from '../../utils/formatters'

const CAMPO_MOURAO_CENTER = [-24.0466, -52.3831]

const demoCoordinates = {
  'demo-quadra-integrado': [-24.0437, -52.3782],
  'demo-quadra-unespar': [-24.0508, -52.3834],
  'demo-quadra-society': [-24.0414, -52.3895],
}

const markerIcon = L.divIcon({
  className: 'map-marker-shell',
  html: '<span class="map-marker-dot" aria-hidden="true"></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
})

const activeMarkerIcon = L.divIcon({
  className: 'map-marker-shell is-active',
  html: '<span class="map-marker-dot" aria-hidden="true"></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20],
})

function getCourtPosition(quadra) {
  if (demoCoordinates[quadra.id]) {
    return demoCoordinates[quadra.id]
  }

  if (quadra.localizacao_confirmada !== true) {
    return null
  }

  const latitude = Number(quadra.latitude ?? quadra.lat)
  const longitude = Number(quadra.longitude ?? quadra.lng ?? quadra.lon)

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return [latitude, longitude]
  }

  return null
}

function getCourtAddress(quadra) {
  const addressLine = [quadra.endereco, quadra.numero].filter(Boolean).join(', ')

  return [addressLine, quadra.bairro, quadra.cidade, quadra.estado]
    .filter(Boolean)
    .join(', ')
}

function getDirectionsUrl(quadra, position) {
  const query = position ? `${position[0]},${position[1]}` : getCourtAddress(quadra)

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function FitMapToCourts({ activeCourtId, points }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) {
      map.setView(CAMPO_MOURAO_CENTER, 13)
      return
    }

    const activePoint = points.find((point) => point.id === activeCourtId)

    if (activePoint) {
      map.flyTo(activePoint.position, 15, { duration: 0.7 })
      return
    }

    if (points.length === 1) {
      map.setView(points[0].position, 15)
      return
    }

    map.fitBounds(points.map((point) => point.position), {
      maxZoom: 15,
      padding: [46, 46],
    })
  }, [activeCourtId, map, points])

  return null
}

export function MapView({ quadras, onOpenCourt }) {
  const courtPoints = useMemo(() => (
    quadras.map((quadra) => {
      const position = getCourtPosition(quadra)

      return {
        id: quadra.id,
        address: getCourtAddress(quadra),
        directionsUrl: getDirectionsUrl(quadra, position),
        position,
        quadra,
      }
    }).filter((point) => point.position)
  ), [quadras])
  const unpositionedCount = Math.max(quadras.length - courtPoints.length, 0)

  const [requestedActiveCourtId, setRequestedActiveCourtId] = useState('')
  const activeCourtId = courtPoints.some((point) => point.id === requestedActiveCourtId)
    ? requestedActiveCourtId
    : ''

  return (
    <section className="map-screen">
      <div className="section-title compact">
        <div>
          <span>Campo Mourão</span>
          <h1>Mapa de Espaços</h1>
        </div>
      </div>

      <div className="map-panel">
        <div className="map-canvas">
          <MapContainer
            center={CAMPO_MOURAO_CENTER}
            className="real-map"
            scrollWheelZoom
            zoom={13}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="bottomright" />
            <FitMapToCourts activeCourtId={activeCourtId} points={courtPoints} />

            {courtPoints.map((point) => (
              <Marker
                eventHandlers={{ click: () => setRequestedActiveCourtId(point.id) }}
                icon={point.id === activeCourtId ? activeMarkerIcon : markerIcon}
                key={point.id}
                position={point.position}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{point.quadra.nome}</strong>
                    <span>{point.address || 'Campo Mourão, PR'}</span>
                    <div className="map-popup-actions">
                      <button type="button" onClick={() => onOpenCourt(point.quadra)}>
                        Detalhes
                      </button>
                      <a href={point.directionsUrl} target="_blank" rel="noreferrer">
                        Rota
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="map-sidebar" aria-label="Quadras no mapa">
          <div className="map-sidebar-header">
            <strong>Quadras no mapa</strong>
            <span>{courtPoints.length}</span>
          </div>
          <div className="map-list">
            {unpositionedCount > 0 && (
              <p className="map-location-warning">
                {unpositionedCount} {unpositionedCount === 1 ? 'espaço não possui' : 'espaços não possuem'} localização precisa e não {unpositionedCount === 1 ? 'será exibido' : 'serão exibidos'} no mapa.
              </p>
            )}
            {courtPoints.map((point) => (
              <article
                className={point.id === activeCourtId ? 'map-court-row is-active' : 'map-court-row'}
                key={point.id}
              >
                <button className="map-list-main" type="button" onClick={() => setRequestedActiveCourtId(point.id)}>
                  <strong>{point.quadra.nome}</strong>
                  <span className="map-list-address">
                    <MapPin size={15} />
                    {point.address || 'Campo Mourão, PR'}
                  </span>
                  <span className="map-list-meta">
                    <span className="map-price-chip">
                      {formatCurrency(point.quadra.preco_hora)}/hora
                    </span>
                  </span>
                </button>
                <div className="map-list-actions">
                  <button className="soft-action" type="button" onClick={() => onOpenCourt(point.quadra)}>
                    <ExternalLink size={15} />
                    Detalhes
                  </button>
                  <a className="secondary-action" href={point.directionsUrl} target="_blank" rel="noreferrer">
                    <Navigation size={15} />
                    Rota
                  </a>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
