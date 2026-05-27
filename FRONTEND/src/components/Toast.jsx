import { X } from 'lucide-react'

export function Toast({ message, onClose }) {
  if (!message) {
    return null
  }

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso">
        <X size={16} />
      </button>
    </div>
  )
}
