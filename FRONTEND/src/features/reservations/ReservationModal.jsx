import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { defaultHorarios } from '../../data/demoData'
import { fetchCourtSchedules } from '../../services/playarenaApi'
<<<<<<< Updated upstream
import { formatCurrency, shortTime, todayISO } from '../../utils/formatters'
=======
import { DATA_CHANGED_EVENT } from '../../services/httpClient'
import { formatCurrency, formatDate, shortTime, todayISO } from '../../utils/formatters'

const SCHEDULE_REFRESH_INTERVAL_MS = 15000

const paymentLabels = {
  pix: 'Pix',
  cartao: 'Cartão',
}

function getSchedulePriceLabel(item, basePrice) {
  const price = getSchedulePrice(item, basePrice)
  const base = Number(basePrice || 0)

  if (!price) {
    return ''
  }

  if (base && price < base) {
    return `${formatCurrency(price)} - promocao`
  }

  if (base && price > base) {
    return `${formatCurrency(price)} - valor especial`
  }

  return formatCurrency(price)
}

function getSchedulePrice(item, basePrice) {
  const base = Number(basePrice || 0)

  if (!item) {
    return base
  }

  if (Object.prototype.hasOwnProperty.call(item, 'valor_especial')) {
    return item.valor_especial ? Number(item.valor || base || 0) : base
  }

  return Number(item.valor || base || 0)
}
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
      if (!quadra || String(quadra.id).startsWith('demo')) {
=======
      if (!quadra) {
        return
      }

      if (String(quadra.id).startsWith('demo')) {
        if (active) {
          const nextSchedules = quadra.horarios_disponiveis?.length ? quadra.horarios_disponiveis : defaultHorarios
          setHorarios(nextSchedules)
          setHorarioId((current) => (
            nextSchedules.some((item) => String(item.id) === String(current))
              ? current
              : nextSchedules[0]?.id || ''
          ))
        }
>>>>>>> Stashed changes
        return
      }

      try {
        const response = await fetchCourtSchedules(quadra.id, data, token)
<<<<<<< Updated upstream
        if (active && response.horarios?.length) {
          setHorarios(response.horarios)
          setHorarioId(response.horarios.find((item) => !item.ocupado)?.id || response.horarios[0].id)
=======
        if (active) {
          const nextSchedules = response.horarios || []
          setHorarios(nextSchedules)
          setHorarioId((current) => {
            const remainsAvailable = nextSchedules.some((item) => String(item.id) === String(current))

            if (!remainsAvailable) {
              setReviewing(false)
            }

            return remainsAvailable ? current : nextSchedules[0]?.id || ''
          })
>>>>>>> Stashed changes
        }
      } catch {
        if (active) {
          setHorarios(defaultHorarios)
        }
      }
    }

    loadSchedules()
    const shouldAutoRefresh = quadra && !String(quadra.id).startsWith('demo')
    const intervalId = shouldAutoRefresh
      ? window.setInterval(loadSchedules, SCHEDULE_REFRESH_INTERVAL_MS)
      : null

    if (shouldAutoRefresh) {
      window.addEventListener(DATA_CHANGED_EVENT, loadSchedules)
    }

    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener(DATA_CHANGED_EVENT, loadSchedules)
    }
  }, [quadra, data, token])

  if (!quadra) {
    return null
  }

  const horario = horarios.find((item) => String(item.id) === String(horarioId)) || horarios[0]
<<<<<<< Updated upstream
  const valor = Number(horario?.valor || quadra.preco_hora)
=======
  const basePrice = Number(quadra.preco_hora || 0)
  const valor = horario ? getSchedulePrice(horario, basePrice) : 0
  const hasSpecialSchedulePrice = Boolean(horario) && basePrice > 0 && valor !== basePrice
  const endereco = [
    [quadra.endereco, quadra.numero].filter(Boolean).join(', '),
    quadra.bairro,
    quadra.cidade && quadra.estado ? `${quadra.cidade}/${quadra.estado}` : quadra.cidade || quadra.estado,
  ].filter(Boolean).join(' - ')
  const proprietario = quadra.proprietario?.nome_empresa || quadra.proprietario?.nome_responsavel
  const hasValidSlot = Boolean(horario) && !horario.ocupado
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
        <label className="field">
          <span>Data da reserva</span>
          <input type="date" value={data} min={todayISO()} onChange={(event) => setData(event.target.value)} />
        </label>

        <label className="field">
          <span>Horario disponivel</span>
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
            <option value="cartao">Cartao</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="nao_informado">Nao informado</option>
          </select>
        </label>

        <label className="field">
          <span>Observacao opcional</span>
          <textarea value={observacoes} onChange={(event) => setObservacoes(event.target.value)} placeholder="Ex.: confirmar uso de coletes" />
        </label>
=======
        <div className="reservation-privacy-alert" role="alert">
          <ShieldCheck size={18} />
          <span>Por privacidade, o WhatsApp do proprietário será disponibilizado somente após a confirmação da reserva.</span>
        </div>

        {reviewing ? (
          <div className="reservation-review-summary">
            <div className="reservation-review-heading">
              <ClipboardList size={18} />
              <div>
                <strong>Resumo completo da reserva</strong>
                <small>Confira os dados antes de confirmar.</small>
              </div>
            </div>
            <div className="reservation-review-lines">
              <span>Quadra <strong>{quadra.nome}</strong></span>
              {proprietario && <span>Proprietário <strong>{proprietario}</strong></span>}
              <span>Endereço <strong>{endereco || 'Localidade não informada'}</strong></span>
              <span>Data <strong>{formatDate(data)}</strong></span>
              <span>Horário <strong>{shortTime(horario?.hora_inicio)} - {shortTime(horario?.hora_fim)}</strong></span>
              {hasSpecialSchedulePrice && <span>Preco do horario <strong>{getSchedulePriceLabel(horario, basePrice)}</strong></span>}
              <span>Pagamento <strong>{paymentLabels[formaPagamento] || formaPagamento}</strong></span>
              <span>Observações <strong>{observacoes || 'Nenhuma observação'}</strong></span>
              <span>Total <strong>{formatCurrency(valor)}</strong></span>
            </div>
          </div>
        ) : (
          <>
            <label className="field">
              <span>Data da reserva</span>
              <input type="date" value={data} min={todayISO()} onChange={handleDateChange} />
            </label>

            <label className="field">
              <span>Horário disponível</span>
              <select value={horarioId} disabled={!horarios.length} onChange={(event) => setHorarioId(event.target.value)}>
                {!horarios.length && <option value="">Nenhum horario disponivel nesta data</option>}
                {horarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {shortTime(item.hora_inicio)} - {shortTime(item.hora_fim)} - {getSchedulePriceLabel(item, basePrice)}
                  </option>
                ))}
              </select>
              {!horarios.length && (
                <small className="field-help">Escolha uma data com horarios cadastrados e ainda livres.</small>
              )}
            </label>

            {hasSpecialSchedulePrice && (
              <div className={valor < basePrice ? 'reservation-price-note is-discount' : 'reservation-price-note'}>
                <span>Preco geral: {formatCurrency(basePrice)}</span>
                <strong>{valor < basePrice ? 'Promocao neste horario' : 'Valor especial neste horario'}: {formatCurrency(valor)}</strong>
              </div>
            )}

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
          </>
        )}
>>>>>>> Stashed changes

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
