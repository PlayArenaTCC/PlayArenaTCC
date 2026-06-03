import { useEffect, useState } from 'react'
import { adminNav, ownerNav, userNav } from '../data/navigation'
import { demoQuadras } from '../data/demoData'
import {
  cancelReservation,
  createCourt,
  createReservation,
  createSchedule,
  deleteCourt,
  deleteSchedule,
  fetchQuadras,
  fetchRoleData,
  login,
  registerAccount,
  updateOwnerApproval,
<<<<<<< Updated upstream
=======
  updateCourt,
  updateProfile,
>>>>>>> Stashed changes
  updateReservationStatus,
  updateScheduleAvailability,
  updateUserStatus,
} from '../services/playarenaApi'
import { normalizeCourt } from '../utils/formatters'
import { clearStoredSession, getStoredSession, persistSession } from '../utils/sessionStorage'
import { useToast } from './useToast'

function scheduleKey(schedule) {
  return [
    schedule?.data || '',
    schedule?.dia_semana ?? '',
    schedule?.hora_inicio || '',
    schedule?.hora_fim || '',
  ].join('|')
}

function mergeScheduleList(schedules = [], schedule) {
  const key = scheduleKey(schedule)
  const hasSchedule = schedules.some((item) => item.id === schedule.id || scheduleKey(item) === key)

  if (!hasSchedule) {
    return [...schedules, schedule]
  }

  return schedules.map((item) => (
    item.id === schedule.id || scheduleKey(item) === key ? schedule : item
  ))
}

function mergeCourtSchedule(court, schedule) {
  if (!court) {
    return court
  }

  return {
    ...court,
    horarios_disponiveis: mergeScheduleList(court.horarios_disponiveis || [], schedule),
  }
}

function removeCourtSchedule(court, horario) {
  if (!court) {
    return court
  }

  return {
    ...court,
    horarios_disponiveis: (court.horarios_disponiveis || []).filter((schedule) => schedule.id !== horario.id),
  }
}

function setCourtScheduleAvailability(court, horario, disponivel) {
  if (!court) {
    return court
  }

  return {
    ...court,
    horarios_disponiveis: (court.horarios_disponiveis || []).map((schedule) => (
      schedule.id === horario.id ? { ...schedule, ...horario, disponivel } : schedule
    )),
  }
}

