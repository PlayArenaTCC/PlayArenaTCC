import { useMemo } from 'react'
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  Download,
  PieChart,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { Metric } from '../../components/Metric'
import { sportLabels } from '../../data/demoData'
import { formatCurrency, formatDate, shortTime } from '../../utils/formatters'

const statusLabels = {
  pendente: 'Pendentes',
  confirmada: 'Confirmadas',
  concluida: 'Concluidas',
  cancelada: 'Canceladas',
}

const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

function asList(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function parseReservationDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function reservationTimestamp(reserva) {
  const date = parseReservationDate(reserva?.data_reserva)

  if (!date) {
    return Number.MAX_SAFE_INTEGER
  }

  const [hour = 0, minute = 0] = shortTime(reserva?.hora_inicio).split(':').map((part) => Number(part) || 0)
  date.setHours(hour, minute, 0, 0)
  return date.getTime()
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(date) {
  return monthFormatter.format(date).replace('.', '')
}

function getReservationValue(reserva) {
  return toNumber(reserva?.valor_total)
}

function isCancelled(reserva) {
  return reserva?.status === 'cancelada'
}

function getCourtIdFromReservation(reserva) {
  return reserva?.quadra_id ?? reserva?.quadra?.id ?? 'sem-quadra'
}

function getCourtName(quadra) {
  return quadra?.nome || 'Arena sem nome'
}

function getCourtModality(quadra) {
  const modality = quadra?.modalidade || 'poliesportiva'
  return sportLabels[modality] || modality || 'Modalidade'
}

function formatPercent(value) {
  return `${percentFormatter.format(Math.max(0, Math.min(100, value)))}%`
}

function getTimeBucket(reserva) {
  const hour = Number(shortTime(reserva?.hora_inicio).slice(0, 2))

  if (Number.isNaN(hour)) {
    return 'Nao informado'
  }

  if (hour < 12) {
    return 'Manha'
  }

  if (hour < 18) {
    return 'Tarde'
  }

  return 'Noite'
}

function buildMonthlySeries(reservas, activeReservas) {
  const validDates = reservas
    .map((reserva) => parseReservationDate(reserva.data_reserva))
    .filter(Boolean)
  const latestDate = validDates.reduce((latest, date) => (
    date.getTime() > latest.getTime() ? date : latest
  ), new Date())
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latestDate.getFullYear(), latestDate.getMonth() - (5 - index), 1)
    return {
      key: monthKey(date),
      label: monthLabel(date),
      reservas: 0,
      receita: 0,
    }
  })
  const monthMap = new Map(months.map((month) => [month.key, month]))
  const activeIds = new Set(activeReservas.map((reserva) => reserva.id))

  reservas.forEach((reserva) => {
    const date = parseReservationDate(reserva.data_reserva)
    const target = date ? monthMap.get(monthKey(date)) : null

    if (!target) {
      return
    }

    target.reservas += 1

    if (activeIds.has(reserva.id)) {
      target.receita += getReservationValue(reserva)
    }
  })

  return months
}

