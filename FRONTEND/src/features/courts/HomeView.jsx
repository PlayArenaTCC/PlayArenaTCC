import { useMemo, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { sportLabels } from '../../data/demoData'
import { CourtCard } from './CourtCard'

export function HomeView({ quadras, onSearch, onOpenCourt }) {
  const [query, setQuery] = useState('')
  const quickSearches = useMemo(() => {
    return Array.from(new Set(quadras.map((quadra) => quadra.modalidade).filter(Boolean)))
      .slice(0, 4)
      .map((modalidade) => ({
        label: sportLabels[modalidade] || modalidade,
        value: modalidade,
      }))
  }, [quadras])

  function submit(event) {
    event.preventDefault()
    onSearch(query)
  }

  function applyQuickSearch(value) {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="screen-stack">
      <section className="home-hero">
        <div className="hero-pattern" />
        <div className="home-hero-content">
          <div className="hero-logo">
            <Logo />
          </div>
          <h1>
            Encontre o campo perfeito
            <br />
            <span>para jogar hoje</span>
          </h1>
          <p>Conectamos você aos melhores espaços esportivos da sua cidade</p>
          <form className="search-bar" onSubmit={submit}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cidade ou região..." />
            <button type="submit">Buscar</button>
          </form>
          {quickSearches.length > 0 && (
            <div className="hero-quick-searches">
              <span>Buscas rápidas</span>
              <div className="hero-chip-row">
                {quickSearches.map((item) => (
                  <button key={item.value} className="hero-chip" type="button" onClick={() => applyQuickSearch(item.value)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <svg className="hero-wave" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 42C150 68 265 86 415 88C592 91 690 68 852 70C1048 72 1147 101 1440 112V140H0V42Z" />
        </svg>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Mais Populares</h2>
            <p>Espaços em destaque para jogar hoje</p>
          </div>
          <button className="soft-action" type="button" onClick={() => onSearch('')}>
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="court-grid">
          {quadras.slice(0, 3).map((quadra) => (
            <CourtCard key={quadra.id} quadra={quadra} onOpen={onOpenCourt} featured />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Recém Adicionados</h2>
            <p>Novos espaços disponíveis para você</p>
          </div>
          <button className="soft-action" type="button" onClick={() => onSearch('')}>
            Ver todos
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="court-grid">
          {quadras.map((quadra) => (
            <CourtCard key={`recent-${quadra.id}`} quadra={quadra} onOpen={onOpenCourt} />
          ))}
        </div>
      </section>

      <section className="owner-cta">
        <h2>Você é proprietário de um espaço esportivo?</h2>
        <p>Cadastre sua quadra e comece a receber reservas hoje mesmo</p>
        <button className="primary-action" type="button">
          Cadastrar Meu Espaço
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  )
}