export function usePlayArenaApp() {
  const [session, setSession] = useState(getStoredSession)
  const [activeView, setActiveView] = useState('home')
  const [quadras, setQuadras] = useState(demoQuadras.map(normalizeCourt))
  const [reservas, setReservas] = useState([])
  const [ownerQuadras, setOwnerQuadras] = useState([])
  const [ownerReservas, setOwnerReservas] = useState([])
  const [adminData, setAdminData] = useState({})
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [reservationCourt, setReservationCourt] = useState(null)
  const [lastReservation, setLastReservation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast, setToast, showToast } = useToast()

  const navItems = session?.usuario?.perfil === 'admin'
    ? adminNav
    : session?.usuario?.perfil === 'proprietario'
      ? ownerNav
      : userNav

  function applyRoleData(data) {
    if (!data) {
      return
    }

    if (data.role === 'usuario') {
      setReservas(data.reservas)
    }

    if (data.role === 'proprietario') {
      setOwnerQuadras(data.ownerQuadras)
      setOwnerReservas(data.ownerReservas)
    }

    if (data.role === 'admin') {
      setAdminData(data.adminData)
    }
  }

  async function loadRoleData(currentSession = session) {
    try {
      const data = await fetchRoleData(currentSession)
      applyRoleData(data)
    } catch (error) {
      showToast(error.message)
    }
  }

  useEffect(() => {
    let active = true

    fetchQuadras()
      .then((data) => {
        if (active) {
          setQuadras(data)
        }
      })
      .catch(() => {
        if (active) {
          setQuadras(demoQuadras.map(normalizeCourt))
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (session) {
      fetchRoleData(session)
        .then((data) => {
          if (active) {
            applyRoleData(data)
          }
        })
        .catch((error) => {
          if (active) {
            showToast(error.message)
          }
        })
    }

    return () => {
      active = false
    }
  }, [session, showToast])

  function storeSession(payload) {
    persistSession(payload)
    setSession(payload)
    setActiveView(payload.usuario.perfil === 'usuario' ? 'home' : 'dashboard')
  }

  async function handleLogin(credentials) {
    setLoading(true)
    try {
      const response = await login(credentials)
      storeSession(response)
      showToast('Login realizado com sucesso.')
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(payload) {
    setLoading(true)
    try {
      const response = await registerAccount(payload)
      storeSession(response)
      showToast('Cadastro criado com sucesso.')
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    clearStoredSession()
    setSession(null)
    setReservas([])
    setOwnerReservas([])
    setOwnerQuadras([])
    setAdminData({})
    setActiveView('home')
  }

  function openCourt(quadra) {
    setSelectedCourt(quadra)
    setActiveView('detalhe')
  }

  async function handleReservation(payload) {
    const court = reservationCourt
    const horario = payload.horario

    if (!court || !horario) {
      showToast('Escolha um horario para reservar.')
      return
    }

    const reservaPayload = {
      quadra_id: court.id,
      horario_disponivel_id: String(horario.id).startsWith('demo') ? undefined : horario.id,
      data_reserva: payload.data_reserva,
      hora_inicio: horario.hora_inicio,
      hora_fim: horario.hora_fim,
      forma_pagamento: payload.forma_pagamento,
      observacoes: payload.observacoes,
    }

    try {
      let reserva

      if (String(court.id).startsWith('demo')) {
        reserva = {
          id: `demo-reserva-${Date.now()}`,
          ...reservaPayload,
          quadra: court,
          status: 'confirmada',
          valor_total: payload.valor_total,
        }
      } else {
        reserva = await createReservation(session.token, reservaPayload)
      }

      setReservas((current) => [reserva, ...current])
      setLastReservation(reserva)
      setReservationCourt(null)
      showToast('Reserva confirmada.')
      await loadRoleData()
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleCancelReservation(reserva, payload = {}) {
    try {
      let updatedReserva = { ...reserva, status: 'cancelada' }

      if (!String(reserva.id).startsWith('demo')) {
        updatedReserva = await cancelReservation(session.token, reserva.id, payload)
      }

      setReservas((current) => current.map((item) => (
        item.id === reserva.id ? { ...item, ...updatedReserva } : item
      )))
      showToast('Reserva cancelada.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleCreateCourt(form) {
    setLoading(true)
    try {
<<<<<<< Updated upstream
      const quadra = await createCourt(session.token, form)
      setOwnerQuadras((current) => [quadra, ...current])
      setQuadras((current) => [quadra, ...current])
      showToast('Quadra cadastrada.')
=======
      const result = await createCourt(session.token, form)
      const createdCourts = Array.isArray(result) ? result : [result]
      setOwnerQuadras((current) => [...createdCourts, ...current])
      setQuadras((current) => [...createdCourts, ...current])
      showToast(createdCourts.length > 1 ? `${createdCourts.length} quadras cadastradas com sucesso.` : 'Quadra cadastrada com sucesso.')
      return true
>>>>>>> Stashed changes
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSchedule(quadra, schedule) {
    try {
      const horario = await createSchedule(session.token, quadra, schedule)
      const alreadyExisted = (quadra.horarios_disponiveis || []).some((item) => (
        item.id === horario.id || scheduleKey(item) === scheduleKey(horario)
      ))

      setOwnerQuadras((current) => current.map((item) => (
        item.id === quadra.id
          ? mergeCourtSchedule(item, horario)
          : item
      )))
<<<<<<< Updated upstream
      showToast('Horario adicionado.')
=======
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id ? mergeCourtSchedule(item, horario) : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id ? mergeCourtSchedule(current, horario) : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id ? mergeCourtSchedule(current, horario) : current
      ))
      showToast(alreadyExisted ? 'Preco do horario atualizado.' : 'Horário adicionado.')
>>>>>>> Stashed changes
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleDeleteSchedule(quadra, horario) {
    try {
      await deleteSchedule(session.token, quadra.id, horario.id)
      setOwnerQuadras((current) => current.map((item) => (
        item.id === quadra.id ? removeCourtSchedule(item, horario) : item
      )))
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id ? removeCourtSchedule(item, horario) : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id ? removeCourtSchedule(current, horario) : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id ? removeCourtSchedule(current, horario) : current
      ))
      showToast('Horario removido.')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleUpdateScheduleAvailability(quadra, horario, disponivel) {
    try {
      const savedSchedule = await updateScheduleAvailability(session.token, quadra.id, horario.id, disponivel)
      const updatedSchedule = {
        ...horario,
        ...savedSchedule,
        disponivel,
      }

      setOwnerQuadras((current) => current.map((item) => (
        item.id === quadra.id ? setCourtScheduleAvailability(item, updatedSchedule, disponivel) : item
      )))
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id
          ? disponivel
            ? mergeCourtSchedule(item, updatedSchedule)
            : removeCourtSchedule(item, horario)
          : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id
          ? disponivel
            ? mergeCourtSchedule(current, updatedSchedule)
            : removeCourtSchedule(current, horario)
          : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id
          ? disponivel
            ? mergeCourtSchedule(current, updatedSchedule)
            : removeCourtSchedule(current, horario)
          : current
      ))
      showToast(disponivel ? 'Horario reativado.' : 'Horario inativado.')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleUpdateCourt(quadra, payload) {
    try {
      const updatedCourt = await updateCourt(session.token, quadra, payload)
      setOwnerQuadras((current) => current.map((item) => (
        item.id === quadra.id ? updatedCourt : item
      )))
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id ? updatedCourt : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id ? updatedCourt : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id ? updatedCourt : current
      ))
      showToast('Quadra atualizada.')
      return updatedCourt
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleDeleteCourt(quadra) {
    try {
      await deleteCourt(session.token, quadra.id)
      setOwnerQuadras((current) => current.filter((item) => item.id !== quadra.id))
      setQuadras((current) => current.filter((item) => item.id !== quadra.id))
      showToast('Anúncio excluído.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleStatusReservation(reserva, status, payload = {}) {
    try {
      let updatedReserva = { ...reserva, status }

      if (status === 'cancelada') {
        updatedReserva = await cancelReservation(session.token, reserva.id, payload)
      } else {
        updatedReserva = await updateReservationStatus(session.token, reserva.id, status)
      }
      setOwnerReservas((current) => current.map((item) => (
        item.id === reserva.id ? { ...item, ...updatedReserva } : item
      )))
      setAdminData((current) => ({
        ...current,
        reservas: (current.reservas || []).map((item) => (
          item.id === reserva.id ? { ...item, ...updatedReserva } : item
        )),
      }))
      showToast(status === 'cancelada' ? 'Reserva cancelada.' : 'Reserva atualizada.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleUserStatus(account, status) {
    try {
      await updateUserStatus(session.token, account.id, status)
      setAdminData((current) => ({
        ...current,
        usuarios: (current.usuarios || []).map((item) => (
          item.id === account.id ? { ...item, status } : item
        )),
      }))
      showToast('Usuario atualizado.')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleOwnerApproval(account, statusAprovacao) {
    try {
      await updateOwnerApproval(session.token, account.id, statusAprovacao)
      setAdminData((current) => ({
        ...current,
        proprietarios: (current.proprietarios || []).map((item) => (
          item.id === account.id ? { ...item, status_aprovacao: statusAprovacao } : item
        )),
      }))
      showToast('Proprietario atualizado.')
    } catch (error) {
      showToast(error.message)
    }
  }

  return {
    activeView,
    adminData,
    handleCancelReservation,
    handleCreateCourt,
    handleCreateSchedule,
    handleDeleteSchedule,
    handleDeleteCourt,
    handleLogin,
    handleLogout,
    handleOwnerApproval,
    handleRegister,
    handleReservation,
    handleStatusReservation,
<<<<<<< Updated upstream
=======
    handleUpdateCourt,
    handleUpdateProfile,
    handleUpdateScheduleAvailability,
>>>>>>> Stashed changes
    handleUserStatus,
    lastReservation,
    loading,
    navItems,
    openCourt,
    ownerQuadras,
    ownerReservas,
    quadras,
    reservationCourt,
    reservas,
    searchQuery,
    selectedCourt,
    session,
    setActiveView,
    setLastReservation,
    setReservationCourt,
    setSearchQuery,
    setToast,
    toast,
  }
}
