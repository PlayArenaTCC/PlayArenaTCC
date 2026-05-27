import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { sportLabels } from '../../data/demoData'
import { CourtCard } from './CourtCard'

export function SearchView({ initialQuery, quadras, onOpenCourt }) {
  const [query, setQuery] = useState(initialQuery)
  const [modalidade, setModalidade] = useState('todos')
  const [cidade, setCidade] = useState('')
  const [precoMax, setPrecoMax] = useState(500)

  const modalidades = useMemo(() => {
    const values = new Set(quadras.map((quadra) => quadra.modalidade).filter(Boolean))
    return ['todos', ...values]
  }, [quadras])

  const filtered = quadras.filter((quadra) => {
    const haystack = `${quadra.nome} ${quadra.endereco} ${quadra.bairro} ${quadra.cidade} ${quadra.modalidade}`.toLowerCase()
    const matchQuery = !query || haystack.includes(query.toLowerCase())
    const matchMode = modalidade === 'todos' || quadra.modalidade === modalidade
    const matchCity = !cidade || quadra.cidade?.toLowerCase().includes(cidade.toLowerCase())
    const matchPrice = Number(quadra.preco_hora || 0) <= Number(precoMax)
    return matchQuery && matchMode && matchCity && matchPrice
  })

  const activeFilters = (modalidade !== 'todos' ? 1 : 0) + (cidade ? 1 : 0) + (precoMax < 500 ? 1 : 0)

  function clearFilters() {
    setQuery('')
    setModalidade('todos')
    setCidade('')
    setPrecoMax(500)
  }

  return (
    <div className="content-layout">
      <aside className="filters-panel">
        <h2><SlidersHorizontal size={20} /> Filtros</h2>
        <label className="field">
          <span>Buscar</span>
          <div className="input-with-icon">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou localização..." />
          </div>
        </label>
        <label className="field">
          <span>Cidade</span>
          <input value={cidade} onChange={(event) => setCidade(event.target.value)} placeholder="Digite a cidade..." />
        </label>
        <label className="field">
          <span>Tipo de Esporte</span>
          <select value={modalidade} onChange={(event) => setModalidade(event.target.value)}>
            {modalidades.map((item) => (
              <option key={item} value={item}>
                {item === 'todos' ? 'Todos os esportes' : sportLabels[item] || item}
              </option>
            ))}
          </select>
        </label>
        <label className="field price-range">
          <span>Faixa de Preço: R$ 0 - R$ {precoMax}/hora</span>
          <input type="range" min="0" max="500" step="10" value={precoMax} onChange={(event) => setPrecoMax(Number(event.target.value))} />
        </label>
        {activeFilters > 0 && (
          <button className="secondary-action" type="button" onClick={clearFilters}>
            <X size={16} />
            Limpar Filtros ({activeFilters})
          </button>
        )}
      </aside>

      <section className="results-panel">
        <div className="section-title compact">
          <div>
            <h1>Buscar Espaços</h1>
            <p>{filtered.length} {filtered.length === 1 ? 'espaço encontrado' : 'espaços encontrados'}</p>
          </div>
        </div>
        <div className="court-grid">
          {filtered.map((quadra) => (
            <CourtCard key={quadra.id} quadra={quadra} onOpen={onOpenCourt} />
          ))}
        </div>
      </section>
    </div>
  )
}
