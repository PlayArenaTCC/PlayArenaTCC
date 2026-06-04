import { Mail, MessageCircle, Phone } from 'lucide-react'

const supportChannels = [
  {
    href: 'https://wa.me/5500000000000',
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '(00) 00000-0000',
  },
  {
    href: 'tel:+550000000000',
    icon: Phone,
    label: 'Telefone',
    value: '(00) 00000-0000',
  },
  {
    href: 'mailto:contato@playarena.com.br',
    icon: Mail,
    label: 'E-mail',
    value: 'contato@playarena.com.br',
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

            return (
              <a className="support-channel" key={channel.label} href={channel.href} target={channel.href.startsWith('http') ? '_blank' : undefined} rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}>
                <Icon size={20} />
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