function buildOwnerAnalytics(ownerQuadras, ownerReservas) {
  const quadras = asList(ownerQuadras)
  const reservas = asList(ownerReservas)
  const activeReservas = reservas.filter((reserva) => !isCancelled(reserva))
  const cancelledReservas = reservas.filter(isCancelled)
  const activeSchedules = quadras.flatMap((quadra) => (
    asList(quadra.horarios_disponiveis)
      .filter((schedule) => schedule.disponivel !== false)
      .map((schedule) => ({ ...schedule, quadra_id: quadra.id }))
  ))
  const revenue = activeReservas.reduce((sum, reserva) => sum + getReservationValue(reserva), 0)
  const avgTicket = activeReservas.length ? revenue / activeReservas.length : 0
  const activeCourts = quadras.filter((quadra) => quadra.ativa !== false)
  const scheduledDemand = activeReservas.length + activeSchedules.length
  const demandRate = scheduledDemand ? (activeReservas.length / scheduledDemand) * 100 : 0
  const courtMap = new Map(quadras.map((quadra) => [String(quadra.id), quadra]))
  const byCourt = new Map(quadras.map((quadra) => [String(quadra.id), {
    id: quadra.id,
    name: getCourtName(quadra),
    modality: getCourtModality(quadra),
    status: quadra.ativa === false ? 'Inativa' : 'Ativa',
    horarios: asList(quadra.horarios_disponiveis).length,
    reservas: 0,
    receita: 0,
  }]))
  const byModality = new Map()
  const byWeekday = new Map(weekDayLabels.map((label) => [label, { label, value: 0 }]))
  const byTimeBucket = new Map(['Manha', 'Tarde', 'Noite', 'Nao informado'].map((label) => [label, { label, value: 0 }]))
  const byCustomer = new Map()

  activeReservas.forEach((reserva) => {
    const courtId = String(getCourtIdFromReservation(reserva))
    const court = courtMap.get(courtId) || reserva.quadra || {}
    const courtItem = byCourt.get(courtId) || {
      id: courtId,
      name: getCourtName(court),
      modality: getCourtModality(court),
      status: 'Sem cadastro',
      horarios: 0,
      reservas: 0,
      receita: 0,
    }
    const reservationValue = getReservationValue(reserva)
    const modality = getCourtModality(court)
    const modalityItem = byModality.get(modality) || { label: modality, value: 0, receita: 0 }
    const date = parseReservationDate(reserva.data_reserva)
    const bucket = getTimeBucket(reserva)
    const customerName = reserva.usuario?.nome || 'Cliente sem nome'
    const customerKey = reserva.usuario?.id || customerName
    const customerItem = byCustomer.get(customerKey) || { label: customerName, value: 0, receita: 0 }

    courtItem.reservas += 1
    courtItem.receita += reservationValue
    byCourt.set(courtId, courtItem)

    modalityItem.value += 1
    modalityItem.receita += reservationValue
    byModality.set(modality, modalityItem)

    if (date) {
      const weekday = weekDayLabels[date.getDay()]
      byWeekday.get(weekday).value += 1
    }

    byTimeBucket.get(bucket).value += 1

    customerItem.value += 1
    customerItem.receita += reservationValue
    byCustomer.set(customerKey, customerItem)
  })

  const statusItems = Object.entries(statusLabels).map(([status, label]) => ({
    label,
    value: reservas.filter((reserva) => reserva.status === status).length,
  }))
  const courtItems = [...byCourt.values()]
    .sort((a, b) => b.receita - a.receita || b.reservas - a.reservas || a.name.localeCompare(b.name))
  const modalityItems = [...byModality.values()]
    .sort((a, b) => b.receita - a.receita || b.value - a.value)
  const customerItems = [...byCustomer.values()]
    .sort((a, b) => b.value - a.value || b.receita - a.receita)
  const monthlySeries = buildMonthlySeries(reservas, activeReservas)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const upcomingReservations = activeReservas
    .filter((reserva) => reservationTimestamp(reserva) >= todayStart.getTime())
    .sort((a, b) => reservationTimestamp(a) - reservationTimestamp(b))
    .slice(0, 6)
  const recentReservations = reservas
    .slice()
    .sort((a, b) => reservationTimestamp(b) - reservationTimestamp(a))
    .slice(0, 6)

  return {
    activeCourts: activeCourts.length,
    activeReservas,
    activeSchedules: activeSchedules.length,
    avgTicket,
    cancelledReservas: cancelledReservas.length,
    courtItems,
    customerItems,
    demandRate,
    monthlySeries,
    modalityItems,
    recentReservations,
    revenue,
    statusItems,
    timeBucketItems: [...byTimeBucket.values()],
    totalCourts: quadras.length,
    totalReservas: reservas.length,
    upcomingReservations,
    weekdayItems: [...byWeekday.values()],
  }
}

function EmptyChart() {
  return <p className="owner-bi-empty">Sem dados suficientes para este gr&aacute;fico.</p>
}

