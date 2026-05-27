import { useState } from 'react'
import { ArrowRight, Search, Sparkles } from 'lucide-react'
import { Logo } from '../../components/Logo'
import { CourtCard } from './CourtCard'

export function HomeView({ quadras, onSearch, onOpenCourt }) {
  const [query, setQuery] = useState('')

  function submit(event) {
    event.preventDefault()
    onSearch(query)
  }

  return (
    <div className="screen-stack">
      <section className="home-hero">
        <div className="hero-pattern" />
        <div className="home-hero-content">
          <div className="hero-logo">
            <Logo />
          </div>
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Mais de 500 quadras disponíveis</span>
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
          <div className="hero-numbers">
            <div><strong>500+</strong><span>Quadras</span></div>
            <div><strong>10K+</strong><span>Reservas</span></div>
            <div><strong>4.8</strong><span>Avaliação</span></div>
          </div>
        </div>
        <div className="hero-wave" />
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>Mais Populares</h2>
            <p>Os espaços mais bem avaliados</p>
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
