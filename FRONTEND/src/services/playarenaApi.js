import { demoQuadras, fallbackCourtImage } from '../data/demoData'
import { normalizeCourt } from '../utils/formatters'
import { apiRequest } from './httpClient'

export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function requestPasswordReset(payload) {
  return apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: payload,
  })
}

export async function verifyPasswordResetCode(payload) {
  return apiRequest('/auth/password/verify', {
    method: 'POST',
    body: payload,
  })
}

export async function resetPassword(payload) {
  return apiRequest('/auth/password/reset', {
    method: 'POST',
    body: payload,
  })
}

export async function registerAccount(payload) {
  const path = payload.perfil === 'proprietario' ? '/auth/register/proprietario' : '/auth/register'

  return apiRequest(path, {
    method: 'POST',
    body: payload,
  })
}

export async function confirmRegistrationCode(payload) {
  return apiRequest('/auth/register/confirm', {
    method: 'POST',
    body: payload,
  })
}

export async function resendRegistrationCode(payload) {
  return apiRequest('/auth/register/resend', {
    method: 'POST',
    body: payload,
  })
}

export async function updateProfile(token, payload) {
  const body = new FormData()
  body.append('telefone', payload.telefone || '')

  if (payload.foto_perfil) {
    body.append('foto_perfil', payload.foto_perfil)
  }

  const response = await apiRequest('/auth/profile', {
    method: 'PATCH',
    token,
    body,
  })

  return response.usuario
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

function buildCourtPayloads(form) {
  if (!Array.isArray(form.campos) || !form.campos.length) {
    return [{
      ...form,
      imagem_url: form.imagem_url || fallbackCourtImage,
      preco_hora: Number(form.preco_hora || 0),
    }]
  }

  const baseName = String(form.nome || '').trim()

  return form.campos.map((campo, index) => {
    const photos = Array.isArray(campo.fotos)
      ? campo.fotos.map((foto) => String(foto || '').trim()).filter(Boolean)
      : []
    const campoName = String(campo.nome || `Campo ${index + 1}`).trim()
    const nome = form.campos.length > 1 || (campoName && campoName !== 'Campo 1')
      ? `${baseName} - ${campoName}`
      : baseName

    return {
      nome,
      descricao: form.descricao,
      modalidade: form.modalidade,
      endereco: form.endereco,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado || 'PR',
      preco_hora: Number(campo.preco_hora || 0),
      imagem_url: campo.imagem_url || photos[0] || fallbackCourtImage,
      fotos: photos,
      horarios_funcionamento: campo.horarios_funcionamento || [],
      amenities: campo.amenities || [],
    }
  })
}

export async function createCourt(token, form) {
  const payloads = buildCourtPayloads(form)
  const quadras = []

  for (const payload of payloads) {
    const response = await apiRequest('/quadras', {
      method: 'POST',
      token,
      body: payload,
    })

    quadras.push(normalizeCourt(response.quadra))
  }

  return quadras.length === 1 ? quadras[0] : quadras
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
