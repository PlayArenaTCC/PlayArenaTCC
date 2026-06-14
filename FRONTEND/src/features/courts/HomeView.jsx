import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, FileText, Home, LifeBuoy, Mail, MapPin, MessageCircle, Search, User } from 'lucide-react'
import { CopyEmailLink, SUPPORT_EMAIL } from '../../components/SupportEmailActions'
import facebookIcon from '../../assets/facebook.png'
import instagramIcon from '../../assets/insta.png'
import mascotImage from '../../assets/MascoteOfi-footer.png'
import { sportLabels } from '../../data/demoData'
import { CourtCard } from './CourtCard'

export function HomeView({ quadras, onNavigate, onSearch, onOpenCourt, onOwnerSignup }) {
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

  function requestOwnerSignup() {
    if (window.confirm('Ao clicar você fará logout. Deseja continuar?')) {
      onOwnerSignup()
    }
  }

  function scrollToTop() {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  function goToView(view) {
    onNavigate(view)
    scrollToTop()
  }

  function goToSearch() {
    onSearch('')
    scrollToTop()
  }

  return (
    <div className="screen-stack">
      <section className="home-hero">
        <div className="hero-pattern" />
        <div className="home-hero-content">
          <div className="hero-logo-spacer" aria-hidden="true" />
          <h1>
            Encontre o espaço perfeito
            <br />
            <span>para jogar hoje</span>
          </h1>
          <p>Conectamos você aos melhores espaços esportivos da cidade</p>
          <form className="search-bar" onSubmit={submit}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Quadra ou Bairro" />
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
        <p>Cadastre sua quadra e comece a receber reservas o quanto antes.</p>
        <button className="primary-action" type="button" onClick={requestOwnerSignup}>
          Cadastre-se já
          <ArrowRight size={18} />
        </button>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <strong>PlayArena</strong>
            <p>Conectando pessoas aos melhores espaços esportivos da cidade.</p>
            <img className="footer-mascot" src={mascotImage} alt="Mascote PlayArena" />
          </div>

          <div className="footer-column">
            <h3>Contato</h3>
            <CopyEmailLink className="footer-email-link">
              <Mail size={16} />
              <span>{SUPPORT_EMAIL}</span>
            </CopyEmailLink>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer">
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          <div className="footer-column">
            <h3>Atalhos</h3>
            <button className="footer-link-button" type="button" onClick={() => goToView('home')}>
              <Home size={16} />
              Início
            </button>
            <button className="footer-link-button" type="button" onClick={goToSearch}>
              <Search size={16} />
              Buscar quadras
            </button>
            <button className="footer-link-button" type="button" onClick={() => goToView('minhas-reservas')}>
              <CalendarDays size={16} />
              Minhas reservas
            </button>
            <button className="footer-link-button" type="button" onClick={() => goToView('mapa')}>
              <MapPin size={16} />
              Mapa
            </button>
            <button className="footer-link-button" type="button" onClick={() => goToView('suporte')}>
              <LifeBuoy size={16} />
              Suporte
            </button>
            <button className="footer-link-button" type="button" onClick={() => goToView('perfil')}>
              <User size={16} />
              Meu perfil
            </button>
          </div>

          <div className="footer-column">
            <h3>Redes</h3>
            <div className="footer-socials">
              <a className="footer-social-link" href="https://www.instagram.com/play_arena05/" target="_blank" rel="noreferrer">
                <img className="footer-social-icon footer-social-icon-instagram" src={instagramIcon} alt="" aria-hidden="true" />
                Instagram
              </a>
              <a className="footer-social-link" href="https://www.facebook.com/profile.php?id=61590472120868" target="_blank" rel="noreferrer">
                <img className="footer-social-icon" src={facebookIcon} alt="" aria-hidden="true" />
                Facebook
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Institucional</h3>
            <a href="/docs/sobre.pdf" target="_blank" rel="noreferrer">
              <FileText size={16} />
              Sobre
            </a>
            <a href="/docs/termos-de-uso-playarena.pdf" target="_blank" rel="noreferrer">
              <FileText size={16} />
              Termos de uso
            </a>
            <a href="/docs/politica-de-privacidade-playarena.pdf" target="_blank" rel="noreferrer">
              <FileText size={16} />
              Privacidade
            </a>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              Copyright &copy; 2000 - 2026 www.playarena.com.br, TODOS OS DIREITOS RESERVADOS. As fotos aqui veiculadas, logotipo e marca s&atilde;o de propriedade do site www.playarena.com.br.
              <br />
              &Eacute; vetada a sua reprodu&ccedil;&atilde;o, total ou parcial, sem a expressa autoriza&ccedil;&atilde;o da administradora do site.
              <br />
              Caso as reservas apresentem diverg&ecirc;ncias e erros de sistema acione o suporte.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
