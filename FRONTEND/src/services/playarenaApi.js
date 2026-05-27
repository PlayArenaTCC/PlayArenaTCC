import { demoQuadras, fallbackCourtImage } from '../data/demoData'
import { normalizeCourt } from '../utils/formatters'
import { apiRequest } from './httpClient'

export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function registerAccount(payload) {
  const path = payload.perfil === 'proprietario' ? '/auth/register/proprietario' : '/auth/register'

  return apiRequest(path, {
    method: 'POST',
    body: payload,
  })
}

export async function fetchQuadras() {
  const response = await apiRequest('/quadras')
  const apiQuadras = (response.quadras || []).map(normalizeCourt)
  return apiQuadras.length ? apiQuadras : demoQuadras.map(normalizeCourt)
}

export async function fetchCourtSchedules(quadraId, data, token) {
  return apiRequest(`/quadras/${quadraId}/horarios?data=${data}`, { token })
}

export async function fetchRoleData(currentSession) {
  if (!currentSession?.token) {
    return null
  }

  if (currentSession.usuario.perfil === 'usuario') {
    const response = await apiRequest('/reservas/minhas', { token: currentSession.token })
    return { role: 'usuario', reservas: response.reservas || [] }
  }

  if (currentSession.usuario.perfil === 'proprietario') {
    const [quadrasResponse, reservasResponse] = await Promise.all([
      apiRequest('/quadras/minhas', { token: currentSession.token }),
      apiRequest('/reservas/proprietario', { token: currentSession.token }),
    ])

    return {
      role: 'proprietario',
      ownerQuadras: (quadrasResponse.quadras || []).map(normalizeCourt),
      ownerReservas: reservasResponse.reservas || [],
    }
  }

  if (currentSession.usuario.perfil === 'admin') {
    const [dashboard, usuarios, proprietarios, quadrasResponse, reservasResponse] = await Promise.all([
      apiRequest('/admin/dashboard', { token: currentSession.token }),
      apiRequest('/admin/usuarios', { token: currentSession.token }),
      apiRequest('/admin/proprietarios', { token: currentSession.token }),
      apiRequest('/quadras?incluir_inativas=true', { token: currentSession.token }),
      apiRequest('/reservas/todas', { token: currentSession.token }),
    ])

    return {
      role: 'admin',
      adminData: {
        indicadores: dashboard.indicadores,
        usuarios: usuarios.usuarios || [],
        proprietarios: proprietarios.proprietarios || [],
        quadras: (quadrasResponse.quadras || []).map(normalizeCourt),
        reservas: reservasResponse.reservas || [],
      },
    }
  }

  return null
}

export async function createReservation(token, payload) {
  const response = await apiRequest('/reservas', {
    method: 'POST',
    token,
    body: payload,
  })

  return response.reserva
}

export async function cancelReservation(token, reservaId) {
  return apiRequest(`/reservas/${reservaId}/cancelar`, {
    method: 'PATCH',
    token,
  })
}

export async function createCourt(token, form) {
  const payload = {
    ...form,
    imagem_url: form.imagem_url || fallbackCourtImage,
    preco_hora: Number(form.preco_hora || 0),
  }
  const response = await apiRequest('/quadras', {
    method: 'POST',
    token,
    body: payload,
  })

  return normalizeCourt(response.quadra)
}

export async function createSchedule(token, quadra, schedule) {
  const response = await apiRequest(`/quadras/${quadra.id}/horarios`, {
    method: 'POST',
    token,
    body: {
      ...schedule,
      dia_semana: Number(schedule.dia_semana),
      valor: Number(schedule.valor || quadra.preco_hora || 0),
    },
  })

  return response.horario
}

export async function updateReservationStatus(token, reservaId, status) {
  return apiRequest(`/reservas/${reservaId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export async function updateUserStatus(token, userId, status) {
  return apiRequest(`/admin/usuarios/${userId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export async function updateOwnerApproval(token, ownerId, statusAprovacao) {
  return apiRequest(`/admin/proprietarios/${ownerId}/aprovacao`, {
    method: 'PATCH',
    token,
    body: { status_aprovacao: statusAprovacao },
  })
}
