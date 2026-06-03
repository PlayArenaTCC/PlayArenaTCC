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

export async function cancelReservation(token, reservaId, payload = {}) {
  const response = await apiRequest(`/reservas/${reservaId}/cancelar`, {
    method: 'PATCH',
    token,
    body: payload,
  })

  return response.reserva
}

<<<<<<< Updated upstream
export async function createCourt(token, form) {
  const payload = {
    ...form,
    imagem_url: form.imagem_url || fallbackCourtImage,
    preco_hora: Number(form.preco_hora || 0),
=======
function isUploadFile(value) {
  return typeof File !== 'undefined' && value instanceof File
}

async function uploadCourtPhotos(token, files) {
  const uploadFiles = files.filter(isUploadFile)

  if (!uploadFiles.length) {
    return []
  }

  const body = new FormData()
  uploadFiles.forEach((file) => {
    body.append('fotos', file)
  })

  const response = await apiRequest('/quadras/fotos', {
    method: 'POST',
    token,
    body,
  })

  return response.fotos || []
}

async function buildCourtPayloads(token, form) {
  const quantidadeCampos = Math.min(Math.max(Number(form.quantidade_campos || form.campos?.length || 1), 1), 12)

  if (!Array.isArray(form.campos) || !form.campos.length) {
    return [{
      ...form,
      imagem_url: form.imagem_url || fallbackCourtImage,
      preco_hora: Number(form.preco_hora || 0),
    }]
  }

  const baseName = String(form.nome || '').trim()
  const campos = form.campos.slice(0, quantidadeCampos)
  const payloads = []

  for (const [index, campo] of campos.entries()) {
    const photos = Array.isArray(campo.fotos) ? await uploadCourtPhotos(token, campo.fotos) : []
    const campoName = String(campo.nome || `Campo ${index + 1}`).trim()
    const nome = campos.length > 1 || (campoName && campoName !== 'Campo 1')
      ? `${baseName} - ${campoName}`
      : baseName

    payloads.push({
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
      horarios_disponiveis: campo.horarios_disponiveis || [],
      amenities: campo.amenities || [],
    })
  }

  return payloads
}

export async function createCourt(token, form) {
  const payloads = await buildCourtPayloads(token, form)
  const quadras = []

  for (const payload of payloads) {
    const response = await apiRequest('/quadras', {
      method: 'POST',
      token,
      body: payload,
    })

    quadras.push(normalizeCourt(response.quadra))
>>>>>>> Stashed changes
  }
  const response = await apiRequest('/quadras', {
    method: 'POST',
    token,
    body: payload,
  })

  return normalizeCourt(response.quadra)
}

export async function updateCourt(token, quadra, payload) {
  const uploadedPhotos = Array.isArray(payload.fotos) ? await uploadCourtPhotos(token, payload.fotos) : []
  const amenities = (payload.amenities || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, list) => (
      list.findIndex((current) => current.toLowerCase() === item.toLowerCase()) === index
    ))
  const body = {
    preco_hora: Number(payload.preco_hora || quadra.preco_hora || 0),
    amenities,
  }

  if (uploadedPhotos.length) {
    body.fotos = uploadedPhotos
    body.imagem_url = uploadedPhotos[0]
  }

  const response = await apiRequest(`/quadras/${quadra.id}`, {
    method: 'PUT',
    token,
    body,
  })

  return normalizeCourt(response.quadra)
}

export async function deleteCourt(token, quadraId) {
  return apiRequest(`/quadras/${quadraId}`, {
    method: 'DELETE',
    token,
  })
}

export async function createSchedule(token, quadra, schedule) {
  const body = {
    hora_inicio: schedule.hora_inicio,
    hora_fim: schedule.hora_fim,
    valor: Number(schedule.valor || quadra.preco_hora || 0),
  }

  if (schedule.data) {
    body.data = schedule.data
  } else {
    body.dia_semana = Number(schedule.dia_semana)
  }

  const response = await apiRequest(`/quadras/${quadra.id}/horarios`, {
    method: 'POST',
    token,
    body,
  })

  return response.horario
}

export async function updateScheduleAvailability(token, quadraId, horarioId, disponivel) {
  const response = await apiRequest(`/quadras/${quadraId}/horarios/${horarioId}/disponibilidade`, {
    method: 'PATCH',
    token,
    body: { disponivel },
  })

  return response.horario
}

export async function deleteSchedule(token, quadraId, horarioId) {
  return apiRequest(`/quadras/${quadraId}/horarios/${horarioId}`, {
    method: 'DELETE',
    token,
  })
}

export async function updateReservationStatus(token, reservaId, status) {
  const response = await apiRequest(`/reservas/${reservaId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })

  return response.reserva
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
