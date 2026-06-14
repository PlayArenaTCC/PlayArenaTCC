import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

export const SUPPORT_EMAIL = 'playarena.suporte@gmail.com'
export const SUPPORT_EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return true
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textArea)
  }
}

export function CopyEmailButton({ className = '' }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined

    const timeoutId = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function handleCopy(event) {
    event.preventDefault()
    event.stopPropagation()

    try {
      const didCopy = await copyText(SUPPORT_EMAIL)
      setCopied(Boolean(didCopy))
    } catch {
      window.prompt('Copie o e-mail de suporte:', SUPPORT_EMAIL)
    }
  }

  return (
    <button
      className={className ? `email-copy-button ${className}` : 'email-copy-button'}
      type="button"
      aria-label={copied ? 'E-mail copiado' : 'Copiar e-mail'}
      title={copied ? 'E-mail copiado' : 'Copiar e-mail'}
      onClick={handleCopy}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export function CopyEmailLink({ children, className = '', title = 'Copiar e-mail de suporte' }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined

    const timeoutId = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function handleCopy(event) {
    event.preventDefault()

    try {
      const didCopy = await copyText(SUPPORT_EMAIL)
      setCopied(Boolean(didCopy))
    } catch {
      window.prompt('Copie o e-mail de suporte:', SUPPORT_EMAIL)
    }
  }

  return (
    <a
      className={className}
      href={SUPPORT_EMAIL_HREF}
      aria-label={copied ? 'E-mail copiado' : 'Copiar e-mail de suporte'}
      title={copied ? 'E-mail copiado' : title}
      onClick={handleCopy}
    >
      {children}
    </a>
  )
}
