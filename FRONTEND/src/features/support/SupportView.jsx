import { Mail, MessageCircle } from 'lucide-react'
import { CopyEmailLink, SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from '../../components/SupportEmailActions'
import facebookIcon from '../../assets/facebook.png'
import instagramIcon from '../../assets/insta.png'

const supportChannels = [
  {
    href: SUPPORT_EMAIL_HREF,
    icon: Mail,
    label: 'E-mail',
    value: SUPPORT_EMAIL,
    copyOnClick: true,
  },
  {
    href: 'https://wa.me/5500000000000',
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '(00) 00000-0000',
  },
  {
    href: 'https://www.instagram.com/play_arena05/',
    image: instagramIcon,
    imageClassName: 'support-social-icon-instagram',
    label: 'Instagram',
    value: '@play_arena05',
  },
  {
    href: 'https://www.facebook.com/profile.php?id=61590472120868',
    image: facebookIcon,
    label: 'Facebook',
    value: 'PlayArena',
  },
]

export function SupportView() {
  return (
    <section className="screen-stack support-screen">
      <div className="section-title compact">
        <div>
          <span>Atendimento</span>
          <h1>Suporte</h1>
        </div>
      </div>

      <div className="support-panel">
        <div className="support-heading">
          <h2>Fale com a PlayArena</h2>
          <p>Caso as reservas apresentem divergencias ou erros de sistema, acione o suporte.</p>
        </div>

        <div className="support-grid">
          {supportChannels.map((channel) => {
            const Icon = channel.icon

            if (channel.copyOnClick) {
              return (
                <CopyEmailLink className="support-channel" key={channel.label}>
                  <Icon size={20} />
                  <span>{channel.label}</span>
                  <strong>{channel.value}</strong>
                </CopyEmailLink>
              )
            }

            return (
              <a className="support-channel" key={channel.label} href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}>
                {Icon ? <Icon size={20} /> : <img className={channel.imageClassName} src={channel.image} alt="" aria-hidden="true" />}
                <span>{channel.label}</span>
                <strong>{channel.value}</strong>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
