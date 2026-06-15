import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fallbackCourtImage } from '../data/demoData'

export function PhotoCarousel({ photos = [], alt = 'Foto da quadra' }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (!photos || photos.length === 0) {
    return (
      <img 
        className="detail-image" 
        src={fallbackCourtImage} 
        alt={alt}
        onError={(event) => { event.currentTarget.src = fallbackCourtImage }}
      />
    )
  }

  if (photos.length === 1) {
    return (
      <img 
        className="detail-image" 
        src={photos[0]} 
        alt={alt}
        onError={(event) => { event.currentTarget.src = fallbackCourtImage }}
      />
    )
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  return (
    <div className="carousel-container">
      <div className="carousel-main">
        <img 
          className="detail-image carousel-image" 
          src={photos[currentIndex]} 
          alt={`${alt} ${currentIndex + 1}`}
          onError={(event) => { event.currentTarget.src = fallbackCourtImage }}
        />
        {photos.length > 1 && (
          <>
            <button 
              className="carousel-button carousel-button-prev" 
              type="button"
              onClick={handlePrev}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              className="carousel-button carousel-button-next" 
              type="button"
              onClick={handleNext}
              aria-label="Próxima foto"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="carousel-indicators">
          {photos.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para foto ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      )}
    </div>
  )
}
