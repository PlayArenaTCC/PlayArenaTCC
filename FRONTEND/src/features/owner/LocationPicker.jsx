import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

const pickerMarkerIcon = L.divIcon({
  className: 'map-marker-shell is-active',
  html: '<span class="map-marker-dot" aria-hidden="true"></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

function RecenterMap({ position }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position, 17)
  }, [map, position])

  return null
}

export function LocationPicker({ latitude, longitude, onChange }) {
  const position = useMemo(() => [Number(latitude), Number(longitude)], [latitude, longitude])

  if (!position.every(Number.isFinite)) {
    return null
  }

  return (
    <div className="location-picker">
      <MapContainer center={position} className="location-picker-map" scrollWheelZoom zoom={17} zoomControl>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap position={position} />
        <Marker
          draggable
          eventHandlers={{
            dragend(event) {
              const nextPosition = event.target.getLatLng()
              onChange({
                latitude: nextPosition.lat,
                longitude: nextPosition.lng,
              })
            },
          }}
          icon={pickerMarkerIcon}
          position={position}
        />
      </MapContainer>
    </div>
  )
}
