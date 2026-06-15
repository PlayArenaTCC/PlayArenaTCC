import { useCallback, useEffect, useRef, useState } from 'react'
import { adminNav, ownerNav, userNav } from '../data/navigation'
import {
  banUser,
  blockUserTemporarily,
  cancelReservation,
  changeAdminPassword,
  clearAdminSpaceDeactivation,
  clearUserTemporaryBlock,
  confirmRegistrationCode,
  createAdmin,
  createAdminSpace,
  createCourt,
  createReservation,
  createSchedule,
  deleteManagedAccount,
  deleteAccount,
  deleteAdminSpace,
  deleteCourt,
  deleteSchedule,
  fetchNotifications,
  fetchQuadras,
  fetchRoleData,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  registerAccount,
  reviewDocumentation,
  requestPasswordReset,
  resetPassword,
  resendRegistrationCode,
  verifyPasswordResetCode,
  updateOwnerApproval,
  updateAdminSpace,
  updateAdminAlertStatus,
  updateCourt,
  updateProfile,
  updateReservationStatus,
  updateScheduleAvailability,
  unbanUser,
  validateReservationCode,
  deactivateAdminSpace,
} from '../services/playarenaApi'
import { ACCOUNT_ACCESS_EVENT, DATA_CHANGED_EVENT, subscribeToServerDataChanges } from '../services/httpClient'
import { sortReservations } from '../utils/formatters'
import { clearStoredSession, getStoredSession, persistSession } from '../utils/sessionStorage'
import { useToast } from './useToast'

const FALLBACK_REFRESH_INTERVAL_MS = 15000

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

function syncCourtReference(current, courts) {
  if (!current) {
    return current
  }

  return courts.find((court) => court.id === current.id) || null
}

function buildDemoReservationCode() {
  return `DEMO${String(Date.now()).slice(-2)}`
}

function normalizeReservationCode(value) {
  return String(value || '').trim().replace(/[\s-]/g, '').toUpperCase()
}

