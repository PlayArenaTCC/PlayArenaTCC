import { FileText, Mail, MessageCircle, Phone } from 'lucide-react'
import facebookIcon from '../assets/facebook.png'
import instagramIcon from '../assets/insta.png'

function scrollToTop() {
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

export function SiteFooter({ className = '', shortcuts = [], onNavigate }) {
  function handleShortcut(shortcut) {
    if (shortcut.onClick) {
      shortcut.onClick()
    } else if (shortcut.id && onNavigate) {
      onNavigate(shortcut.id)
    }

    scrollToTop()
  }

  return (
    <footer className={className ? `site-footer ${className}` : 'site-footer'}>
      <div className="site-footer-inner">
        <div className="footer-brand">
          <strong>PlayArena</strong>
          <p>Conectando pessoas aos melhores espa&ccedil;os esportivos da cidade.</p>
        </div>

        <div className="footer-column">
          <h3>Contato</h3>
          <a href="https://wa.me/5500000000000" target="_blank" rel="noreferrer">
            <MessageCircle size={16} />
            WhatsApp
          </a>
          <a href="tel:+550000000000">
            <Phone size={16} />
            (00) 00000-0000
          </a>
          <a href="mailto:contato@playarena.com.br">
            <Mail size={16} />
            contato@playarena.com.br
          </a>
        </div>

        <div className="footer-column">
          <h3>Atalhos</h3>
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon

            return (
              <button className="footer-link-button" key={shortcut.id} type="button" onClick={() => handleShortcut(shortcut)}>
                {Icon && <Icon size={16} />}
                {shortcut.label}
              </button>
            )
          })}
        </div>

        <div className="footer-column">
          <h3>Redes</h3>
          <div className="footer-socials">
            <a className="footer-social-link" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
              <img className="footer-social-icon footer-social-icon-instagram" src={instagramIcon} alt="" aria-hidden="true" />
              Instagram
            </a>
            <a className="footer-social-link" href="https://www.facebook.com/" target="_blank" rel="noreferrer">
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
  )
}