function HorizontalBarChart({ items, valueFormatter = (value) => value, valueKey = 'value', maxItems = 6 }) {
  const visibleItems = asList(items).filter((item) => toNumber(item[valueKey]) > 0).slice(0, maxItems)
  const maxValue = Math.max(...visibleItems.map((item) => toNumber(item[valueKey])), 1)

  if (!visibleItems.length) {
    return <EmptyChart />
  }

  return (
    <div className="owner-bi-bars">
      {visibleItems.map((item) => {
        const value = toNumber(item[valueKey])
        const width = Math.max((value / maxValue) * 100, 5)

        return (
          <div className="owner-bi-bar-row" key={item.label || item.name}>
            <div className="owner-bi-bar-label">
              <span>{item.label || item.name}</span>
              <strong>{valueFormatter(value, item)}</strong>
            </div>
            <div className="owner-bi-bar-track" aria-hidden="true">
              <span style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthlyChart({ items }) {
  const maxRevenue = Math.max(...items.map((item) => toNumber(item.receita)), 1)

  return (
    <div className="owner-bi-month-chart">
      {items.map((item) => {
        const height = Math.max((toNumber(item.receita) / maxRevenue) * 100, item.receita > 0 ? 8 : 2)

        return (
          <div className="owner-bi-month" key={item.key}>
            <div className="owner-bi-month-column" title={`${item.label}: ${formatCurrency(item.receita)}`}>
              <span style={{ '--bar-size': `${height}%` }} />
            </div>
            <strong>{formatCurrency(item.receita)}</strong>
            <small>{item.label}</small>
          </div>
        )
      })}
    </div>
  )
}

function DataPanel({ eyebrow, title, children, className = '' }) {
  return (
    <article className={`plain-panel owner-bi-panel ${className}`}>
      <div className="owner-bi-panel-heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  )
}

function ReservationMiniTable({ title, reservas }) {
  return (
    <DataPanel eyebrow="Reservas" title={title}>
      {reservas.length ? (
        <div className="owner-bi-table-wrap">
          <table className="owner-bi-table">
            <thead>
              <tr>
                <th>Arena</th>
                <th>Data</th>
                <th>Hor&aacute;rio</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((reserva) => (
                <tr key={reserva.id}>
                  <td>{reserva.quadra?.nome || 'Arena'}</td>
                  <td>{formatDate(reserva.data_reserva)}</td>
                  <td>{shortTime(reserva.hora_inicio)} - {shortTime(reserva.hora_fim)}</td>
                  <td>{statusLabels[reserva.status] || reserva.status || 'Sem status'}</td>
                  <td>{formatCurrency(reserva.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyChart />
      )}
    </DataPanel>
  )
}

export function OwnerBusinessIntelligence({ session, ownerQuadras, ownerReservas, onBack }) {
  const analytics = useMemo(() => (
    buildOwnerAnalytics(ownerQuadras, ownerReservas)
  ), [ownerQuadras, ownerReservas])
  const ownerName = session?.usuario?.nome_empresa || session?.usuario?.nome_responsavel || session?.usuario?.nome || 'Proprietario'
  const generatedAt = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  function handlePrintReport() {
    const previousTitle = document.title
    const cleanup = () => {
      document.body.classList.remove('print-owner-bi')
      document.title = previousTitle
    }

    document.title = `PlayArena - Relatorio BI - ${ownerName}`
    document.body.classList.add('print-owner-bi')
    window.addEventListener('afterprint', cleanup, { once: true })
    window.print()
    window.setTimeout(cleanup, 1200)
  }

  return (
    <section className="screen-stack owner-bi-screen">
      <div className="section-title compact owner-bi-title">
        <div>
          <span>Business intelligence</span>
          <h1>BI e Relat&oacute;rios</h1>
          <p>Vis&atilde;o completa das arenas, reservas, receita e comportamento de uso.</p>
        </div>
        <div className="owner-bi-actions">
          <button className="secondary-action slim-action" type="button" onClick={onBack}>
            <ArrowLeft size={17} />
            Dashboard
          </button>
          <button className="primary-action slim-action" type="button" onClick={handlePrintReport}>
            <Download size={17} />
            Gerar PDF
          </button>
        </div>
      </div>

      <section className="owner-bi-report" aria-label="Relatorio de BI do proprietario">
        <div className="owner-bi-report-header">
          <div>
            <span>Relat&oacute;rio BI PlayArena</span>
            <h2>{ownerName}</h2>
          </div>
          <small>Gerado em {generatedAt}</small>
        </div>

        <div className="metrics-grid owner-bi-metrics">
          <Metric icon={DollarSign} label="Receita estimada" value={formatCurrency(analytics.revenue)} tone="yellow" />
          <Metric icon={CalendarDays} label="Reservas totais" value={analytics.totalReservas} tone="blue" />
          <Metric icon={TrendingUp} label="Ticket medio" value={formatCurrency(analytics.avgTicket)} />
          <Metric icon={Building2} label="Arenas ativas" value={`${analytics.activeCourts}/${analytics.totalCourts}`} tone="purple" />
          <Metric icon={Clock} label="Horarios ativos" value={analytics.activeSchedules} tone="blue" />
          <Metric icon={PieChart} label="Reservas canceladas" value={analytics.cancelledReservas} tone="red" />
          <Metric icon={Activity} label="Taxa de demanda" value={formatPercent(analytics.demandRate)} />
          <Metric icon={Users} label="Clientes com reserva" value={analytics.customerItems.length} tone="purple" />
        </div>

        <div className="owner-bi-grid">
          <DataPanel eyebrow="Receita" title="Evolu&ccedil;&atilde;o mensal" className="owner-bi-wide">
            <MonthlyChart items={analytics.monthlySeries} />
          </DataPanel>

          <DataPanel eyebrow="Status" title="Distribui&ccedil;&atilde;o de reservas">
            <HorizontalBarChart items={analytics.statusItems} />
          </DataPanel>

          <DataPanel eyebrow="Arenas" title="Receita por arena">
            <HorizontalBarChart
              items={analytics.courtItems}
              valueKey="receita"
              valueFormatter={(value) => formatCurrency(value)}
            />
          </DataPanel>

          <DataPanel eyebrow="Modalidades" title="Receita por modalidade">
            <HorizontalBarChart
              items={analytics.modalityItems}
              valueKey="receita"
              valueFormatter={(value) => formatCurrency(value)}
            />
          </DataPanel>

          <DataPanel eyebrow="Agenda" title="Dias com mais reservas">
            <HorizontalBarChart items={analytics.weekdayItems} />
          </DataPanel>

          <DataPanel eyebrow="Hor&aacute;rios" title="Movimento por per&iacute;odo">
            <HorizontalBarChart items={analytics.timeBucketItems} />
          </DataPanel>

          <DataPanel eyebrow="Clientes" title="Clientes recorrentes">
            <HorizontalBarChart
              items={analytics.customerItems}
              valueFormatter={(value, item) => `${value} reserva${value === 1 ? '' : 's'} - ${formatCurrency(item.receita)}`}
            />
          </DataPanel>

          <DataPanel eyebrow="Ranking" title="Desempenho das arenas" className="owner-bi-wide">
            {analytics.courtItems.length ? (
              <div className="owner-bi-table-wrap">
                <table className="owner-bi-table">
                  <thead>
                    <tr>
                      <th>Arena</th>
                      <th>Modalidade</th>
                      <th>Status</th>
                      <th>Hor&aacute;rios</th>
                      <th>Reservas</th>
                      <th>Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.courtItems.map((court) => (
                      <tr key={court.id}>
                        <td>
                          <span className="owner-bi-table-title">
                            <Trophy size={15} />
                            {court.name}
                          </span>
                        </td>
                        <td>{court.modality}</td>
                        <td>{court.status}</td>
                        <td>{court.horarios}</td>
                        <td>{court.reservas}</td>
                        <td>{formatCurrency(court.receita)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyChart />
            )}
          </DataPanel>

          <ReservationMiniTable title="Pr&oacute;ximas reservas" reservas={analytics.upcomingReservations} />
          <ReservationMiniTable title="Hist&oacute;rico recente" reservas={analytics.recentReservations} />

          <DataPanel eyebrow="Resumo" title="Indicadores executivos" className="owner-bi-wide">
            <div className="owner-bi-insights">
              <span>
                <strong>{analytics.courtItems[0]?.name || 'Sem arena em destaque'}</strong>
                Arena com maior receita no per&iacute;odo carregado.
              </span>
              <span>
                <strong>{analytics.modalityItems[0]?.label || 'Sem modalidade'}</strong>
                Modalidade com maior faturamento entre reservas ativas.
              </span>
              <span>
                <strong>{formatPercent(analytics.demandRate)}</strong>
                Rela&ccedil;&atilde;o entre reservas ativas e hor&aacute;rios dispon&iacute;veis cadastrados.
              </span>
              <span>
                <strong>{formatCurrency(analytics.avgTicket)}</strong>
                Valor m&eacute;dio por reserva n&atilde;o cancelada.
              </span>
            </div>
          </DataPanel>
        </div>
      </section>
    </section>
  )
}