export function usePlayArenaApp() {
  const [session, setSession] = useState(getStoredSession)
  const [activeView, setActiveView] = useState('home')
  const [quadras, setQuadras] = useState([])
  const [reservas, setReservas] = useState([])
  const [ownerQuadras, setOwnerQuadras] = useState([])
  const [ownerReservas, setOwnerReservas] = useState([])
  const [ownerDocumentacoes, setOwnerDocumentacoes] = useState([])
  const [adminData, setAdminData] = useState({})
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [reservationCourt, setReservationCourt] = useState(null)
  const [lastReservation, setLastReservation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const sessionTokenRef = useRef(session?.token)
  const forcedLogoutTimerRef = useRef(null)
  const { toast, setToast, showToast } = useToast()

  const navItems = session?.usuario?.perfil === 'admin'
    ? adminNav.filter((item) => item.id !== 'administradores' || session.usuario.nivel_acesso === 'super_admin')
    : session?.usuario?.perfil === 'proprietario'
      ? ownerNav
      : userNav

  useEffect(() => {
    sessionTokenRef.current = session?.token
  }, [session?.token])

  useEffect(() => () => {
    window.clearTimeout(forcedLogoutTimerRef.current)
  }, [])

  useEffect(() => {
    function handleAccountAccessChanged(event) {
      const detail = event.detail || {}
      const currentUser = session?.usuario

      if (!currentUser || detail.perfil !== currentUser.perfil || String(detail.accountId) !== String(currentUser.id)) {
        return
      }

      showToast(detail.message || 'Sua conta foi bloqueada. Você será desconectado agora.')
      window.clearTimeout(forcedLogoutTimerRef.current)
      forcedLogoutTimerRef.current = window.setTimeout(() => {
        sessionTokenRef.current = undefined
        clearStoredSession()
        setSession(null)
        setReservas([])
        setOwnerReservas([])
        setOwnerQuadras([])
        setOwnerDocumentacoes([])
        setAdminData({})
        setNotifications([])
        setNotificationUnreadCount(0)
        setActiveView('home')
      }, 2400)
    }

    window.addEventListener(ACCOUNT_ACCESS_EVENT, handleAccountAccessChanged)

    return () => {
      window.removeEventListener(ACCOUNT_ACCESS_EVENT, handleAccountAccessChanged)
    }
  }, [session, showToast])

  const syncStoredUser = useCallback((usuario) => {
    if (!usuario) {
      return
    }

    setSession((current) => {
      if (!current || current.usuario?.perfil !== usuario.perfil) {
        return current
      }

      if (JSON.stringify(current.usuario) === JSON.stringify(usuario)) {
        return current
      }

      const nextSession = { ...current, usuario }
      persistSession(nextSession)
      return nextSession
    })
  }, [])

  const applyRoleData = useCallback((data) => {
    if (!data) {
      return
    }

    syncStoredUser(data.usuario)

    if (data.role === 'usuario') {
      setReservas(sortReservations(data.reservas))
    }

    if (data.role === 'proprietario') {
      setOwnerQuadras(data.ownerQuadras)
      setOwnerReservas(sortReservations(data.ownerReservas))
      setOwnerDocumentacoes(data.ownerDocumentacoes || [])
    }

    if (data.role === 'admin') {
      setAdminData(data.adminData)
    }
  }, [syncStoredUser])

  const loadPublicCourts = useCallback(async () => {
    try {
      const data = await fetchQuadras()
      setQuadras(data)
      setSelectedCourt((current) => syncCourtReference(current, data))
      setReservationCourt((current) => syncCourtReference(current, data))
    } catch {
      void 0
    }
  }, [])

  const loadRoleData = useCallback(async (currentSession = session, { silent = false } = {}) => {
    if (!currentSession) {
      return
    }

    try {
      const data = await fetchRoleData(currentSession)

      if (sessionTokenRef.current !== currentSession.token) {
        return
      }

      applyRoleData(data)
    } catch (error) {
      if (!silent) {
        showToast(error.message)
      }
    }
  }, [applyRoleData, session, showToast])

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!['usuario', 'proprietario'].includes(session?.usuario?.perfil)) {
      return
    }

    const token = session.token

    if (!silent) {
      setNotificationsLoading(true)
    }

    try {
      const response = await fetchNotifications(token)

      if (sessionTokenRef.current !== token) {
        return
      }

      setNotifications(response.notifications || [])
      setNotificationUnreadCount(Number(response.unreadCount || 0))
    } catch (error) {
      if (!silent) {
        showToast(error.message)
      }
    } finally {
      if (!silent) {
        setNotificationsLoading(false)
      }
    }
  }, [session, showToast])

  const refreshAppData = useCallback(async ({ silent = true } = {}) => {
    await Promise.all([
      loadPublicCourts(),
      session ? loadRoleData(session, { silent }) : Promise.resolve(),
      ['usuario', 'proprietario'].includes(session?.usuario?.perfil) ? loadNotifications({ silent }) : Promise.resolve(),
    ])
  }, [loadNotifications, loadPublicCourts, loadRoleData, session])

  useEffect(() => {
    function refreshSilently() {
      refreshAppData({ silent: true })
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        refreshSilently()
      }
    }

    const initialLoadId = window.setTimeout(() => {
      refreshAppData({ silent: false })
    }, 0)
    const intervalId = window.setInterval(() => {
      refreshSilently()
    }, FALLBACK_REFRESH_INTERVAL_MS)
    const unsubscribeServerEvents = subscribeToServerDataChanges()

    window.addEventListener(DATA_CHANGED_EVENT, refreshSilently)
    window.addEventListener('focus', refreshSilently)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.clearTimeout(initialLoadId)
      window.clearInterval(intervalId)
      unsubscribeServerEvents()
      window.removeEventListener(DATA_CHANGED_EVENT, refreshSilently)
      window.removeEventListener('focus', refreshSilently)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refreshAppData])

  function storeSession(payload) {
    sessionTokenRef.current = payload.token
    persistSession(payload)
    setSession(payload)
    setNotifications([])
    setNotificationUnreadCount(0)
    setActiveView(payload.usuario.perfil === 'usuario' ? 'home' : 'dashboard')
  }

  function updateStoredUser(usuario) {
    syncStoredUser(usuario)
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
      showToast(response.message || 'Código enviado por e-mail.')
      return response
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmRegistration(payload) {
    setLoading(true)
    try {
      const response = await confirmRegistrationCode(payload)
      showToast(response.message || 'E-mail validado com sucesso. Agora faça login.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestPasswordReset(payload) {
    setLoading(true)
    try {
      const response = await requestPasswordReset(payload)
      showToast(response.message || 'Código de recuperação enviado por e-mail.')
      return response
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyPasswordResetCode(payload) {
    setLoading(true)
    try {
      const response = await verifyPasswordResetCode(payload)
      showToast(response.message || 'Código validado.')
      return response
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(payload) {
    setLoading(true)
    try {
      const response = await resetPassword(payload)
      showToast(response.message || 'Senha atualizada com sucesso.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeAdminPassword(payload) {
    setLoading(true)
    try {
      const response = await changeAdminPassword(session.token, payload)
      showToast(response.message || 'Senha atualizada com sucesso.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAdmin(payload) {
    setLoading(true)
    try {
      const response = await createAdmin(session.token, payload)
      const administrador = response.administrador

      if (administrador) {
        setAdminData((current) => ({
          ...current,
          administradores: [
            administrador,
            ...(current.administradores || []).filter((item) => item.id !== administrador.id),
          ],
        }))
      }

      showToast(response.message || 'Administrador cadastrado com sucesso.')
      return administrador || true
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleResendRegistrationCode(payload) {
    setLoading(true)
    try {
      const response = await resendRegistrationCode(payload)
      showToast(response.message || 'Código reenviado por e-mail.')
      return response
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateProfile(payload) {
    setLoading(true)
    try {
      const usuario = await updateProfile(session.token, payload)
      updateStoredUser(usuario)
      showToast('Perfil atualizado.')
      return usuario
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setLoading(true)
    try {
      await deleteAccount(session.token)
      sessionTokenRef.current = undefined
      clearStoredSession()
      setSession(null)
      setReservas([])
      setOwnerReservas([])
      setOwnerQuadras([])
      setOwnerDocumentacoes([])
      setAdminData({})
      setNotifications([])
      setNotificationUnreadCount(0)
      setActiveView('home')
      showToast('Conta excluida com sucesso.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    sessionTokenRef.current = undefined
    clearStoredSession()
    setSession(null)
    setReservas([])
    setOwnerReservas([])
    setOwnerQuadras([])
    setOwnerDocumentacoes([])
    setAdminData({})
    setNotifications([])
    setNotificationUnreadCount(0)
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
      showToast('Escolha um horário para reservar.')
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
          codigo_reserva: buildDemoReservationCode(),
          status_validacao: 'pendente',
          valor_total: payload.valor_total,
        }
      } else {
        reserva = await createReservation(session.token, reservaPayload)
      }

      setReservas((current) => sortReservations([reserva, ...current]))
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

      setReservas((current) => sortReservations(current.map((item) => (
        item.id === reserva.id ? { ...item, ...updatedReserva } : item
      ))))
      showToast('Reserva cancelada.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleMarkNotificationRead(notification) {
    if (!notification || notification.isRead) {
      return true
    }

    try {
      const response = await markNotificationRead(session.token, notification.id)
      const updatedNotification = response.notification

      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, ...updatedNotification } : item
      )))
      setNotificationUnreadCount((current) => Math.max(current - 1, 0))
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      const response = await markAllNotificationsRead(session.token)
      setNotifications(response.notifications || [])
      setNotificationUnreadCount(Number(response.unreadCount || 0))
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleCreateCourt(form) {
    setLoading(true)
    try {
      const result = await createCourt(session.token, form)
      const createdCourts = Array.isArray(result) ? result : [result]
      setOwnerQuadras((current) => [...createdCourts, ...current])
      const publicCourts = createdCourts.filter((court) => (
        court.ativa !== false && court.documentacao_local?.status === 'aprovado'
      ))
      setQuadras((current) => [...publicCourts, ...current])
      const waitingReview = createdCourts.some((court) => court.documentacao_local?.status !== 'aprovado')
      showToast(
        waitingReview
          ? 'Espaço enviado para análise documental.'
          : createdCourts.length > 1
            ? `${createdCourts.length} quadras cadastradas com sucesso.`
            : 'Quadra cadastrada com sucesso.',
      )
      await loadRoleData()
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateAdminSpace(form) {
    setLoading(true)
    try {
      const response = await createAdminSpace(session.token, form)
      const espaco = response.espaco
      setAdminData((current) => ({
        ...current,
        quadras: [espaco, ...(current.quadras || []).filter((item) => item.id !== espaco.id)],
      }))
      await loadPublicCourts()
      showToast(response.message || 'Espaço cadastrado com sucesso.')
      return espaco
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateAdminSpace(quadra, form) {
    setLoading(true)
    try {
      const response = await updateAdminSpace(session.token, quadra.id, form)
      const espaco = response.espaco
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => item.id === espaco.id ? espaco : item),
      }))
      await loadPublicCourts()
      showToast(response.message || 'Espaço atualizado com sucesso.')
      return espaco
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivateAdminSpace(quadra, payload) {
    setLoading(true)
    try {
      const response = await deactivateAdminSpace(session.token, quadra.id, payload)
      const espaco = response.espaco
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => item.id === espaco.id ? espaco : item),
      }))
      await loadPublicCourts()
      showToast(response.message || 'Período de desativação salvo.')
      return espaco
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleClearAdminSpaceDeactivation(quadra) {
    setLoading(true)
    try {
      const response = await clearAdminSpaceDeactivation(session.token, quadra.id)
      const espaco = response.espaco
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => item.id === espaco.id ? espaco : item),
      }))
      await loadPublicCourts()
      showToast(response.message || 'Desativação removida.')
      return espaco
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteAdminSpace(quadra) {
    setLoading(true)
    try {
      const response = await deleteAdminSpace(session.token, quadra.id)
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).filter((item) => item.id !== quadra.id),
      }))
      setQuadras((current) => current.filter((item) => item.id !== quadra.id))
      showToast(response.message || 'Espaço excluído permanentemente.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
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
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => (
          item.id === quadra.id ? mergeCourtSchedule(item, horario) : item
        )),
      }))
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id ? mergeCourtSchedule(item, horario) : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id ? mergeCourtSchedule(current, horario) : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id ? mergeCourtSchedule(current, horario) : current
      ))
      showToast(alreadyExisted ? 'Preço do horário atualizado.' : 'Horário adicionado.')
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
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => (
          item.id === quadra.id ? removeCourtSchedule(item, horario) : item
        )),
      }))
      setQuadras((current) => current.map((item) => (
        item.id === quadra.id ? removeCourtSchedule(item, horario) : item
      )))
      setSelectedCourt((current) => (
        current?.id === quadra.id ? removeCourtSchedule(current, horario) : current
      ))
      setReservationCourt((current) => (
        current?.id === quadra.id ? removeCourtSchedule(current, horario) : current
      ))
      showToast('Horário removido.')
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
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => (
          item.id === quadra.id ? setCourtScheduleAvailability(item, updatedSchedule, disponivel) : item
        )),
      }))
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
      showToast(disponivel ? 'Horário reativado.' : 'Horário inativado.')
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
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).map((item) => (
          item.id === quadra.id ? updatedCourt : item
        )),
      }))
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
      setAdminData((current) => ({
        ...current,
        quadras: (current.quadras || []).filter((item) => item.id !== quadra.id),
      }))
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
      setOwnerReservas((current) => sortReservations(current.map((item) => (
        item.id === reserva.id ? { ...item, ...updatedReserva } : item
      ))))
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

  async function handleValidateReservationCode(reserva, codigo) {
    try {
      let updatedReserva = {
        ...reserva,
        status: 'concluida',
        status_validacao: 'validada',
        validado_em: new Date().toISOString(),
      }

      if (String(reserva.id).startsWith('demo')) {
        if (normalizeReservationCode(codigo) !== normalizeReservationCode(reserva.codigo_reserva)) {
          showToast('Código da reserva incorreto.')
          return false
        }
      } else {
        updatedReserva = await validateReservationCode(session.token, reserva.id, codigo)
      }

      setOwnerReservas((current) => sortReservations(current.map((item) => (
        item.id === reserva.id ? { ...item, ...updatedReserva } : item
      ))))
      setAdminData((current) => ({
        ...current,
        reservas: (current.reservas || []).map((item) => (
          item.id === reserva.id ? { ...item, ...updatedReserva } : item
        )),
      }))
      showToast('Código validado. Reserva concluída.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  async function handleBlockUserTemporarily(account, payload) {
    setLoading(true)
    try {
      const response = await blockUserTemporarily(session.token, account, payload)
      const updatedAccount = response.proprietario || response.usuario
      const collection = account.tipo_conta === 'proprietario' ? 'proprietarios' : 'usuarios'
      setAdminData((current) => ({
        ...current,
        [collection]: (current[collection] || []).map((item) => (
          item.id === account.id ? updatedAccount : item
        )),
      }))
      showToast(response.message || 'Bloqueio temporário salvo com sucesso.')
      return updatedAccount
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleClearUserTemporaryBlock(account) {
    setLoading(true)
    try {
      const response = await clearUserTemporaryBlock(session.token, account)
      const updatedAccount = response.proprietario || response.usuario
      const collection = account.tipo_conta === 'proprietario' ? 'proprietarios' : 'usuarios'
      setAdminData((current) => ({
        ...current,
        [collection]: (current[collection] || []).map((item) => (
          item.id === account.id ? updatedAccount : item
        )),
      }))
      showToast(response.message || 'Bloqueio temporário removido.')
      return updatedAccount
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleBanUser(account, motivo) {
    setLoading(true)
    try {
      const response = await banUser(session.token, account, motivo)
      const updatedAccount = response.proprietario || response.usuario
      const collection = account.tipo_conta === 'proprietario' ? 'proprietarios' : 'usuarios'
      setAdminData((current) => ({
        ...current,
        [collection]: (current[collection] || []).map((item) => (
          item.id === account.id ? updatedAccount : item
        )),
        ...(account.tipo_conta === 'proprietario'
          ? {
            quadras: (current.quadras || []).map((quadra) => (
              quadra.proprietario_id === account.id ? { ...quadra, ativa: false } : quadra
            )),
          }
          : {}),
      }))
      if (account.tipo_conta === 'proprietario') {
        await loadPublicCourts()
      }
      showToast(response.message || 'Conta banida permanentemente.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleUnbanUser(account) {
    setLoading(true)
    try {
      const response = await unbanUser(session.token, account)
      const updatedAccount = response.proprietario || response.usuario
      const collection = account.tipo_conta === 'proprietario' ? 'proprietarios' : 'usuarios'
      setAdminData((current) => ({
        ...current,
        [collection]: (current[collection] || []).map((item) => (
          item.id === account.id ? updatedAccount : item
        )),
      }))
      showToast(response.message || 'Conta desbanida com sucesso.')
      return updatedAccount
    } catch (error) {
      showToast(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteManagedAccount(account, motivo) {
    setLoading(true)
    try {
      const response = await deleteManagedAccount(session.token, account, motivo)
      const collection = account.tipo_conta === 'proprietario' ? 'proprietarios' : 'usuarios'
      setAdminData((current) => ({
        ...current,
        indicadores: {
          ...(current.indicadores || {}),
          ...(account.tipo_conta === 'proprietario'
            ? { totalProprietarios: Math.max(Number(current.indicadores?.totalProprietarios || 0) - 1, 0) }
            : { totalUsuarios: Math.max(Number(current.indicadores?.totalUsuarios || 0) - 1, 0) }),
        },
        [collection]: (current[collection] || []).filter((item) => item.id !== account.id),
        ...(account.tipo_conta === 'proprietario'
          ? {
            quadras: (current.quadras || []).filter((quadra) => quadra.proprietario_id !== account.id),
            reservas: (current.reservas || []).filter((reserva) => reserva.quadra?.proprietario_id !== account.id),
          }
          : {
            reservas: (current.reservas || []).filter((reserva) => reserva.usuario_id !== account.id),
          }),
      }))
      if (account.tipo_conta === 'proprietario') {
        await loadPublicCourts()
      }
      showToast(response.message || 'Conta excluida e credenciais bloqueadas.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleOwnerApproval(account, statusAprovacao) {
    const previousStatus = account.status_aprovacao || 'pendente'
    const updateOwnerInState = (ownerPatch) => {
      setAdminData((current) => ({
        ...current,
        proprietarios: (current.proprietarios || []).map((item) => (
          item.id === account.id ? { ...item, ...ownerPatch } : item
        )),
      }))
    }

    updateOwnerInState({ status_aprovacao: statusAprovacao })

    try {
      const response = await updateOwnerApproval(session.token, account.id, statusAprovacao)
      const updatedOwner = response.proprietario || {}
      updateOwnerInState({
        ...updatedOwner,
        status_aprovacao: updatedOwner.status_aprovacao || statusAprovacao,
      })
      showToast('Proprietário atualizado.')
    } catch (error) {
      updateOwnerInState({ status_aprovacao: previousStatus })
      showToast(error.message)
    }
  }

  async function handleUpdateAdminAlertStatus(alert, status) {
    try {
      const updatedAlert = await updateAdminAlertStatus(session.token, alert.id, status)
      setAdminData((current) => ({
        ...current,
        avisos: (current.avisos || []).map((item) => (
          item.id === updatedAlert.id ? updatedAlert : item
        )),
      }))
      showToast(status === 'RESOLVIDO' ? 'Aviso marcado como resolvido.' : 'Aviso atualizado.')
      return updatedAlert
    } catch (error) {
      showToast(error.message)
      return null
    }
  }

  async function handleReviewDocumentation(documentacao, status, motivo_reprovacao = '') {
    try {
      const updatedDocumentation = await reviewDocumentation(session.token, documentacao.id, {
        status,
        motivo_reprovacao,
      })
      const persistedStatus = updatedDocumentation.status

      setAdminData((current) => ({
        ...current,
        documentacoes: (current.documentacoes || []).map((item) => (
          item.id === documentacao.id ? updatedDocumentation : item
        )),
        quadras: (current.quadras || []).map((quadra) => (
          quadra.documentacao_local_id === documentacao.id
            ? { ...quadra, ativa: persistedStatus === 'aprovado', documentacao_local: updatedDocumentation }
            : quadra
        )),
      }))
      await Promise.all([
        loadRoleData(session, { silent: true }),
        loadPublicCourts(),
      ])
      showToast(persistedStatus === 'aprovado' ? 'Documentação aprovada.' : 'Documentação reprovada.')
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  return {
    activeView,
    adminData,
    handleBanUser,
    handleBlockUserTemporarily,
    handleCancelReservation,
    handleChangeAdminPassword,
    handleClearAdminSpaceDeactivation,
    handleClearUserTemporaryBlock,
    handleConfirmRegistration,
    handleCreateAdmin,
    handleCreateAdminSpace,
    handleCreateCourt,
    handleCreateSchedule,
    handleDeleteAccount,
    handleDeleteAdminSpace,
    handleDeleteManagedAccount,
    handleDeleteSchedule,
    handleDeleteCourt,
    handleLogin,
    handleLogout,
    handleMarkAllNotificationsRead,
    handleMarkNotificationRead,
    handleOwnerApproval,
    handleRegister,
    handleReviewDocumentation,
    handleResendRegistrationCode,
    handleRequestPasswordReset,
    handleResetPassword,
    handleReservation,
    handleStatusReservation,
    handleDeactivateAdminSpace,
    handleUpdateAdminSpace,
    handleUpdateAdminAlertStatus,
    handleUpdateCourt,
    handleUpdateProfile,
    handleUpdateScheduleAvailability,
    handleUnbanUser,
    handleValidateReservationCode,
    handleVerifyPasswordResetCode,
    lastReservation,
    loading,
    loadNotifications,
    navItems,
    notifications,
    notificationsLoading,
    notificationUnreadCount,
    openCourt,
    ownerQuadras,
    ownerDocumentacoes,
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
