import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { defaultHorarios } from '../../data/demoData'
import { fetchCourtSchedules } from '../../services/playarenaApi'
import { formatCurrency, shortTime, todayISO } from '../../utils/formatters'

export function ReservationModal({ quadra, token, onClose, onConfirm }) {
  const [data, setData] = useState(todayISO())
  const [horarios, setHorarios] = useState(quadra?.horarios_disponiveis?.length ? quadra.horarios_disponiveis : defaultHorarios)
  const [horarioId, setHorarioId] = useState(horarios[0]?.id || '')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSchedules() {
      if (!quadra || String(quadra.id).startsWith('demo')) {
        return
      }

      try {
        const response = await fetchCourtSchedules(quadra.id, data, token)
        if (active && response.horarios?.length) {
          setHorarios(response.horarios)
          setHorarioId(response.horarios.find((item) => !item.ocupado)?.id || response.horarios[0].id)
        }
      } catch {
        if (active) {
          setHorarios(defaultHorarios)
        }
      }
    }

    loadSchedules()
    return () => {
      active = false
    }
  }, [quadra, data, token])

  if (!quadra) {
    return null
  }

  const horario = horarios.find((item) => String(item.id) === String(horarioId)) || horarios[0]
  const valor = Number(horario?.valor || quadra.preco_hora)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    await onConfirm({
      data_reserva: data,
      horario,
      forma_pagamento: formaPagamento,
      observacoes,
      valor_total: valor,
    })
    setLoading(false)
  }

  return (
    <div className="modal-backdrop">
      <form className="reservation-modal" onSubmit={submit}>
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <h2>Reservar Espaço</h2>
        <p>{quadra.nome}</p>

        <label className="field">
          <span>Data da reserva</span>
          <input type="date" value={data} min={todayISO()} onChange={(event) => setData(event.target.value)} />
        </label>

        <label className="field">
          <span>Horário disponível</span>
          <select value={horarioId} onChange={(event) => setHorarioId(event.target.value)}>
            {horarios.map((item) => (
              <option key={item.id} value={item.id} disabled={item.ocupado}>
                {shortTime(item.hora_inicio)} - {shortTime(item.hora_fim)} {item.ocupado ? '(ocupado)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Forma de pagamento</span>
          <select value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value)}>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
          </select>
        </label>

        <label className="field">
          <span>Observação opcional</span>
          <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Ex.: confirmar uso de coletes" />
        </label>

        <div className="total-line">
          <span>Total</span>
          <strong>{formatCurrency(valor)}</strong>
        </div>

        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-action" type="submit" disabled={loading || !horario}>
            {loading ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}
