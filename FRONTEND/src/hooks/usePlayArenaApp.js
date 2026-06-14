import { useEffect, useState } from 'react'
import { adminNav, ownerNav, userNav } from '../data/navigation'
import { demoQuadras } from '../data/demoData'
import {
  cancelReservation,
  createCourt,
  createReservation,
  createSchedule,
  fetchQuadras,
  fetchRoleData,
  login,
  registerAccount,
  updateOwnerApproval,
  updateReservationStatus,
  updateUserStatus,
} from '../services/playarenaApi'
import { normalizeCourt } from '../utils/formatters'
import { clearStoredSession, getStoredSession, persistSession } from '../utils/sessionStorage'
import { useToast } from './useToast'

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

  async function handleCancelReservation(reserva) {
    try {
      if (!String(reserva.id).startsWith('demo')) {
        await cancelReservation(session.token, reserva.id)
      }

      setReservas((current) => current.map((item) => (
        item.id === reserva.id ? { ...item, status: 'cancelada' } : item
      )))
      showToast('Reserva cancelada.')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleCreateCourt(form) {
    setLoading(true)
    try {
      const quadra = await createCourt(session.token, form)
      setOwnerQuadras((current) => [quadra, ...current])
      setQuadras((current) => [quadra, ...current])
      showToast('Quadra cadastrada.')
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSchedule(quadra, schedule) {
    try {
      const horario = await createSchedule(session.token, quadra, schedule)
      setOwnerQuadras((current) => current.map((item) => (
        item.id === quadra.id
          ? { ...item, horarios_disponiveis: [...(item.horarios_disponiveis || []), horario] }
          : item
      )))
      showToast('Horario adicionado.')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handleStatusReservation(reserva, status) {
    try {
      await updateReservationStatus(session.token, reserva.id, status)
      setOwnerReservas((current) => current.map((item) => (
        item.id === reserva.id ? { ...item, status } : item
      )))
      setAdminData((current) => ({
        ...current,
        reservas: (current.reservas || []).map((item) => (
          item.id === reserva.id ? { ...item, status } : item
        )),
      }))
      showToast('Reserva atualizada.')
    } catch (error) {
      showToast(error.message)
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
    handleLogin,
    handleLogout,
    handleOwnerApproval,
    handleRegister,
    handleReservation,
    handleStatusReservation,
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
